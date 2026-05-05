namespace SacredVibes.Domain.Enums;

public enum StudioTier
{
    Free = 0,    // Explorer plan
    Seeker = 1,  // $33/month
    Devotee = 2  // $88/month
}

public enum SubscriptionStatus
{
    Active = 0,
    Trialing = 1,
    PastDue = 2,
    Cancelled = 3,
    Incomplete = 4
}

public enum StudioCategoryType
{
    SoundHealing = 0,
    YogaFlows = 1,
    Breathwork = 2,
    GuidedMeditation = 3,
    CeremoniesAndRituals = 4,
    EnergyWork = 5
}
