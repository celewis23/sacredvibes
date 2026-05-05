using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Features.Studio;
using SacredVibes.Application.Features.Studio.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Studio;

public class StudioService : IStudioService
{
    private readonly AppDbContext _db;

    private static readonly Dictionary<StudioCategoryType, string> CategoryLabels = new()
    {
        [StudioCategoryType.SoundHealing]       = "Sound Healing",
        [StudioCategoryType.YogaFlows]          = "Yoga Flows",
        [StudioCategoryType.Breathwork]         = "Breathwork",
        [StudioCategoryType.GuidedMeditation]   = "Guided Meditation",
        [StudioCategoryType.CeremoniesAndRituals] = "Ceremonies & Rituals",
        [StudioCategoryType.EnergyWork]         = "Energy Work",
    };

    public StudioService(AppDbContext db) => _db = db;

    public async Task<StudioLibraryDto> GetLibraryAsync(string? userId, CancellationToken ct = default)
    {
        var userTier = userId is not null ? await GetUserTierAsync(userId, ct) : StudioTier.Free;

        var content = await _db.StudioContent
            .Include(c => c.Asset)
            .Include(c => c.ThumbnailAsset)
            .Where(c => c.IsPublished)
            .OrderBy(c => c.Category)
            .ThenBy(c => c.SortOrder)
            .ToListAsync(ct);

        var categories = CategoryLabels
            .OrderBy(kvp => kvp.Key)
            .Select(kvp => new StudioCategoryDto
            {
                Type  = kvp.Key.ToString(),
                Label = kvp.Value,
                Items = content
                    .Where(c => c.Category == kvp.Key)
                    .Select(c => MapToDto(c, userTier))
                    .ToList()
            })
            .Where(cat => cat.Items.Count > 0)
            .ToList();

        return new StudioLibraryDto
        {
            UserTier   = userTier.ToString(),
            Categories = categories,
        };
    }

    public async Task<StudioContentDto?> GetContentAsync(Guid contentId, string? userId, CancellationToken ct = default)
    {
        var userTier = userId is not null ? await GetUserTierAsync(userId, ct) : StudioTier.Free;
        var content  = await _db.StudioContent
            .Include(c => c.Asset)
            .Include(c => c.ThumbnailAsset)
            .FirstOrDefaultAsync(c => c.Id == contentId && c.IsPublished, ct);

        return content is null ? null : MapToDto(content, userTier);
    }

    public async Task<string?> GetStreamUrlAsync(Guid contentId, string userId, CancellationToken ct = default)
    {
        var userTier = await GetUserTierAsync(userId, ct);
        var content  = await _db.StudioContent
            .Include(c => c.Asset)
            .FirstOrDefaultAsync(c => c.Id == contentId && c.IsPublished, ct);

        if (content is null) return null;
        if (userTier < content.RequiredTier) return null;
        return content.Asset?.PublicUrl;
    }

    public async Task<MemberSubscriptionDto> GetSubscriptionAsync(string userId, CancellationToken ct = default)
    {
        var sub = await _db.MemberSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (sub is null)
            return new MemberSubscriptionDto { Tier = "Free", Status = "Active", IsActive = true };

        return new MemberSubscriptionDto
        {
            Tier             = sub.Tier.ToString(),
            Status           = sub.Status.ToString(),
            CurrentPeriodEnd = sub.CurrentPeriodEnd,
            IsActive         = sub.Status is SubscriptionStatus.Active or SubscriptionStatus.Trialing,
        };
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public async Task<List<StudioContentDto>> AdminListContentAsync(CancellationToken ct = default)
    {
        var items = await _db.StudioContent
            .Include(c => c.Asset)
            .Include(c => c.ThumbnailAsset)
            .OrderBy(c => c.Category)
            .ThenBy(c => c.SortOrder)
            .ToListAsync(ct);

        return items.Select(c => MapToDto(c, StudioTier.Devotee)).ToList();
    }

    public async Task<StudioContentDto> AdminCreateContentAsync(CreateStudioContentRequest request, CancellationToken ct = default)
    {
        var content = new StudioContent
        {
            Title           = request.Title,
            Description     = request.Description,
            Category        = Enum.Parse<StudioCategoryType>(request.Category),
            RequiredTier    = Enum.Parse<StudioTier>(request.RequiredTier),
            Duration        = request.Duration,
            AssetId         = request.AssetId,
            ThumbnailAssetId = request.ThumbnailAssetId,
            IsPublished     = request.IsPublished,
            SortOrder       = request.SortOrder,
        };

        _db.StudioContent.Add(content);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(content).Reference(c => c.Asset).LoadAsync(ct);
        await _db.Entry(content).Reference(c => c.ThumbnailAsset).LoadAsync(ct);
        return MapToDto(content, StudioTier.Devotee);
    }

    public async Task<StudioContentDto> AdminUpdateContentAsync(Guid id, UpdateStudioContentRequest request, CancellationToken ct = default)
    {
        var content = await _db.StudioContent.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("Content not found");

        content.Title           = request.Title;
        content.Description     = request.Description;
        content.Category        = Enum.Parse<StudioCategoryType>(request.Category);
        content.RequiredTier    = Enum.Parse<StudioTier>(request.RequiredTier);
        content.Duration        = request.Duration;
        content.AssetId         = request.AssetId;
        content.ThumbnailAssetId = request.ThumbnailAssetId;
        content.IsPublished     = request.IsPublished;
        content.SortOrder       = request.SortOrder;

        await _db.SaveChangesAsync(ct);
        await _db.Entry(content).Reference(c => c.Asset).LoadAsync(ct);
        await _db.Entry(content).Reference(c => c.ThumbnailAsset).LoadAsync(ct);
        return MapToDto(content, StudioTier.Devotee);
    }

    public async Task AdminDeleteContentAsync(Guid id, CancellationToken ct = default)
    {
        var content = await _db.StudioContent.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("Content not found");
        content.IsDeleted  = true;
        content.DeletedAt  = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task AdminTogglePublishedAsync(Guid id, CancellationToken ct = default)
    {
        var content = await _db.StudioContent.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("Content not found");
        content.IsPublished = !content.IsPublished;
        await _db.SaveChangesAsync(ct);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<StudioTier> GetUserTierAsync(string userId, CancellationToken ct)
    {
        var sub = await _db.MemberSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (sub is null || sub.Status is not (SubscriptionStatus.Active or SubscriptionStatus.Trialing))
            return StudioTier.Free;

        return sub.Tier;
    }

    private static StudioContentDto MapToDto(StudioContent c, StudioTier userTier)
    {
        var locked = userTier < c.RequiredTier;
        return new StudioContentDto
        {
            Id           = c.Id,
            Title        = c.Title,
            Description  = c.Description,
            Category     = c.Category.ToString(),
            RequiredTier = c.RequiredTier.ToString(),
            Duration     = c.Duration,
            ThumbnailUrl = c.ThumbnailAsset?.PublicUrl,
            IsPublished  = c.IsPublished,
            SortOrder    = c.SortOrder,
            Locked       = locked,
            StreamUrl    = locked ? null : c.Asset?.PublicUrl,
        };
    }
}
