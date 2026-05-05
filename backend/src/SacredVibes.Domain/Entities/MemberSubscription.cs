using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class MemberSubscription : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public StudioTier Tier { get; set; } = StudioTier.Free;
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    // Stripe identifiers
    public string? StripeSubscriptionId { get; set; }
    public string? StripeCustomerId { get; set; }

    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Raw last Stripe event for debugging
    public string? RawEventJson { get; set; }
}
