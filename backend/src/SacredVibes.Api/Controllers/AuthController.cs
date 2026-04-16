using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Auth;
using SacredVibes.Application.Features.Auth.DTOs;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(
        [FromBody] LoginRequest request, CancellationToken ct)
    {
        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _auth.LoginAsync(request, ip, ct);
            return Ok(ApiResponse<AuthResponse>.Ok(result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<AuthResponse>.Fail(ex.Message));
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Refresh(
        [FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _auth.RefreshTokenAsync(request.RefreshToken, ip, ct);
            return Ok(ApiResponse<AuthResponse>.Ok(result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<AuthResponse>.Fail(ex.Message));
        }
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auth.RevokeTokenAsync(request.RefreshToken, ip, ct);
        return Ok(new { message = "Logged out successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> Me(CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (userId is null) return Unauthorized();

        var profile = await _auth.GetUserProfileAsync(userId, ct);
        return profile is null ? NotFound() : Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult> UpdateProfile([FromBody] UserProfileDto profile, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (userId is null) return Unauthorized();

        await _auth.UpdateUserProfileAsync(userId, profile, ct);
        return Ok(new { message = "Profile updated" });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (userId is null) return Unauthorized();

        try
        {
            await _auth.ChangePasswordAsync(userId, request, ct);
            return Ok(new { message = "Password changed" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        await _auth.ForgotPasswordAsync(request, ct);
        return Ok(new { message = "If that email exists, a reset link was sent." });
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        try
        {
            await _auth.ResetPasswordAsync(request, ct);
            return Ok(new { message = "Password reset successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> CreateUser(
        [FromBody] CreateAdminUserRequest request, CancellationToken ct)
    {
        try
        {
            var user = await _auth.CreateAdminUserAsync(request, ct);
            return Ok(ApiResponse<UserProfileDto>.Ok(user));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<UserProfileDto>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<AdminUserDto>>>> GetUsers(CancellationToken ct)
    {
        var userManager = HttpContext.RequestServices
            .GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<SacredVibes.Domain.Entities.ApplicationUser>>();

        var users = userManager.Users
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .AsEnumerable()
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email ?? "",
                FirstName = u.FirstName,
                LastName = u.LastName,
                FullName = u.FullName,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                LastLoginAt = u.LastLoginAt,
                CreatedAt = u.CreatedAt
            })
            .ToList();

        return Ok(ApiResponse<List<AdminUserDto>>.Ok(users));
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("users/{userId}/active")]
    public async Task<ActionResult> SetUserActive(string userId, [FromBody] SetUserActiveRequest req, CancellationToken ct)
    {
        var userManager = HttpContext.RequestServices
            .GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<SacredVibes.Domain.Entities.ApplicationUser>>();

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        user.IsActive = req.IsActive;
        await userManager.UpdateAsync(user);
        return Ok(new { message = req.IsActive ? "User activated" : "User deactivated" });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("users/{userId}")]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> UpdateAdminUser(
        string userId, [FromBody] UpdateAdminUserRequest req, CancellationToken ct)
    {
        var userManager = HttpContext.RequestServices
            .GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<SacredVibes.Domain.Entities.ApplicationUser>>();

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound(ApiResponse<AdminUserDto>.Fail("User not found"));

        user.FirstName = req.FirstName;
        user.LastName = req.LastName;
        user.Email = req.Email;
        user.UserName = req.Email;
        user.NormalizedEmail = req.Email.ToUpperInvariant();
        user.NormalizedUserName = req.Email.ToUpperInvariant();

        if (Enum.TryParse<SacredVibes.Domain.Enums.UserRole>(req.Role, ignoreCase: true, out var role))
            user.Role = role;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return BadRequest(ApiResponse<AdminUserDto>.Fail(
                updateResult.Errors.Select(e => e.Description)));

        if (!string.IsNullOrWhiteSpace(req.Password))
        {
            await userManager.RemovePasswordAsync(user);
            var pwResult = await userManager.AddPasswordAsync(user, req.Password);
            if (!pwResult.Succeeded)
                return BadRequest(ApiResponse<AdminUserDto>.Fail(
                    pwResult.Errors.Select(e => e.Description)));
        }

        var dto = new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt,
        };

        return Ok(ApiResponse<AdminUserDto>.Ok(dto));
    }
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record SetUserActiveRequest(bool IsActive);
