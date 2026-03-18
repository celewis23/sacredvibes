namespace SacredVibes.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserEmail { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
    string? IpAddress { get; }
    string? UserAgent { get; }
}

public interface IAuditService
{
    Task LogAsync(string action, string entityType, string? entityId = null,
        object? oldValues = null, object? newValues = null, bool success = true,
        string? errorMessage = null, CancellationToken ct = default);
}
