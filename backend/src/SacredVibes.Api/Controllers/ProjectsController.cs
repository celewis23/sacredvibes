using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Projects.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProjectsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProjectSummaryDto>>>> GetProjects(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = _db.Projects
            .Include(p => p.Images.Where(i => !i.IsDeleted))
            .Include(p => p.Tracks.Where(t => !t.IsDeleted))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Title.ToLower().Contains(search.ToLower()) ||
                                     (p.Description != null && p.Description.ToLower().Contains(search.ToLower())));

        var total = await query.CountAsync(ct);
        var projects = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProjectSummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                CoverImageUrl = p.CoverImageUrl ?? p.Images.Where(i => !i.IsDeleted).OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                ImageCount = p.Images.Count(i => !i.IsDeleted),
                TrackCount = p.Tracks.Count(t => !t.IsDeleted),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<ProjectSummaryDto>>.Ok(
            PagedResult<ProjectSummaryDto>.Create(projects, total, page, pageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> GetProject(Guid id, CancellationToken ct = default)
    {
        var project = await _db.Projects
            .Include(p => p.Images.Where(i => !i.IsDeleted))
            .Include(p => p.Tracks.Where(t => !t.IsDeleted))
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (project is null) return NotFound(ApiResponse<ProjectDto>.Fail("Project not found"));

        return Ok(ApiResponse<ProjectDto>.Ok(MapToDto(project)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> CreateProject(
        [FromBody] CreateProjectRequest request, CancellationToken ct = default)
    {
        var project = new Project
        {
            Title = request.Title,
            Description = request.Description,
        };

        await _db.Projects.AddAsync(project, ct);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetProject), new { id = project.Id },
            ApiResponse<ProjectDto>.Ok(MapToDto(project)));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> UpdateProject(
        Guid id, [FromBody] UpdateProjectRequest request, CancellationToken ct = default)
    {
        var project = await _db.Projects
            .Include(p => p.Images.Where(i => !i.IsDeleted))
            .Include(p => p.Tracks.Where(t => !t.IsDeleted))
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (project is null) return NotFound(ApiResponse<ProjectDto>.Fail("Project not found"));

        project.Title = request.Title;
        project.Description = request.Description;
        project.Notes = request.Notes;
        project.CoverImageUrl = request.CoverImageUrl;

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<ProjectDto>.Ok(MapToDto(project)));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteProject(Guid id, CancellationToken ct = default)
    {
        var project = await _db.Projects.FindAsync([id], ct);
        if (project is null) return NotFound();

        project.IsDeleted = true;
        project.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Images ────────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/images")]
    public async Task<ActionResult<ApiResponse<ProjectImageDto>>> AddImage(
        Guid id, [FromBody] AddImageRequest request, CancellationToken ct = default)
    {
        var project = await _db.Projects.FindAsync([id], ct);
        if (project is null) return NotFound(ApiResponse<ProjectImageDto>.Fail("Project not found"));

        var maxOrder = await _db.ProjectImages
            .Where(i => i.ProjectId == id)
            .MaxAsync(i => (int?)i.SortOrder, ct) ?? -1;

        var image = new ProjectImage
        {
            ProjectId = id,
            Url = request.Url,
            SourceUrl = request.SourceUrl,
            Title = request.Title,
            Description = request.Description,
            Source = request.Source,
            SortOrder = maxOrder + 1,
        };

        await _db.ProjectImages.AddAsync(image, ct);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<ProjectImageDto>.Ok(MapImageToDto(image)));
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    public async Task<ActionResult> RemoveImage(Guid id, Guid imageId, CancellationToken ct = default)
    {
        var image = await _db.ProjectImages.FirstOrDefaultAsync(i => i.Id == imageId && i.ProjectId == id, ct);
        if (image is null) return NotFound();

        image.IsDeleted = true;
        image.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/images/reorder")]
    public async Task<ActionResult> ReorderImages(
        Guid id, [FromBody] ReorderItemsRequest request, CancellationToken ct = default)
    {
        var images = await _db.ProjectImages
            .Where(i => i.ProjectId == id && request.Ids.Contains(i.Id))
            .ToListAsync(ct);

        for (var i = 0; i < request.Ids.Count; i++)
        {
            var img = images.FirstOrDefault(x => x.Id == request.Ids[i]);
            if (img is not null) img.SortOrder = i;
        }

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Tracks ────────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/tracks")]
    public async Task<ActionResult<ApiResponse<ProjectTrackDto>>> AddTrack(
        Guid id, [FromBody] AddTrackRequest request, CancellationToken ct = default)
    {
        var project = await _db.Projects.FindAsync([id], ct);
        if (project is null) return NotFound(ApiResponse<ProjectTrackDto>.Fail("Project not found"));

        var maxOrder = await _db.ProjectTracks
            .Where(t => t.ProjectId == id)
            .MaxAsync(t => (int?)t.SortOrder, ct) ?? -1;

        var track = new ProjectTrack
        {
            ProjectId = id,
            SpotifyId = request.SpotifyId,
            Type = request.Type,
            Title = request.Title,
            Artist = request.Artist,
            AlbumName = request.AlbumName,
            AlbumArtUrl = request.AlbumArtUrl,
            PreviewUrl = request.PreviewUrl,
            SpotifyUri = request.SpotifyUri,
            ExternalUrl = request.ExternalUrl,
            DurationMs = request.DurationMs,
            SortOrder = maxOrder + 1,
        };

        await _db.ProjectTracks.AddAsync(track, ct);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<ProjectTrackDto>.Ok(MapTrackToDto(track)));
    }

    [HttpDelete("{id:guid}/tracks/{trackId:guid}")]
    public async Task<ActionResult> RemoveTrack(Guid id, Guid trackId, CancellationToken ct = default)
    {
        var track = await _db.ProjectTracks.FirstOrDefaultAsync(t => t.Id == trackId && t.ProjectId == id, ct);
        if (track is null) return NotFound();

        track.IsDeleted = true;
        track.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/tracks/reorder")]
    public async Task<ActionResult> ReorderTracks(
        Guid id, [FromBody] ReorderItemsRequest request, CancellationToken ct = default)
    {
        var tracks = await _db.ProjectTracks
            .Where(t => t.ProjectId == id && request.Ids.Contains(t.Id))
            .ToListAsync(ct);

        for (var i = 0; i < request.Ids.Count; i++)
        {
            var trk = tracks.FirstOrDefault(x => x.Id == request.Ids[i]);
            if (trk is not null) trk.SortOrder = i;
        }

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static ProjectDto MapToDto(Project p) => new()
    {
        Id = p.Id,
        Title = p.Title,
        Description = p.Description,
        Notes = p.Notes,
        CoverImageUrl = p.CoverImageUrl ?? p.Images.Where(i => !i.IsDeleted).OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
        ImageCount = p.Images.Count(i => !i.IsDeleted),
        TrackCount = p.Tracks.Count(t => !t.IsDeleted),
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
        Images = p.Images.Where(i => !i.IsDeleted).OrderBy(i => i.SortOrder).Select(MapImageToDto).ToList(),
        Tracks = p.Tracks.Where(t => !t.IsDeleted).OrderBy(t => t.SortOrder).Select(MapTrackToDto).ToList(),
    };

    private static ProjectImageDto MapImageToDto(ProjectImage i) => new()
    {
        Id = i.Id,
        Url = i.Url,
        SourceUrl = i.SourceUrl,
        Title = i.Title,
        Description = i.Description,
        Source = i.Source,
        SortOrder = i.SortOrder,
    };

    private static ProjectTrackDto MapTrackToDto(ProjectTrack t) => new()
    {
        Id = t.Id,
        SpotifyId = t.SpotifyId,
        Type = t.Type,
        Title = t.Title,
        Artist = t.Artist,
        AlbumName = t.AlbumName,
        AlbumArtUrl = t.AlbumArtUrl,
        PreviewUrl = t.PreviewUrl,
        SpotifyUri = t.SpotifyUri,
        ExternalUrl = t.ExternalUrl,
        DurationMs = t.DurationMs,
        SortOrder = t.SortOrder,
    };
}
