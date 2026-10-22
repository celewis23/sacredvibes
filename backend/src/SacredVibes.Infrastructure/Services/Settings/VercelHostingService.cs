using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Features.Security;
using SacredVibes.Application.Features.Settings;
using SacredVibes.Application.Features.Settings.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Settings;

/// <summary>
/// Admin-only: switches which API host (Railway vs. the Render failover standby) the live
/// Vercel frontend points at, by flipping the NEXT_PUBLIC_API_URL production env var and
/// triggering a redeploy. Config/credentials stored the same way as AdminAssistantSettingsService
/// (a single IntegrationSetting row, JSON blob, secret protected via ICredentialProtector) — kept
/// out of the shared SettingsController/IntegrationSetting rows other features use, with its own
/// HostingController, so non-Admin roles can't reach it.
/// </summary>
public class VercelHostingService : IVercelHostingService
{
    private const string IntegrationProvider = "VercelHosting";
    private const string EnvVarName = "NEXT_PUBLIC_API_URL";
    private const string VercelApiBaseUrl = "https://api.vercel.com";

    private readonly AppDbContext _db;
    private readonly HttpClient _httpClient;
    private readonly ICredentialProtector _credentialProtector;

    public VercelHostingService(AppDbContext db, HttpClient httpClient, ICredentialProtector credentialProtector)
    {
        _db = db;
        _httpClient = httpClient;
        _credentialProtector = credentialProtector;
    }

    public async Task<VercelHostingConfigDto> GetConfigAsync(CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var stored = ReadSettings(setting);
        return ToConfigDto(stored);
    }

    public async Task<VercelHostingConfigDto> SaveConfigAsync(SaveVercelHostingConfigRequest request, CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var existing = ReadSettings(setting);

        var next = new StoredVercelHostingSettings
        {
            ProtectedApiToken = string.IsNullOrWhiteSpace(request.ApiToken)
                ? existing.ProtectedApiToken
                : _credentialProtector.Protect(request.ApiToken.Trim()),
            TeamId = Normalize(request.TeamId) is { Length: > 0 } teamId ? teamId : existing.TeamId,
            ProjectId = Normalize(request.ProjectId) is { Length: > 0 } projectId ? projectId : existing.ProjectId,
            RailwayApiUrl = Normalize(request.RailwayApiUrl) is { Length: > 0 } railwayUrl ? railwayUrl : existing.RailwayApiUrl,
            RenderApiUrl = Normalize(request.RenderApiUrl) is { Length: > 0 } renderUrl ? renderUrl : existing.RenderApiUrl,
            ActiveHost = existing.ActiveHost,
            SwitchedAt = existing.SwitchedAt,
        };

        setting.SettingsJson = JsonSerializer.Serialize(next);
        setting.LastSyncAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ToConfigDto(next);
    }

    public async Task<ApiHostStatusDto> GetApiHostAsync(CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var stored = ReadSettings(setting);
        return new ApiHostStatusDto(stored.ActiveHost, stored.SwitchedAt);
    }

    public async Task<ApiHostStatusDto> SwitchApiHostAsync(string target, CancellationToken ct = default)
    {
        if (target is not ("railway" or "render"))
        {
            throw new ArgumentException("Target must be 'railway' or 'render'.", nameof(target));
        }

        var setting = await GetOrCreateSettingAsync(ct);
        var stored = ReadSettings(setting);

        var apiToken = RequireValue(UnprotectOrNull(stored.ProtectedApiToken), "Vercel API Token");
        var teamId = RequireValue(stored.TeamId, "Vercel Team ID");
        var projectId = RequireValue(stored.ProjectId, "Vercel Project ID");
        var newUrl = RequireValue(
            target == "railway" ? stored.RailwayApiUrl : stored.RenderApiUrl,
            target == "railway" ? "Railway API URL" : "Render API URL");

        var envVarId = await FindProductionEnvVarIdAsync(apiToken, teamId, projectId, ct);
        await UpdateEnvVarAsync(apiToken, teamId, projectId, envVarId, newUrl, ct);

        var deploymentId = await FindLatestProductionDeploymentIdAsync(apiToken, teamId, projectId, ct);
        await TriggerRedeployAsync(apiToken, teamId, projectId, deploymentId, ct);

        stored.ActiveHost = target;
        stored.SwitchedAt = DateTime.UtcNow;
        setting.SettingsJson = JsonSerializer.Serialize(stored);
        setting.LastSyncAt = DateTime.UtcNow;
        setting.LastSyncResult = $"Switched to {target}";
        await _db.SaveChangesAsync(ct);

        return new ApiHostStatusDto(stored.ActiveHost, stored.SwitchedAt);
    }

