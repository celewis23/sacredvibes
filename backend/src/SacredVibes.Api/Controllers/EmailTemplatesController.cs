using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;
using SacredVibes.Application.Features.EmailTemplates;
using SacredVibes.Application.Features.EmailTemplates.DTOs;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/email-templates")]
[Authorize]
public class EmailTemplatesController : ControllerBase
{
    private readonly IEmailTemplateService _templates;
    private readonly IEmailMailboxService _email;

    public EmailTemplatesController(IEmailTemplateService templates, IEmailMailboxService email)
    {
        _templates = templates;
        _email = email;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EmailTemplateDto>>>> GetAll(CancellationToken ct = default)
    {
        var templates = await _templates.GetAllTemplatesAsync(ct);
        return Ok(ApiResponse<List<EmailTemplateDto>>.Ok(templates));
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> Get(string key, CancellationToken ct = default)
    {
        var template = await _templates.GetTemplateAsync(key, ct);
        return template is null ? NotFound() : Ok(ApiResponse<EmailTemplateDto>.Ok(template));
    }

    [HttpPut("{key}")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> Save(
        string key, [FromBody] SaveEmailTemplateRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.HtmlBody))
            return BadRequest(ApiResponse<EmailTemplateDto>.Fail("Subject and body are required."));

        try
        {
            var template = await _templates.SaveTemplateAsync(key, request, ct);
            return Ok(ApiResponse<EmailTemplateDto>.Ok(template));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<EmailTemplateDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{key}/reset")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> ResetToDefault(string key, CancellationToken ct = default)
    {
        try
        {
            var template = await _templates.ResetToDefaultAsync(key, ct);
            return Ok(ApiResponse<EmailTemplateDto>.Ok(template));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<EmailTemplateDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{key}/preview")]
    public async Task<ActionResult<ApiResponse<string>>> SendPreview(
        string key, [FromBody] PreviewEmailTemplateRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ToEmail))
            return BadRequest(ApiResponse<string>.Fail("A recipient email address is required."));

        var template = await _templates.GetTemplateAsync(key, ct);
        if (template is null)
            return NotFound(ApiResponse<string>.Fail("Template not found."));

        var previewVars = new Dictionary<string, string>
        {
            ["customerName"] = "Jane Smith",
            ["customerEmail"] = request.ToEmail,
            ["serviceName"] = "60-Minute Sound Healing Session",
            ["bookingType"] = "Sound Healing Class",
            ["amount"] = "$120.00",
            ["currency"] = "USD",
            ["brandName"] = "Sacred Vibes Healing & Wellness",
            ["bookingId"] = "A1B2C3D4",
            ["adminNotes"] = "Please arrive 10 minutes early. Wear comfortable clothing.",
            ["cancellationReason"] = "The session was cancelled due to scheduling conflict.",
            ["oldServiceName"] = "60-Minute Swedish Massage",
            ["newServiceName"] = "60-Minute Sound Healing Session",
        };

        try
        {
            await _email.SendAsync(new SendEmailRequest
            {
                To = [request.ToEmail],
                Subject = $"[PREVIEW] {_templates.Render(template.Subject, previewVars)}",
                Body = _templates.Render(template.HtmlBody, previewVars),
                IsHtml = true
            }, ct);

            return Ok(ApiResponse<string>.Ok($"Preview sent to {request.ToEmail}"));
        }
        catch (Exception ex)
        {
            return StatusCode(502, ApiResponse<string>.Fail($"Failed to send preview: {ex.Message}"));
        }
    }
}
