using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Settings.DTOs;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thisWeekStart = now.AddDays(-(int)now.DayOfWeek);

        var stats = new DashboardStatsDto
        {
            TotalSubscribers = await _db.Subscribers.CountAsync(s => s.IsSubscribed, ct),
            NewSubscribersThisMonth = await _db.Subscribers.CountAsync(s => s.CreatedAt >= thisMonthStart, ct),

            TotalLeads = await _db.Leads.CountAsync(ct),
            NewLeadsThisWeek = await _db.Leads.CountAsync(l => l.CreatedAt >= thisWeekStart, ct),

            TotalBookings = await _db.Bookings.CountAsync(ct),
            PendingBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Pending, ct),

            TotalAssets = await _db.Assets.CountAsync(ct),
            TotalStorageBytes = await _db.Assets.SumAsync(a => (long?)a.FileSize, ct) ?? 0,

            TotalBlogPosts = await _db.BlogPosts.CountAsync(ct),
            PublishedBlogPosts = await _db.BlogPosts.CountAsync(p => p.Status == ContentStatus.Published, ct),

            RevenueThisMonth = await _db.PaymentRecords
                .Where(p => p.Status == PaymentStatus.Completed && p.CreatedAt >= thisMonthStart)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0,

            RevenueTotal = await _db.PaymentRecords
                .Where(p => p.Status == PaymentStatus.Completed)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0,

            RecentBookings = await _db.Bookings
                .Include(b => b.Brand)
                .OrderByDescending(b => b.CreatedAt)
                .Take(5)
                .Select(b => new RecentBookingDto
                {
                    Id = b.Id,
                    CustomerName = b.CustomerName,
                    CustomerEmail = b.CustomerEmail,
                    Amount = b.Amount,
                    Status = b.Status.ToString(),
                    BrandName = b.Brand.Name,
                    CreatedAt = b.CreatedAt
                })
                .ToListAsync(ct),

            RecentLeads = await _db.Leads
                .Include(l => l.Brand)
                .OrderByDescending(l => l.CreatedAt)
                .Take(5)
                .Select(l => new RecentLeadDto
                {
                    Id = l.Id,
                    Name = (l.FirstName + " " + l.LastName).Trim(),
                    Email = l.Email,
                    Type = l.Type.ToString(),
                    BrandName = l.Brand.Name,
                    CreatedAt = l.CreatedAt
                })
                .ToListAsync(ct),

            RecentImports = await _db.ImportJobs
                .OrderByDescending(j => j.CreatedAt)
                .Take(5)
                .Select(j => new RecentImportDto
                {
                    Id = j.Id,
                    Source = j.Source.ToString(),
                    TotalRows = j.TotalRows,
                    InsertedCount = j.InsertedCount,
                    Status = j.Status.ToString(),
                    CreatedAt = j.CreatedAt
                })
                .ToListAsync(ct)
        };

        return Ok(ApiResponse<DashboardStatsDto>.Ok(stats));
    }

    [HttpGet("brands")]
    public async Task<ActionResult<ApiResponse<List<BrandDto>>>> GetBrands(CancellationToken ct = default)
    {
        var brands = await _db.Brands
            .OrderBy(b => b.SortOrder)
            .Select(b => new BrandDto
            {
                Id = b.Id,
                Name = b.Name,
                Slug = b.Slug,
                Type = b.Type.ToString(),
                Subdomain = b.Subdomain,
                Description = b.Description,
                Tagline = b.Tagline,
                LogoPath = b.LogoPath,
                ThemeSettingsJson = b.ThemeSettingsJson,
                SeoSettingsJson = b.SeoSettingsJson,
                IsActive = b.IsActive,
                SortOrder = b.SortOrder
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<BrandDto>>.Ok(brands));
    }
}
