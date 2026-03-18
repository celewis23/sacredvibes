using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Domain.Interfaces;
using SacredVibes.Infrastructure.Data;
using System.Text.Json;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/galleries")]
public class GalleriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;

    public GalleriesController(AppDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    /// <summary>GET /api/galleries — list galleries (public: only active ones)</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List(
        [FromQuery] Guid? brandId,
        [FromQuery] bool? isActive,
        CancellationToken ct = default)
    {
        var isAdmin = User.Identity?.IsAuthenticated == true;

        var query = _db.Galleries.AsQueryable();

        if (brandId.HasValue)
            query = query.Where(g => g.BrandId == brandId.Value);

        // Unauthenticated callers only see active galleries
        if (!isAdmin || isActive.HasValue)
            query = query.Where(g => g.IsActive == (isActive ?? true));

        var galleries = await query
            .OrderBy(g => g.SortOrder)
            .ThenBy(g => g.Name)
            .Select(g => new
            {
                g.Id,
                g.BrandId,
                g.Name,
                g.Slug,
                g.Description,
                g.IsActive,
                g.IsDefault,
                g.SortOrder,
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(galleries));
    }

    /// <summary>GET /api/galleries/{id} — single gallery detail</summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct = default)
    {
        var gallery = await _db.Galleries
            .Where(g => g.Id == id)
            .Select(g => new
            {
                g.Id,
                g.BrandId,
                g.Name,
                g.Slug,
                g.Description,
                g.IsActive,
                g.IsDefault,
                g.SortOrder,
            })
            .FirstOrDefaultAsync(ct);

        if (gallery is null)
            return NotFound(ApiResponse<object>.Fail("Gallery not found"));

        return Ok(ApiResponse<object>.Ok(gallery));
    }

    /// <summary>GET /api/galleries/{id}/items — ordered list of assets in a gallery</summary>
    [HttpGet("{id:guid}/items")]
    [AllowAnonymous]
    public async Task<IActionResult> GetItems(Guid id, CancellationToken ct = default)
    {
        var gallery = await _db.Galleries.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (gallery is null)
            return NotFound(ApiResponse<object>.Fail("Gallery not found"));

        var items = await _db.GalleryAssets
            .Where(ga => ga.GalleryId == id)
            .Include(ga => ga.Asset)
            .OrderBy(ga => ga.SortOrder)
            .ThenBy(ga => ga.AddedAt)
            .Select(ga => new
            {
                ga.GalleryId,
                ga.AssetId,
                ga.SortOrder,
                ga.IsFeatured,
                ga.AddedAt,
                Asset = new
                {
                    ga.Asset.Id,
                    ga.Asset.OriginalFileName,
                    FileName = ga.Asset.OriginalFileName,
                    ga.Asset.ContentType,
                    ga.Asset.FileSize,
                    ga.Asset.Width,
                    ga.Asset.Height,
                    ga.Asset.AltText,
                    ga.Asset.Caption,
                    ga.Asset.VariantsJson,
                    PublicUrl = _storage.GetPublicUrl(ga.Asset.StoragePath),
                    ga.Asset.AssetType,
                    ga.Asset.Visibility,
                    ga.Asset.Usage,
                    ga.Asset.IsGalleryItem,
                    ga.Asset.FolderPath,
                    ga.Asset.TagsJson,
                    ga.Asset.UploadedByUserId,
                    ga.Asset.CreatedAt,
                    ga.Asset.BrandId,
                }
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(items));
    }

    /// <summary>POST /api/galleries — create gallery (admin only)</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> Create([FromBody] CreateGalleryRequest req, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Invalid request"));

        var gallery = new SacredVibes.Domain.Entities.Gallery
        {
            BrandId = req.BrandId,
            Name = req.Name,
            Slug = req.Slug ?? req.Name.ToLowerInvariant().Replace(" ", "-"),
            Description = req.Description,
            IsActive = req.IsActive,
            IsDefault = req.IsDefault,
            SortOrder = req.SortOrder,
        };

        // Unset other defaults for this brand if setting a new default
        if (req.IsDefault)
        {
            var existingDefaults = await _db.Galleries
                .Where(g => g.BrandId == req.BrandId && g.IsDefault)
                .ToListAsync(ct);
            foreach (var g in existingDefaults)
                g.IsDefault = false;
        }

        await _db.Galleries.AddAsync(gallery, ct);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = gallery.Id }, ApiResponse<object>.Ok(new { gallery.Id, gallery.Name, gallery.Slug }));
    }

    /// <summary>DELETE /api/galleries/{id} — soft-delete gallery (admin only)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var gallery = await _db.Galleries.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (gallery is null)
            return NotFound(ApiResponse<object>.Fail("Gallery not found"));

        gallery.IsDeleted = true;
        gallery.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok("Gallery deleted"));
    }

    /// <summary>POST /api/galleries/{id}/items — add an existing asset to a gallery (admin only)</summary>
    [HttpPost("{id:guid}/items")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> AddItem(Guid id, [FromBody] AddGalleryItemRequest req, CancellationToken ct = default)
    {
        var gallery = await _db.Galleries.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (gallery is null)
            return NotFound(ApiResponse<object>.Fail("Gallery not found"));

        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.Id == req.AssetId, ct);
        if (asset is null)
            return NotFound(ApiResponse<object>.Fail("Asset not found"));

        var existing = await _db.GalleryAssets
            .FirstOrDefaultAsync(ga => ga.GalleryId == id && ga.AssetId == req.AssetId, ct);

        if (existing is not null)
            return Conflict(ApiResponse<object>.Fail("Asset is already in this gallery"));

        await _db.GalleryAssets.AddAsync(new SacredVibes.Domain.Entities.GalleryAsset
        {
            GalleryId = id,
            AssetId = req.AssetId,
            SortOrder = req.SortOrder,
            IsFeatured = req.IsFeatured,
        }, ct);

        asset.IsGalleryItem = true;
        await _db.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok("Item added to gallery"));
    }

    /// <summary>DELETE /api/galleries/{id}/items/{assetId} — remove asset from gallery (admin only)</summary>
    [HttpDelete("{id:guid}/items/{assetId:guid}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> RemoveItem(Guid id, Guid assetId, CancellationToken ct = default)
    {
        var item = await _db.GalleryAssets
            .FirstOrDefaultAsync(ga => ga.GalleryId == id && ga.AssetId == assetId, ct);

        if (item is null)
            return NotFound(ApiResponse<object>.Fail("Item not found in gallery"));

        _db.GalleryAssets.Remove(item);
        await _db.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok("Item removed from gallery"));
    }
}

public record CreateGalleryRequest(
    Guid BrandId,
    string Name,
    string? Slug,
    string? Description,
    bool IsActive = true,
    bool IsDefault = false,
    int SortOrder = 0
);

public record AddGalleryItemRequest(
    Guid AssetId,
    int SortOrder = 0,
    bool IsFeatured = false
);
