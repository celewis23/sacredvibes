using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Features.Settings;
using SacredVibes.Application.Features.Settings.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Settings;

public class SocialLinksService : ISocialLinksService
{
    private const string IntegrationProvider = "SocialLinks";
    private readonly AppDbContext _db;

    public SocialLinksService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<SocialLinksDto> GetSettingsAsync(CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var stored = ReadSettings(setting);
        return ToDto(stored);
    }

    public async Task<SocialLinksDto> SaveSettingsAsync(SaveSocialLinksRequest request, CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var next = new StoredSocialLinks
        {
            Instagram = Normalize(request.Instagram),
            Facebook = Normalize(request.Facebook),
            YouTube = Normalize(request.YouTube),
            TikTok = Normalize(request.TikTok),
            BioBox = Normalize(request.BioBox)
        };

        setting.SettingsJson = JsonSerializer.Serialize(next);
        setting.IsEnabled = true;
        setting.LastSyncAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ToDto(next);
    }

    private async Task<IntegrationSetting> GetOrCreateSettingAsync(CancellationToken ct)
    {
        var setting = await _db.IntegrationSettings.FirstOrDefaultAsync(i => i.Provider == IntegrationProvider, ct);
        if (setting is not null) return setting;

        setting = new IntegrationSetting
        {
            Provider = IntegrationProvider,
            SettingsJson = JsonSerializer.Serialize(new StoredSocialLinks()),
            IsEnabled = false
        };

        await _db.IntegrationSettings.AddAsync(setting, ct);
        await _db.SaveChangesAsync(ct);
        return setting;
    }

    private static SocialLinksDto ToDto(StoredSocialLinks stored) => new()
    {
        Instagram = NullIfEmpty(stored.Instagram),
        Facebook = NullIfEmpty(stored.Facebook),
        YouTube = NullIfEmpty(stored.YouTube),
        TikTok = NullIfEmpty(stored.TikTok),
        BioBox = NullIfEmpty(stored.BioBox)
    };

    private static StoredSocialLinks ReadSettings(IntegrationSetting setting)
    {
        try
        {
            return JsonSerializer.Deserialize<StoredSocialLinks>(setting.SettingsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new StoredSocialLinks();
        }
        catch
        {
            return new StoredSocialLinks();
        }
    }

    private static string Normalize(string? value) => value?.Trim() ?? string.Empty;
    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value;

    private class StoredSocialLinks
    {
        public string Instagram { get; set; } = string.Empty;
        public string Facebook { get; set; } = string.Empty;
        public string YouTube { get; set; } = string.Empty;
        public string TikTok { get; set; } = string.Empty;
        public string BioBox { get; set; } = string.Empty;
    }
}
