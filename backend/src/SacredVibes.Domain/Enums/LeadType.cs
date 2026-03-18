namespace SacredVibes.Domain.Enums;

public enum LeadType
{
    ContactForm = 0,
    NewsletterSignup = 1,
    WorkshopInterest = 2,
    MassageInquiry = 3,
    SoundOnTheRiverInterest = 4,
    EventRegistration = 5,
    GeneralInquiry = 6,
    BookingRequest = 7
}

public enum LeadStatus
{
    New = 0,
    Contacted = 1,
    Qualified = 2,
    Converted = 3,
    Closed = 4,
    Spam = 5
}
