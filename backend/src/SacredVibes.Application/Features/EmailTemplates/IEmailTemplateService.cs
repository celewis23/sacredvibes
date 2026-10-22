using SacredVibes.Application.Features.EmailTemplates.DTOs;

namespace SacredVibes.Application.Features.EmailTemplates;

public interface IEmailTemplateService
{
    Task<List<EmailTemplateDto>> GetAllTemplatesAsync(CancellationToken ct = default);
    Task<EmailTemplateDto?> GetTemplateAsync(string key, CancellationToken ct = default);
    Task<EmailTemplateDto> SaveTemplateAsync(string key, SaveEmailTemplateRequest request, CancellationToken ct = default);
    Task<EmailTemplateDto> ResetToDefaultAsync(string key, CancellationToken ct = default);
    string Render(string template, Dictionary<string, string> variables);

    // Automated (trigger-driven) templates — like the welcome email — can be switched off by
    // the admin without touching the template content itself. Templates with no on/off concept
    // (booking emails, which are core to the booking flow) simply never call these. Defaults to
    // enabled when no row has been saved yet, so a brand-new automated template works out of the box.
    Task<bool> IsAutomationEnabledAsync(string key, CancellationToken ct = default);
    Task SetAutomationEnabledAsync(string key, bool enabled, CancellationToken ct = default);
}
