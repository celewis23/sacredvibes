namespace SacredVibes.Application.Features.Newsletters;

public interface INewsletterDispatchService
{
    Task<List<Guid>> GetDueNewsletterIdsAsync(int take, CancellationToken ct = default);
    Task DispatchOneAsync(Guid newsletterId, int maxRecipientsThisTick, CancellationToken ct = default);
}
