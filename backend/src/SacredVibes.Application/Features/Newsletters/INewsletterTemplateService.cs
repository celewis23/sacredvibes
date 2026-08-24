using SacredVibes.Application.Features.Newsletters.DTOs;

namespace SacredVibes.Application.Features.Newsletters;

public interface INewsletterTemplateService
{
    Task<List<NewsletterTemplateDto>> GetAllAsync(CancellationToken ct = default);
    Task<NewsletterTemplateDto?> GetAsync(Guid id, CancellationToken ct = default);
    Task<NewsletterTemplateDto> CreateAsync(SaveNewsletterTemplateRequest request, CancellationToken ct = default);
    Task<NewsletterTemplateDto> UpdateAsync(Guid id, SaveNewsletterTemplateRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