    private async Task<IntegrationSetting> GetOrCreateSettingAsync(CancellationToken ct)
    {
        var setting = await _db.IntegrationSettings.FirstOrDefaultAsync(i => i.Provider == IntegrationProvider, ct);
        if (setting is not null) return setting;

        setting = new IntegrationSetting
        {
            Provider = IntegrationProvider,
            SettingsJson = JsonSerializer.Serialize(new StoredVercelHostingSettings()),
            IsEnabled = false,
        };

        await _db.IntegrationSettings.AddAsync(setting, ct);
        await _db.SaveChangesAsync(ct);
        return setting;
    }

    private static StoredVercelHostingSettings ReadSettings(IntegrationSetting setting)
    {
        try
        {
            return JsonSerializer.Deserialize<StoredVercelHostingSettings>(setting.SettingsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            }) ?? new StoredVercelHostingSettings();
        }
        catch
        {
            return new StoredVercelHostingSettings();
        }
    }

    private VercelHostingConfigDto ToConfigDto(StoredVercelHostingSettings stored)
    {
        var hasApiToken = !string.IsNullOrWhiteSpace(stored.ProtectedApiToken);
        var isConfigured = hasApiToken
            && !string.IsNullOrWhiteSpace(stored.TeamId)
            && !string.IsNullOrWhiteSpace(stored.ProjectId)
            && !string.IsNullOrWhiteSpace(stored.RailwayApiUrl)
            && !string.IsNullOrWhiteSpace(stored.RenderApiUrl);

        return new VercelHostingConfigDto(isConfigured, hasApiToken, stored.TeamId, stored.ProjectId, stored.RailwayApiUrl, stored.RenderApiUrl);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private string? UnprotectOrNull(string? protectedValue)
    {
        if (string.IsNullOrWhiteSpace(protectedValue)) return null;
        try { return _credentialProtector.Unprotect(protectedValue); }
        catch { return null; }
    }

    private static string RequireValue(string? value, string label)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{label} is not configured. Set it on the admin Settings page.");
        }

        return value;
    }

    private async Task<string> FindProductionEnvVarIdAsync(string apiToken, string teamId, string projectId, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{VercelApiBaseUrl}/v10/projects/{projectId}/env?teamId={teamId}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

        using var response = await _httpClient.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Vercel env list failed ({(int)response.StatusCode}): {body}");
        }

        using var json = JsonDocument.Parse(body);
        foreach (var env in json.RootElement.GetProperty("envs").EnumerateArray())
        {
            var key = env.GetProperty("key").GetString();
            var targets = env.TryGetProperty("target", out var t)
                ? t.EnumerateArray().Select(x => x.GetString()).ToList()
                : [];

            if (key == EnvVarName && targets.Contains("production"))
            {
                return env.GetProperty("id").GetString()
                    ?? throw new InvalidOperationException($"{EnvVarName} env var has no id.");
            }
        }

        throw new InvalidOperationException($"No production '{EnvVarName}' env var found on this Vercel project.");
    }

    private async Task UpdateEnvVarAsync(string apiToken, string teamId, string projectId, string envVarId, string newValue, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Patch,
            $"{VercelApiBaseUrl}/v10/projects/{projectId}/env/{envVarId}?teamId={teamId}")
        {
            Content = JsonContent.Create(new { value = newValue }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

        using var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Vercel env update failed ({(int)response.StatusCode}): {body}");
        }
    }

    private async Task<string> FindLatestProductionDeploymentIdAsync(string apiToken, string teamId, string projectId, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{VercelApiBaseUrl}/v6/deployments?projectId={projectId}&target=production&teamId={teamId}&limit=1");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

        using var response = await _httpClient.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Vercel deployment lookup failed ({(int)response.StatusCode}): {body}");
        }

        using var json = JsonDocument.Parse(body);
        var deployments = json.RootElement.GetProperty("deployments");
        if (deployments.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("No production deployments found to redeploy from.");
        }

        return deployments[0].GetProperty("uid").GetString()
            ?? throw new InvalidOperationException("Latest deployment has no id.");
    }

    private async Task TriggerRedeployAsync(string apiToken, string teamId, string projectId, string deploymentId, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{VercelApiBaseUrl}/v13/deployments?teamId={teamId}&forceNew=1")
        {
            Content = JsonContent.Create(new
            {
                deploymentId,
                name = projectId,
                target = "production",
            }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

        using var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Vercel redeploy trigger failed ({(int)response.StatusCode}): {body}");
        }
    }

    private class StoredVercelHostingSettings
    {
        public string ProtectedApiToken { get; set; } = string.Empty;
        public string? TeamId { get; set; }
        public string? ProjectId { get; set; }
        public string? RailwayApiUrl { get; set; }
        public string? RenderApiUrl { get; set; }
        public string? ActiveHost { get; set; }
        public DateTime? SwitchedAt { get; set; }
    }
}
