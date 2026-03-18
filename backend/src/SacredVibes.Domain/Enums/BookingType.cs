namespace SacredVibes.Domain.Enums;

public enum BookingType
{
    YogaClass = 0,
    YogaWorkshop = 1,
    YogaEvent = 2,
    YogaRetreat = 3,
    MassageService = 4,
    SoundHealingClass = 5,
    SoundHealingWorkshop = 6,
    SoundHealingEvent = 7,
    SoundOnTheRiver = 8,
    General = 99
}

public enum PriceType
{
    Fixed = 0,
    Variable = 1,
    Free = 2,
    Donation = 3,
    SlidingScale = 4
}

public enum ConsentStatus
{
    Unknown = 0,
    Subscribed = 1,
    Unsubscribed = 2,
    Bounced = 3,
    Complained = 4
}

public enum UserRole
{
    Admin = 0,
    Editor = 1,
    Manager = 2
}
