using SacredVibes.Domain.Entities;

namespace SacredVibes.Application.Features.Subscribers;

public interface ISubscriberWelcomeEmailService
{
    // Fire-and-forget from the caller's perspective: never throws — failures are logged so the
    // subscriber-creation request (the lead form, an admin add) always succeeds regardless of
    // whether the welcome email itself could be sent.
    Task SendWelcomeEmailAsync(Subscriber subscriber, CancellationToken ct = default);
}
