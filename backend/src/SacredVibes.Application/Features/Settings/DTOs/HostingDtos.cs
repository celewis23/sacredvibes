namespace SacredVibes.Application.Features.Settings.DTOs;

public record VercelHostingConfigDto(
    bool IsConfigured,
    bool HasApiToken,
    string? TeamId,
    string? ProjectId,
    string? RailwayApiUrl,
    string? RenderApiUrl
);

public record SaveVercelHostingConfigRequest(
    string? ApiToken,
    string? TeamId,
    string? ProjectId,
    string? RailwayApiUrl,
    string? RenderApiUrl
);

public record ApiHostStatusDto(string? Host, DateTime? SwitchedAt);

public record SwitchApiHostRequest(string Target);
