using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SacredVibes.Application.Features.Security;
using SacredVibes.Application.Features.Settings;
using SacredVibes.Application.Features.Settings.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Settings;

public class AdminAssistantSettingsService : IAdminAssistantSettingsService
{
    private const string IntegrationProvider = "AdminAssistant";
    private const string OpenAI = "OpenAI";
    private const string Anthropic = "Anthropic";
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ICredentialProtector _credentialProtector;

    public AdminAssistantSettingsService(AppDbContext db, IConfiguration config, ICredentialProtector credentialProtector)
    {
        _db = db;
        _config = config;
        _credentialProtector = credentialProtector;
    }

    public async Task<AdminAssistantSettingsDto> GetSettingsAsync(CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var stored = ReadSettings(setting);
        return ToDto(setting, stored);
    }

    public async Task<AdminAssistantSettingsDto> SaveSettingsAsync(SaveAdminAssistantSettingsRequest request, CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var existing = ReadSettings(setting);
        var provider = NormalizeProvider(request.Provider);
        var model = NormalizeModel(provider, request.Model);

        var next = new StoredAdminAssistantSettings
        {
            Provider = provider,
            Model = model,
            ImageModel = Normalize(request.ImageModel) is { Length: > 0 } imageModel ? imageModel : DefaultImageModel(),
            ProtectedApiKey = string.IsNullOrWhiteSpace(request.ApiKey)
                ? existing.ProtectedApiKey
                : _credentialProtector.Protect(request.ApiKey.Trim())
        };

        setting.IsEnabled = request.IsEnabled;
        setting.SettingsJson = JsonSerializer.Serialize(next);
        setting.LastSyncAt = DateTime.UtcNow;
        setting.LastSyncResult = "Settings saved";
        await _db.SaveChangesAsync(ct);

        return ToDto(setting, next);
    }

    public async Task<ResolvedAdminAssistantSettingsDto> GetResolvedSettingsAsync(CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var stored = ReadSettings(setting);
        var provider = NormalizeProvider(stored.Provider);
        var model = NormalizeModel(provider, stored.Model);
        var apiKey = ResolveApiKey(provider, stored);

        return new ResolvedAdminAssistantSettingsDto
        {
            IsEnabled = setting.IsEnabled,
            Provider = provider,
            Model = model,
            ImageModel = Normalize(stored.ImageModel) is { Length: > 0 } imageModel ? imageModel : DefaultImageModel(),
            HasApiKey = !string.IsNullOrWhiteSpace(apiKey),
            ApiKey = apiKey,
            LastSyncAt = setting.LastSyncAt,
            LastSyncResult = setting.LastSyncResult
        };
    }

    private async Task<IntegrationSetting> GetOrCreateSettingAsync(CancellationToken ct)
    {
        var setting = await _db.IntegrationSettings.FirstOrDefaultAsync(i => i.Provider == IntegrationProvider, ct);
        if (setting is not null) return setting;

        var defaultProvider = NormalizeProvider(_config["AdminAssistant:Provider"] ?? Environment.GetEnvironmentVariable("ADMIN_ASSISTANT_PROVIDER") ?? OpenAI);
        var defaultModel = _config["AdminAssistant:Model"] ?? Environment.GetEnvironmentVariable("ADMIN_ASSISTANT_MODEL");
        var defaults = new StoredAdminAssistantSettings
        {
            Provider = defaultProvider,
            Model = NormalizeModel(defaultProvider, defaultModel),
            ImageModel = _config["AdminAssistant:ImageModel"] ?? Environment.GetEnvironmentVariable("ADMIN_ASSISTANT_IMAGE_MODEL") ?? DefaultImageModel()
        };

        setting = new IntegrationSetting
        {
            Provider = IntegrationProvider,
            SettingsJson = JsonSerializer.Serialize(defaults),
            IsEnabled = false
        };

        await _db.IntegrationSettings.AddAsync(setting, ct);
        await _db.SaveChangesAsync(ct);
        return setting;
    }

    private AdminAssistantSettingsDto ToDto(IntegrationSetting setting, StoredAdminAssistantSettings stored)
    {
        var provider = NormalizeProvider(stored.Provider);
        var apiKey = ResolveApiKey(provider, stored);
        return new AdminAssistantSettingsDto
        {
            IsEnabled = setting.IsEnabled,
            Provider = provider,
            Model = NormalizeModel(provider, stored.Model),
            ImageModel = Normalize(stored.ImageModel) is { Length: > 0 } imageModel ? imageModel : DefaultImageModel(),
            HasApiKey = !string.IsNullOrWhiteSpace(apiKey),
            LastSyncAt = setting.LastSyncAt,
            LastSyncResult = setting.LastSyncResult
        };
    }

    private StoredAdminAssistantSettings ReadSettings(IntegrationSetting setting)
    {
        try
        {
            return JsonSerializer.Deserialize<StoredAdminAssistantSettings>(setting.SettingsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new StoredAdminAssistantSettings();
        }
        catch
        {
            return new StoredAdminAssistantSettings();
        }
    }

    private string ResolveApiKey(string provider, StoredAdminAssistantSettings stored)
    {
        var overrideKey = Environment.GetEnvironmentVariable("ADMIN_ASSISTANT_API_KEY")
            ?? _config["AdminAssistant:ApiKey"];
        if (!string.IsNullOrWhiteSpace(overrideKey)) return overrideKey;

        var providerKey = provider == Anthropic
            ? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY") ?? _config["Anthropic:ApiKey"]
            : Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _config["OpenAI:ApiKey"];
        if (!string.IsNullOrWhiteSpace(providerKey)) return providerKey;

        if (string.IsNullOrWhiteSpace(stored.ProtectedApiKey)) return string.Empty;
        try { return _credentialProtector.Unprotect(stored.ProtectedApiKey); }
        catch { return string.Empty; }
    }

    private static string NormalizeProvider(string? value)
    {
        var provider = Normalize(value);
        if (provider.Equals("Claude", StringComparison.OrdinalIgnoreCase) ||
            provider.Equals("Anthropic", StringComparison.OrdinalIgnoreCase))
            return Anthropic;

        return OpenAI;
    }

    private static string NormalizeModel(string provider, string? value)
    {
        var model = Normalize(value);
        if (model.StartsWith("openai/", StringComparison.OrdinalIgnoreCase))
            model = model["openai/".Length..];
        if (model.StartsWith("anthropic/", StringComparison.OrdinalIgnoreCase))
            model = model["anthropic/".Length..];

        return model.Length > 0 ? model : DefaultModel(provider);
    }

    private static string DefaultModel(string provider) =>
        provider == Anthropic ? "claude-sonnet-4-6" : "gpt-5.5";

    private static string DefaultImageModel() => "gpt-image-2";

    private static string Normalize(string? value) => value?.Trim() ?? string.Empty;

    private class StoredAdminAssistantSettings
    {
        public string Provider { get; set; } = OpenAI;
        public string Model { get; set; } = "gpt-5.5";
        public string ImageModel { get; set; } = "gpt-image-2";
        public string ProtectedApiKey { get; set; } = string.Empty;
    }
}
