using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Newsletters.DTOs;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Application.Features.Newsletters;

public interface INewsletterService
{
    Task<PagedResult<NewsletterListItemDto>> GetAllAsync(int page, int pageSize, NewsletterStatus? status, CancellationToken ct = default);
    Task<NewsletterDto?> GetAsync(Guid id, CancellationToken ct = default);
    Task<NewsletterDto> CreateAsync(CreateNewsletterRequest request, CancellationToken ct = default);
    Task<NewsletterDto> UpdateAsync(Guid id, UpdateNewsletterRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<NewsletterDto> ScheduleAsync(Guid id, ScheduleNewsletterRequest request, CancellationToken ct = default);
    Task<NewsletterDto> CancelAsync(Guid id, CancellationToken ct = default);
    Task<NewsletterDto> SendNowAsync(Guid id, SendNewsletterNowRequest request, CancellationToken ct = default);
    Task SendTestAsync(Guid id, string testEmail, CancellationToken ct = default);
    Task<string> PreviewHtmlAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<NewsletterRecipientLogDto>> GetRecipientLogsAsync(Guid id, int page, int pageSize, CancellationToken ct = default);
}
