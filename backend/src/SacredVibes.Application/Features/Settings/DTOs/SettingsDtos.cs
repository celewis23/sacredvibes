namespace SacredVibes.Application.Features.Settings.DTOs;

public class DashboardStatsDto
{
    public int TotalSubscribers { get; set; }
    public int NewSubscribersThisMonth { get; set; }
    public int TotalLeads { get; set; }
    public int NewLeadsThisWeek { get; set; }
    public int TotalBookings { get; set; }
    public int PendingBookings { get; set; }
    public int TotalAssets { get; set; }
    public long TotalStorageBytes { get; set; }
    public int TotalBlogPosts { get; set; }
    public int PublishedBlogPosts { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public decimal RevenueTotal { get; set; }
    public List<RecentBookingDto> RecentBookings { get; set; } = new();
    public List<RecentLeadDto> RecentLeads { get; set; } = new();
    public List<RecentImportDto> RecentImports { get; set; } = new();
}

public class RecentBookingDto
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class RecentLeadDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string Type { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class RecentImportDto
{
    public Guid Id { get; set; }
    public string Source { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public int InsertedCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class BrandDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Tagline { get; set; }
    public string? LogoPath { get; set; }
    public string ThemeSettingsJson { get; set; } = "{}";
    public string SeoSettingsJson { get; set; } = "{}";
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public class LeadDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }
    public string? ServiceInterest { get; set; }
    public bool NewsletterOptIn { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLeadRequest
{
    public Guid BrandId { get; set; }
    public string Type { get; set; } = "ContactForm";
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }
    public string? ServiceInterest { get; set; }
    public string? PreferredDate { get; set; }
    public string? PreferredTime { get; set; }
    public string? ReferralSource { get; set; }
    public bool NewsletterOptIn { get; set; } = false;
    public string? HoneypotField { get; set; } // spam protection
}
