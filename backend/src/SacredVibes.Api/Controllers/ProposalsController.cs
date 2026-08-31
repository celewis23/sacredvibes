using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Proposals;
using SacredVibes.Application.Features.Proposals.DTOs;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/proposals")]
public class ProposalsController : ControllerBase
{
    private readonly IProposalService _proposals;

    public ProposalsController(IProposalService proposals)
    {
        _proposals = proposals;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProposalListItemDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] ProposalStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await _proposals.GetAllAsync(page, pageSize, status, ct);
        return Ok(ApiResponse<PagedResult<ProposalListItemDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProposalDto>>> Get(Guid id, CancellationToken ct)
    {
        var proposal = await _proposals.GetAsync(id, ct);
        return proposal is null ? NotFound() : Ok(ApiResponse<ProposalDto>.Ok(proposal));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProposalDto>>> Create([FromBody] CreateProposalRequest request, CancellationToken ct)
    {
        try
        {
            var proposal = await _proposals.CreateAsync(request, ct);
            return Ok(ApiResponse<ProposalDto>.Ok(proposal));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProposalDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProposalDto>>> Update(Guid id, [FromBody] UpdateProposalRequest request, CancellationToken ct)
    {
        try
        {
            var proposal = await _proposals.UpdateAsync(id, request, ct);
            return Ok(ApiResponse<ProposalDto>.Ok(proposal));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProposalDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await _proposals.DeleteAsync(id, ct);
            return Ok(ApiResponse<object>.Ok(new { message = "Proposal deleted" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/send")]
    public async Task<ActionResult<ApiResponse<ProposalDto>>> Send(Guid id, [FromBody] SendProposalRequest request, CancellationToken ct)
    {
        try
        {
            var proposal = await _proposals.SendAsync(id, request, ct);
            return Ok(ApiResponse<ProposalDto>.Ok(proposal));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProposalDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/test-send")]
    public async Task<ActionResult<ApiResponse<object>>> SendTest(Guid id, [FromBody] SendProposalTestRequest request, CancellationToken ct)
    {
        try
        {
            await _proposals.SendTestAsync(id, request.TestEmail, ct);
            return Ok(ApiResponse<object>.Ok(new { message = "Test email sent" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> GetPdf(Guid id, CancellationToken ct)
    {
        try
        {
            var proposal = await _proposals.GetAsync(id, ct);
            if (proposal is null) return NotFound();

            var bytes = await _proposals.RenderPdfAsync(id, ct);
            return File(bytes, "application/pdf", $"{proposal.Title}.pdf");
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
            var html = await _proposals.PreviewHtmlAsync(id, ct);
            return Ok(ApiResponse<object>.Ok(new { html }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    // ── Public, unauthenticated access — same house convention as SubscribersController's
    // unsubscribe endpoint: the record's raw Guid id is the access token, and a proposal that
    // isn't Sent yet (or doesn't exist) returns an identical 404 either way. ──────────────────

    [AllowAnonymous]
    [HttpGet("{id:guid}/public")]
    public async Task<ActionResult<ApiResponse<PublicProposalDto>>> GetPublic(Guid id, CancellationToken ct)
    {
        var proposal = await _proposals.GetPublicAsync(id, ct);
        return proposal is null ? NotFound() : Ok(ApiResponse<PublicProposalDto>.Ok(proposal));
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/public/pdf")]
    public async Task<IActionResult> GetPublicPdf(Guid id, CancellationToken ct)
    {
        var bytes = await _proposals.GetPublicPdfAsync(id, ct);
        return bytes is null ? NotFound() : File(bytes, "application/pdf", "Proposal.pdf");
    }
}
