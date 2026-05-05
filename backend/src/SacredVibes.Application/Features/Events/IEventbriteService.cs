using SacredVibes.Domain.Entities;

namespace SacredVibes.Application.Features.Events;

public interface IEventbriteService
{
    Task<EventbriteEventSyncResult> ImportEventsAsync(Guid brandId, CancellationToken ct = default);
    Task<EventbriteDiagnosticsResult> GetDiagnosticsAsync(CancellationToken ct = default);
    Task<EventbriteEventPushResult> PushEventAsync(Guid eventId, CancellationToken ct = default);
    Task<EventbriteEventSyncResult> PushEventsAsync(Guid? brandId = null, CancellationToken ct = default);
    Task<EventbriteEventDeleteResult> DeleteEventAsync(EventOffering ev, CancellationToken ct = default);
}

public class EventbriteEventSyncResult
{
    public int TotalFetched { get; set; }
    public int Inserted { get; set; }
    public int Updated { get; set; }
    public int Skipped { get; set; }
    public int Pushed { get; set; }
    public int Errors { get; set; }
    public List<string> ErrorMessages { get; set; } = new();
}

public class EventbriteEventPushResult
{
    public bool Success { get; set; }
    public string? EventbriteEventId { get; set; }
    public string? EventbriteUrl { get; set; }
    public string? Error { get; set; }
}

public class EventbriteEventDeleteResult
{
    public bool Success { get; set; }
    public string? EventbriteEventId { get; set; }
    public string? Error { get; set; }
}

public class EventbriteDiagnosticsResult
{
    public bool TokenConfigured { get; set; }
    public string? ConfiguredOrganizationId { get; set; }
    public string? ResolvedOrganizationId { get; set; }
    public int OrganizationCount { get; set; }
    public List<EventbriteOrganizationSummary> Organizations { get; set; } = new();
    public int SampleEventCount { get; set; }
    public List<EventbriteEventSummary> SampleEvents { get; set; } = new();
    public string? EventsEndpoint { get; set; }
    public string? Error { get; set; }
}

public class EventbriteOrganizationSummary
{
    public string? Id { get; set; }
    public string? Name { get; set; }
}

public class EventbriteEventSummary
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Status { get; set; }
    public DateTime? StartAt { get; set; }
    public string? Url { get; set; }
}
