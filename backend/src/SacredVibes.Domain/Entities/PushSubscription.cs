namespace SacredVibes.Domain.Entities;

public class PushSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public string Endpoint { get; set; } = string.Empty;
    public string P256dhKey { get; set; } = string.Empty;
    public string AuthKey { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
}
