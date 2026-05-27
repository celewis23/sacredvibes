using SacredVibes.Application.Features.EmailTemplates.DTOs;

namespace SacredVibes.Application.Features.EmailTemplates;

public interface IEmailTemplateService
{
    Task<List<EmailTemplateDto>> GetAllTemplatesAsync(CancellationToken ct = default);
    Task<EmailTemplateDto?> GetTemplateAsync(string key, CancellationToken ct = default);
    Task<EmailTemplateDto> SaveTemplateAsync(string key, SaveEmailTemplateRequest request, CancellationToken ct = default);
    Task<EmailTemplateDto> ResetToDefaultAsync(string key, CancellationToken ct = default);
    string Render(string template, Dictionary<string, string> variables);
}
