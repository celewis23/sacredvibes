using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Settings.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/leads")]
public class LeadsController : ControllerBase
{
    private readonly AppDbContext _db;

    public LeadsController(AppDbContext db) => _db = db;

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> SubmitLead(
        [FromBody] CreateLeadRequest request, CancellationToken ct = default)
    {
        // Honeypot check
        if (!string.IsNullOrWhiteSpace(request.HoneypotField))
            return Ok(new { message = "Thank you for your message." });

        // Basic validation
        if (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(ApiResponse<object>.Fail("Email or phone is required"));

        if (!Enum.TryParse<LeadType>(request.Type, true, out var leadType))
            leadType = LeadType.ContactForm;

        var lead = new Lead
        {
            BrandId = request.BrandId,
            Type = leadType,
            Status = LeadStatus.New,
            FirstName = request.FirstName?.Trim(),
            LastName = request.LastName?.Trim(),
            Email = request.Email?.ToLowerInvariant().Trim(),
            Phone = request.Phone?.Trim(),
            Subject = request.Subject?.Trim(),
            Message = request.Message?.Trim(),
            ServiceInterest = request.ServiceInterest,
            PreferredDate = request.PreferredDate,
            PreferredTime = request.PreferredTime,
            ReferralSource = request.ReferralSource,
            NewsletterOptIn = request.NewsletterOptIn,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.ToString()
        };

        await _db.Leads.AddAsync(lead, ct);

        // Auto-subscribe if opted in
        if (request.NewsletterOptIn && !string.IsNullOrWhiteSpace(lead.Email))
        {
            var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Email == lead.Email, ct);
            if (existing is null)
            {
                var subscriber = new Subscriber
                {
                    Email = lead.Email,
                    FirstName = lead.FirstName,
                    LastName = lead.LastName,
                    Phone = lead.Phone,
                    Source = ImportSource.Manual,
                    IsSubscribed = true,
                    ConsentStatus = ConsentStatus.Subscribed,
                    ConsentedAt = DateTime.UtcNow,
                    ConsentMethod = "lead-form"
                };
                await _db.Subscribers.AddAsync(subscriber, ct);
                await _db.SaveChangesAsync(ct);
                lead.ConvertedSubscriberId = subscriber.Id;
            }
        }

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { id = lead.Id, message = "Thank you for reaching out! We'll be in touch soon." }));
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<LeadDto>>>> GetLeads(
        [FromQuery] Guid? brandId,
        [FromQuery] LeadStatus? status,
        [FromQuery] LeadType? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = _db.Leads.Include(l => l.Brand).AsQueryable();

        if (brandId.HasValue) query = query.Where(l => l.BrandId == brandId);
        if (status.HasValue) query = query.Where(l => l.Status == status);
        if (type.HasValue) query = query.Where(l => l.Type == type);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(l =>
                (l.Email != null && l.Email.Contains(search)) ||
                (l.FirstName != null && l.FirstName.Contains(search)) ||
                (l.LastName != null && l.LastName.Contains(search)));

        var total = await query.CountAsync(ct);
        var leads = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LeadDto
            {
                Id = l.Id,
                BrandId = l.BrandId,
                BrandName = l.Brand.Name,
                Type = l.Type.ToString(),
                Status = l.Status.ToString(),
                FirstName = l.FirstName,
                LastName = l.LastName,
                Email = l.Email,
                Phone = l.Phone,
                Subject = l.Subject,
                Message = l.Message,
                ServiceInterest = l.ServiceInterest,
                NewsletterOptIn = l.NewsletterOptIn,
                AdminNotes = l.AdminNotes,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<LeadDto>>.Ok(
            PagedResult<LeadDto>.Create(leads, total, page, pageSize)));
    }

    [Authorize]
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadRequest request, CancellationToken ct = default)
    {
        var lead = await _db.Leads.FindAsync([id], ct);
        if (lead is null) return NotFound();

        if (request.Status is not null && Enum.TryParse<LeadStatus>(request.Status, out var status))
            lead.Status = status;

        if (request.AdminNotes is not null) lead.AdminNotes = request.AdminNotes;

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Updated" });
    }
}

public record UpdateLeadRequest(string? Status, string? AdminNotes);
