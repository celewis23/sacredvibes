using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Newsletters;
using SacredVibes.Application.Features.Newsletters.DTOs;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/newsletters")]
public class NewslettersController : ControllerBase
{
    private readonly INewsletterService _newsletters;

    public NewslettersController(INewsletterService newsletters)
    {
        _newsletters = newsletters;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NewsletterListItemDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] NewsletterStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await _newsletters.GetAllAsync(page, pageSize, status, ct);
        return Ok(ApiResponse<PagedResult<NewsletterListItemDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<NewsletterDto>>> Get(Guid id, CancellationToken ct)
    {
        var newsletter = await _newsletters.GetAsync(id, ct);
        return newsletter is null ? NotFound() : Ok(ApiResponse<NewsletterDto>.Ok(newsletter));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NewsletterDto>>> Create(
        [FromBody] CreateNewsletterRequest request, CancellationToken ct)
    {
        try
        {
            var newsletter = await _newsletters.CreateAsync(request, ct);
            return Ok(ApiResponse<NewsletterDto>.Ok(newsletter));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<NewsletterDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<NewsletterDto>>> Update(
        Guid id, [FromBody] UpdateNewsletterRequest request, CancellationToken ct)
    {
        try
        {
            var newsletter = await _newsletters.UpdateAsync(id, request, ct);
            return Ok(ApiResponse<NewsletterDto>.Ok(newsletter));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<NewsletterDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await _newsletters.DeleteAsync(id, ct);
            return Ok(ApiResponse<object>.Ok(new { message = "Newsletter deleted" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/schedule")]
    public async Task<ActionResult<ApiResponse<NewsletterDto>>> Schedule(
        Guid id, [FromBody] ScheduleNewsletterRequest request, CancellationToken ct)
    {
        try
        {
            var newsletter = await _newsletters.ScheduleAsync(id, request, ct);
            return Ok(ApiResponse<NewsletterDto>.Ok(newsletter));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<NewsletterDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<NewsletterDto>>> Cancel(Guid id, CancellationToken ct)
    {
        try
        {
            var newsletter = await _newsletters.CancelAsync(id, ct);
            return Ok(ApiResponse<NewsletterDto>.Ok(newsletter));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<NewsletterDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/send-now")]
    public async Task<ActionResult<ApiResponse<NewsletterDto>>> SendNow(
        Guid id, [FromBody] SendNewsletterNowRequest request, CancellationToken ct)
    {
        try
        {
            var newsletter = await _newsletters.SendNowAsync(id, request, ct);
            return Ok(ApiResponse<NewsletterDto>.Ok(newsletter));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<NewsletterDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/send-test")]
    public async Task<ActionResult<ApiResponse<object>>> SendTest(
        Guid id, [FromBody] SendNewsletterTestRequest request, CancellationToken ct)
    {
        try
        {
            await _newsletters.SendTestAsync(id, request.TestEmail, ct);
            return Ok(ApiResponse<object>.Ok(new { message = "Test email sent" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{id:guid}/preview")]
    public async Task<ActionResult<ApiResponse<object>>> Preview(Guid id, CancellationToken ct)
    {
        try
        {
            var html = await _newsletters.PreviewHtmlAsync(id, ct);
            return Ok(ApiResponse<object>.Ok(new { html }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{id:guid}/recipient-logs")]
    public async Task<ActionResult<ApiResponse<PagedResult<NewsletterRecipientLogDto>>>> GetRecipientLogs(
        Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var result = await _newsletters.GetRecipientLogsAsync(id, page, pageSize, ct);
        return Ok(ApiResponse<PagedResult<NewsletterRecipientLogDto>>.Ok(result));
    }
}
