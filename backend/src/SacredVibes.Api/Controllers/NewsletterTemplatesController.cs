using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Newsletters;
using SacredVibes.Application.Features.Newsletters.DTOs;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/newsletter-templates")]
public class NewsletterTemplatesController : ControllerBase
{
    private readonly INewsletterTemplateService _templates;

    public NewsletterTemplatesController(INewsletterTemplateService templates)
    {
        _templates = templates;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NewsletterTemplateDto>>>> GetAll(CancellationToken ct)
    {
        var templates = await _templates.GetAllAsync(ct);
        return Ok(ApiResponse<List<NewsletterTemplateDto>>.Ok(templates));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<NewsletterTemplateDto>>> Get(Guid id, CancellationToken ct)
    {
        var template = await _templates.GetAsync(id, ct);
        return template is null ? NotFound() : Ok(ApiResponse<NewsletterTemplateDto>.Ok(template));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NewsletterTemplateDto>>> Create(
        [FromBody] SaveNewsletterTemplateRequest request, CancellationToken ct)
    {
        try
        {
            var template = await _templates.CreateAsync(request, ct);
            return Ok(ApiResponse<NewsletterTemplateDto>.Ok(template));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<NewsletterTemplateDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<NewsletterTemplateDto>>> Update(
        Guid id, [FromBody] SaveNewsletterTemplateRequest request, CancellationToken ct)
    {
        try
        {
            var template = await _templates.UpdateAsync(id, request, ct);
            return Ok(ApiResponse<NewsletterTemplateDto>.Ok(template));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<NewsletterTemplateDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await _templates.DeleteAsync(id, ct);
            return Ok(ApiResponse<object>.Ok(new { message = "Template deleted" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}
