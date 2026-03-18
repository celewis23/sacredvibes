using SacredVibes.Application.Features.Auth.DTOs;

namespace SacredVibes.Application.Features.Auth;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null, CancellationToken ct = default);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress = null, CancellationToken ct = default);
    Task RevokeTokenAsync(string refreshToken, string? ipAddress = null, CancellationToken ct = default);
    Task RevokeAllUserTokensAsync(string userId, CancellationToken ct = default);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
    Task<UserProfileDto> CreateAdminUserAsync(CreateAdminUserRequest request, CancellationToken ct = default);
    Task<UserProfileDto?> GetUserProfileAsync(string userId, CancellationToken ct = default);
    Task UpdateUserProfileAsync(string userId, UserProfileDto profile, CancellationToken ct = default);
}
