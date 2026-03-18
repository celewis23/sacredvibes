using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Imports;
using SacredVibes.Application.Features.Subscribers.DTOs;
using SacredVibes.Application.Features.Payments;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;
using System.Text;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/subscribers")]
[Authorize]
public class SubscribersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStripeImportService _stripe;
    private readonly ICsvImportService _csv;
    private readonly ISquareService _square;

    public SubscribersController(AppDbContext db, IStripeImportService stripe, ICsvImportService csv, ISquareService square)
    {
        _db = db;
        _stripe = stripe;
        _csv = csv;
        _square = square;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<SubscriberDto>>>> GetSubscribers(
        [FromQuery] SubscriberFilterRequest filter, CancellationToken ct = default)
    {
        var query = _db.Subscribers
            .Include(s => s.SubscriberTagMaps).ThenInclude(m => m.SubscriberTag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(s => s.Email.Contains(filter.Search) ||
                (s.FirstName != null && s.FirstName.Contains(filter.Search)) ||
                (s.LastName != null && s.LastName.Contains(filter.Search)));

        if (filter.IsSubscribed.HasValue) query = query.Where(s => s.IsSubscribed == filter.IsSubscribed);
        if (filter.Source.HasValue) query = query.Where(s => s.Source == filter.Source);
        if (filter.ConsentStatus.HasValue) query = query.Where(s => s.ConsentStatus == filter.ConsentStatus);
        if (filter.TagId.HasValue)
            query = query.Where(s => s.SubscriberTagMaps.Any(m => m.SubscriberTagId == filter.TagId));
        if (filter.CreatedAfter.HasValue) query = query.Where(s => s.CreatedAt >= filter.CreatedAfter);
        if (filter.CreatedBefore.HasValue) query = query.Where(s => s.CreatedAt <= filter.CreatedBefore);

        var total = await query.CountAsync(ct);
        var subscribers = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<SubscriberDto>>.Ok(
            PagedResult<SubscriberDto>.Create(subscribers.Select(MapToDto).ToList(), total, filter.Page, filter.PageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<SubscriberDto>>> GetSubscriber(Guid id, CancellationToken ct = default)
    {
        var subscriber = await _db.Subscribers
            .Include(s => s.SubscriberTagMaps).ThenInclude(m => m.SubscriberTag)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        return subscriber is null ? NotFound() : Ok(ApiResponse<SubscriberDto>.Ok(MapToDto(subscriber)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SubscriberDto>>> CreateSubscriber(
        [FromBody] CreateSubscriberRequest request, CancellationToken ct = default)
    {
        var email = request.Email.ToLowerInvariant().Trim();
        if (await _db.Subscribers.AnyAsync(s => s.Email == email, ct))
            return Conflict(ApiResponse<SubscriberDto>.Fail("Email already exists"));

        var subscriber = new Subscriber
        {
            Email = email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Source = request.Source,
            IsSubscribed = request.IsSubscribed,
            ConsentStatus = request.ConsentStatus,
            ConsentedAt = request.ConsentStatus == ConsentStatus.Subscribed ? DateTime.UtcNow : null,
            Notes = request.Notes
        };

        await _db.Subscribers.AddAsync(subscriber, ct);
        await _db.SaveChangesAsync(ct);

        foreach (var tagId in request.TagIds)
            await _db.SubscriberTagMaps.AddAsync(new SubscriberTagMap { SubscriberId = subscriber.Id, SubscriberTagId = tagId }, ct);

        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetSubscriber), new { id = subscriber.Id },
            ApiResponse<SubscriberDto>.Ok(MapToDto(subscriber)));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<SubscriberDto>>> UpdateSubscriber(
        Guid id, [FromBody] UpdateSubscriberRequest request, CancellationToken ct = default)
    {
        var subscriber = await _db.Subscribers
            .Include(s => s.SubscriberTagMaps)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (subscriber is null) return NotFound();

        subscriber.FirstName = request.FirstName;
        subscriber.LastName = request.LastName;
        subscriber.Phone = request.Phone;
        subscriber.IsSubscribed = request.IsSubscribed;
        subscriber.ConsentStatus = request.ConsentStatus;
        subscriber.Notes = request.Notes;
        if (!request.IsSubscribed) subscriber.UnsubscribedAt ??= DateTime.UtcNow;

        // Sync tags
        _db.SubscriberTagMaps.RemoveRange(subscriber.SubscriberTagMaps);
        foreach (var tagId in request.TagIds)
            await _db.SubscriberTagMaps.AddAsync(new SubscriberTagMap { SubscriberId = id, SubscriberTagId = tagId }, ct);

        await _db.SaveChangesAsync(ct);

        var updated = await _db.Subscribers.Include(s => s.SubscriberTagMaps).ThenInclude(m => m.SubscriberTag)
            .FirstAsync(s => s.Id == id, ct);

        return Ok(ApiResponse<SubscriberDto>.Ok(MapToDto(updated)));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteSubscriber(Guid id, CancellationToken ct = default)
    {
        var subscriber = await _db.Subscribers.FindAsync([id], ct);
        if (subscriber is null) return NotFound();
        subscriber.IsDeleted = true;
        subscriber.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Tags ─────────────────────────────────────────────────────────────────

    [HttpGet("tags")]
    public async Task<ActionResult<ApiResponse<List<SubscriberTagDto>>>> GetTags(CancellationToken ct = default)
    {
        var tags = await _db.SubscriberTags
            .OrderBy(t => t.Name)
            .Select(t => new SubscriberTagDto { Id = t.Id, Name = t.Name, Slug = t.Slug, Color = t.Color })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<SubscriberTagDto>>.Ok(tags));
    }

    [HttpPost("{id:guid}/tags/{tagId:guid}")]
    public async Task<ActionResult> AddTag(Guid id, Guid tagId, CancellationToken ct = default)
    {
        var exists = await _db.SubscriberTagMaps.AnyAsync(m => m.SubscriberId == id && m.SubscriberTagId == tagId, ct);
        if (!exists)
        {
            await _db.SubscriberTagMaps.AddAsync(new SubscriberTagMap { SubscriberId = id, SubscriberTagId = tagId }, ct);
            await _db.SaveChangesAsync(ct);
        }
        return Ok();
    }

    [HttpDelete("{id:guid}/tags/{tagId:guid}")]
    public async Task<ActionResult> RemoveTag(Guid id, Guid tagId, CancellationToken ct = default)
    {
        var map = await _db.SubscriberTagMaps.FindAsync([id, tagId], ct);
        if (map is not null)
        {
            _db.SubscriberTagMaps.Remove(map);
            await _db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    // ── Imports ───────────────────────────────────────────────────────────────

    [HttpPost("import/square")]
    public async Task<ActionResult<ApiResponse<ImportResultDto>>> ImportFromSquare(CancellationToken ct = default)
    {
        var result = await _square.ImportCustomersAsync(ct);
        return Ok(ApiResponse<ImportResultDto>.Ok(new ImportResultDto
        {
            InsertedCount = result.Inserted,
            UpdatedCount = result.Updated,
            SkippedCount = result.Skipped,
            ErrorCount = result.Errors,
            TotalRows = result.TotalFetched,
            Status = result.Errors > 0 ? ImportStatus.PartiallyCompleted : ImportStatus.Completed,
            ErrorSummary = result.ErrorMessages.Any() ? string.Join("; ", result.ErrorMessages.Take(5)) : null
        }));
    }

    [HttpPost("import/stripe")]
    public async Task<ActionResult<ApiResponse<ImportResultDto>>> ImportFromStripe(CancellationToken ct = default)
    {
        var result = await _stripe.ImportCustomersAsync(ct: ct);
        return Ok(ApiResponse<ImportResultDto>.Ok(result));
    }

    [HttpPost("import/csv/preview")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ImportPreviewResult>>> PreviewCsvImport(
        [FromForm] IFormFile file,
        [FromForm] bool hasHeader = true,
        [FromForm] string delimiter = ",",
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<ImportPreviewResult>.Fail("No file provided"));

        var options = new CsvImportOptions { HasHeader = hasHeader, Delimiter = delimiter };
        await using var stream = file.OpenReadStream();
        var result = await _csv.PreviewAsync(stream, options, ct);
        return Ok(ApiResponse<ImportPreviewResult>.Ok(result));
    }

    [HttpPost("import/csv")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ImportResultDto>>> ImportCsv(
        [FromForm] IFormFile file,
        [FromForm] bool hasHeader = true,
        [FromForm] string delimiter = ",",
        [FromForm] bool updateExisting = true,
        [FromForm] List<Guid>? tagIds = null,
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<ImportResultDto>.Fail("No file provided"));

        var options = new CsvImportOptions
        {
            HasHeader = hasHeader,
            Delimiter = delimiter,
            UpdateExisting = updateExisting
        };

        await using var stream = file.OpenReadStream();
        var result = await _csv.ImportAsync(stream, options, tagIds, ct);
        return Ok(ApiResponse<ImportResultDto>.Ok(result));
    }

    [HttpGet("import/jobs")]
    public async Task<ActionResult<ApiResponse<PagedResult<ImportJobSummaryDto>>>> GetImportJobs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var total = await _db.ImportJobs.CountAsync(ct);
        var jobs = await _db.ImportJobs
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new ImportJobSummaryDto
            {
                Id = j.Id,
                Source = j.Source.ToString(),
                Status = j.Status.ToString(),
                TotalRows = j.TotalRows,
                InsertedCount = j.InsertedCount,
                UpdatedCount = j.UpdatedCount,
                SkippedCount = j.SkippedCount,
                ErrorCount = j.ErrorCount,
                FileName = j.FileName,
                StartedAt = j.StartedAt,
                CompletedAt = j.CompletedAt,
                CreatedAt = j.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<ImportJobSummaryDto>>.Ok(
            PagedResult<ImportJobSummaryDto>.Create(jobs, total, page, pageSize)));
    }

    // ── Export ────────────────────────────────────────────────────────────────

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] bool? isSubscribed,
        [FromQuery] Guid? tagId,
        CancellationToken ct = default)
    {
        var query = _db.Subscribers
            .Include(s => s.SubscriberTagMaps).ThenInclude(m => m.SubscriberTag)
            .AsQueryable();

        if (isSubscribed.HasValue) query = query.Where(s => s.IsSubscribed == isSubscribed);
        if (tagId.HasValue) query = query.Where(s => s.SubscriberTagMaps.Any(m => m.SubscriberTagId == tagId));

        var subscribers = await query.OrderBy(s => s.Email).ToListAsync(ct);

        var csv = new StringBuilder();
        csv.AppendLine("Email,FirstName,LastName,Phone,Source,IsSubscribed,ConsentStatus,Tags,CreatedAt");

        foreach (var s in subscribers)
        {
            var tags = string.Join("|", s.SubscriberTagMaps.Select(m => m.SubscriberTag.Name));
            csv.AppendLine($"\"{s.Email}\",\"{s.FirstName}\",\"{s.LastName}\",\"{s.Phone}\",{s.Source},{s.IsSubscribed},{s.ConsentStatus},\"{tags}\",{s.CreatedAt:yyyy-MM-dd}");
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"subscribers-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static SubscriberDto MapToDto(Subscriber s) => new()
    {
        Id = s.Id,
        Email = s.Email,
        FirstName = s.FirstName,
        LastName = s.LastName,
        Phone = s.Phone,
        Source = s.Source,
        ExternalSourceId = s.ExternalSourceId,
        IsSubscribed = s.IsSubscribed,
        ConsentStatus = s.ConsentStatus,
        ConsentedAt = s.ConsentedAt,
        Notes = s.Notes,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
        Tags = s.SubscriberTagMaps.Select(m => new SubscriberTagDto
        {
            Id = m.SubscriberTag.Id,
            Name = m.SubscriberTag.Name,
            Slug = m.SubscriberTag.Slug,
            Color = m.SubscriberTag.Color
        }).ToList()
    };
}

public class ImportJobSummaryDto
{
    public Guid Id { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public int ErrorCount { get; set; }
    public string? FileName { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
