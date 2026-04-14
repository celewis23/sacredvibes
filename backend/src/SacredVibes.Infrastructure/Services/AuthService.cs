using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using SacredVibes.Application.Features.Auth;
using SacredVibes.Application.Features.Auth.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    private string JwtSecret => _config["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret not configured");
    private string JwtIssuer => _config["Jwt:Issuer"] ?? "SacredVibesApi";
    private string JwtAudience => _config["Jwt:Audience"] ?? "SacredVibesAdmin";
    private int JwtExpiryMinutes => int.TryParse(_config["Jwt:ExpiryMinutes"], out var m) ? m : 60;
    private int RefreshTokenExpiryDays => int.TryParse(_config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 30;

    public AuthService(UserManager<ApplicationUser> userManager, AppDbContext db, IConfiguration config, ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null, CancellationToken ct = default)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email)
                ?? throw new UnauthorizedAccessException("Invalid credentials");

            if (!user.IsActive)
                throw new UnauthorizedAccessException("Account is disabled");

            if (!await _userManager.CheckPasswordAsync(user, request.Password))
            {
                await _userManager.AccessFailedAsync(user);
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            await _userManager.ResetAccessFailedCountAsync(user);
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var accessToken = GenerateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id, ipAddress, request.DeviceInfo, ct);

            return BuildAuthResponse(accessToken, refreshToken, user);
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while logging in user {Email}", request.Email);
            throw;
        }
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress = null, CancellationToken ct = default)
    {
        var token = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken, ct)
            ?? throw new UnauthorizedAccessException("Invalid refresh token");

        if (!token.IsActive)
            throw new UnauthorizedAccessException("Refresh token is expired or revoked");

        if (!token.User.IsActive)
            throw new UnauthorizedAccessException("Account is disabled");

        // Rotate the refresh token
        var newRefreshToken = await CreateRefreshTokenAsync(token.UserId, ipAddress, token.DeviceInfo, ct);
        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;
        token.RevokedByIp = ipAddress;
        token.ReplacedByToken = newRefreshToken.Token;

        await _db.SaveChangesAsync(ct);

        var accessToken = GenerateAccessToken(token.User);
        return BuildAuthResponse(accessToken, newRefreshToken, token.User);
    }

    public async Task RevokeTokenAsync(string refreshToken, string? ipAddress = null, CancellationToken ct = default)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == refreshToken, ct);
        if (token is null || !token.IsActive) return;

        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;
        token.RevokedByIp = ipAddress;
        await _db.SaveChangesAsync(ct);
    }

    public async Task RevokeAllUserTokensAsync(string userId, CancellationToken ct = default)
    {
        var tokens = await _db.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync(ct);

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        await RevokeAllUserTokensAsync(userId, ct);
        return true;
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null) return true; // Don't reveal existence

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        _logger.LogInformation("Password reset token generated for {Email}: {Token}", request.Email, token);
        // TODO: Send email with reset link using email service
        // await _emailService.SendPasswordResetAsync(user.Email, token);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new KeyNotFoundException("User not found");

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        await RevokeAllUserTokensAsync(user.Id, ct);
        return true;
    }

    public async Task<UserProfileDto> CreateAdminUserAsync(CreateAdminUserRequest request, CancellationToken ct = default)
    {
        if (await _userManager.FindByEmailAsync(request.Email) is not null)
            throw new InvalidOperationException("Email already in use");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        var normalizedRole = request.Role is "Admin" or "Editor" or "Manager" ? request.Role : "Editor";
        await _userManager.AddToRoleAsync(user, normalizedRole);

        return MapToProfileDto(user);
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user is null ? null : MapToProfileDto(user);
    }

    public async Task UpdateUserProfileAsync(string userId, UserProfileDto profile, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        user.FirstName = profile.FirstName;
        user.LastName = profile.LastName;
        user.Bio = profile.Bio;
        user.Title = profile.Title;
        user.UpdatedAt = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string GenerateAccessToken(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("firstName", user.FirstName),
            new("lastName", user.LastName),
        };

        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: JwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(JwtExpiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<RefreshToken> CreateRefreshTokenAsync(string userId, string? ipAddress, string? deviceInfo, CancellationToken ct)
    {
        var token = new RefreshToken
        {
            UserId = userId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays),
            CreatedByIp = ipAddress,
            DeviceInfo = deviceInfo
        };

        await _db.RefreshTokens.AddAsync(token, ct);
        await _db.SaveChangesAsync(ct);
        return token;
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static AuthResponse BuildAuthResponse(string accessToken, RefreshToken refreshToken, ApplicationUser user) =>
        new()
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = refreshToken.ExpiresAt,
            User = MapToProfileDto(user)
        };

    private static UserProfileDto MapToProfileDto(ApplicationUser user) =>
        new()
        {
            Id = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            AvatarPath = user.AvatarPath,
            Bio = user.Bio,
            Title = user.Title
        };
}
