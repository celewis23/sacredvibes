using SacredVibes.Domain.Entities;

namespace SacredVibes.Application.Features.Events;

public interface IEventbriteService
{
    Task<EventbriteEventSyncResult> ImportEventsAsync(Guid brandId, CancellationToken ct = default);
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
