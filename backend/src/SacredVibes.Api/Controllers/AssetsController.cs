using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Common.Interfaces;
using SacredVibes.Application.Features.Assets.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Domain.Interfaces;
using SacredVibes.Infrastructure.Data;
using System.Text.Json;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/assets")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;
    private readonly IImageProcessingService _imageProcessor;

    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
        "application/pdf", "image/svg+xml"
    };
    private const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 MB

    public AssetsController(AppDbContext db, IStorageService storage, IImageProcessingService imageProcessor)
    {
        _db = db;
        _storage = storage;
        _imageProcessor = imageProcessor;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AssetDto>>>> GetAssets(
        [FromQuery] AssetFilterRequest filter, CancellationToken ct = default)
    {
        var query = _db.Assets.AsQueryable();

        if (filter.BrandId.HasValue) query = query.Where(a => a.BrandId == filter.BrandId);
        if (filter.AssetType.HasValue) query = query.Where(a => a.AssetType == filter.AssetType);
        if (filter.Usage.HasValue) query = query.Where(a => a.Usage == filter.Usage);
        if (filter.IsGalleryItem.HasValue) query = query.Where(a => a.IsGalleryItem == filter.IsGalleryItem);
        if (!string.IsNullOrWhiteSpace(filter.FolderPath)) query = query.Where(a => a.FolderPath == filter.FolderPath);
        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(a => a.OriginalFileName.Contains(filter.Search) ||
                                     (a.AltText != null && a.AltText.Contains(filter.Search)) ||
                                     (a.Caption != null && a.Caption.Contains(filter.Search)));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => MapToDto(a))
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<AssetDto>>.Ok(
            PagedResult<AssetDto>.Create(items, total, filter.Page, filter.PageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<AssetDto>>> GetAsset(Guid id, CancellationToken ct = default)
    {
        var asset = await _db.Assets.FindAsync([id], ct);
        return asset is null ? NotFound() : Ok(ApiResponse<AssetDto>.Ok(MapToDto(asset)));
    }

    [HttpPost("upload")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<List<AssetDto>>>> Upload(
        [FromForm] UploadAssetRequest metadata,
        [FromForm] IFormFileCollection files,
        CancellationToken ct = default)
    {
        if (!files.Any())
            return BadRequest(ApiResponse<List<AssetDto>>.Fail("No files provided"));

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value ?? "unknown";

        var results = new List<AssetDto>();

        foreach (var file in files)
        {
            if (file.Length > MaxFileSizeBytes)
            {
                ModelState.AddModelError(file.FileName, $"File {file.FileName} exceeds 25 MB limit");
                continue;
            }

            var contentType = file.ContentType.ToLowerInvariant();
            if (!AllowedTypes.Contains(contentType))
            {
                ModelState.AddModelError(file.FileName, $"File type {contentType} not allowed");
                continue;
            }

            var ext = Path.GetExtension(file.FileName);
            var safeName = $"{Guid.NewGuid()}{ext}";
            var folder = $"{DateTime.UtcNow:yyyy/MM}";
            if (metadata.BrandId.HasValue)
                folder = $"brands/{metadata.BrandId}/{DateTime.UtcNow:yyyy/MM}";

            await using var stream = file.OpenReadStream();
            var storeResult = await _storage.StoreAsync(stream, safeName, contentType, folder, ct);

            if (!storeResult.Success)
            {
                ModelState.AddModelError(file.FileName, storeResult.Error ?? "Storage failed");
                continue;
            }

            var asset = new Asset
            {
                BrandId = metadata.BrandId,
                FileName = safeName,
                OriginalFileName = file.FileName,
                ContentType = contentType,
                FileSize = file.Length,
                StoragePath = storeResult.StoragePath,
                PublicUrl = storeResult.PublicUrl,
                AltText = metadata.AltText,
                Caption = metadata.Caption,
                Description = metadata.Description,
                Usage = metadata.Usage,
                Visibility = metadata.Visibility,
                IsGalleryItem = metadata.IsGalleryItem,
                FolderPath = metadata.FolderPath ?? folder,
                TagsJson = JsonSerializer.Serialize(metadata.Tags),
                UploadedByUserId = userId,
                AssetType = contentType.StartsWith("image/") ? AssetType.Image :
                            contentType == "application/pdf" ? AssetType.Document : AssetType.Other
            };

            // Image processing
            if (_imageProcessor.IsImageContentType(contentType))
            {
                stream.Position = 0;
                var processResult = await _imageProcessor.ProcessAsync(
                    stream, file.FileName,
                    new Application.Common.Interfaces.ImageProcessingOptions(),
                    ct);

                if (processResult.Success)
                {
                    asset.Width = processResult.OriginalWidth;
                    asset.Height = processResult.OriginalHeight;

                    var variants = new Dictionary<string, string>();
                    foreach (var variant in processResult.Variants)
                    {
                        var variantName = $"{Path.GetFileNameWithoutExtension(safeName)}_{variant.Name}{variant.Extension}";
                        var variantResult = await _storage.StoreAsync(variant.Stream, variantName, variant.ContentType, folder, ct);
                        if (variantResult.Success)
                            variants[variant.Name] = variantResult.PublicUrl;
                        await variant.Stream.DisposeAsync();
                    }
                    asset.VariantsJson = JsonSerializer.Serialize(variants);
                }
            }

            await _db.Assets.AddAsync(asset, ct);
            await _db.SaveChangesAsync(ct);

            // Auto-assign to gallery if requested
            if (metadata.AssignToGalleryId.HasValue)
            {
                await _db.GalleryAssets.AddAsync(new GalleryAsset
                {
                    GalleryId = metadata.AssignToGalleryId.Value,
                    AssetId = asset.Id,
                    SortOrder = await _db.GalleryAssets.CountAsync(ga => ga.GalleryId == metadata.AssignToGalleryId.Value, ct)
                }, ct);
                await _db.SaveChangesAsync(ct);
            }

            // Auto-assign to default gallery if IsGalleryItem
            if (metadata.IsGalleryItem && metadata.BrandId.HasValue && !metadata.AssignToGalleryId.HasValue)
            {
                var defaultGallery = await _db.Galleries
                    .FirstOrDefaultAsync(g => g.BrandId == metadata.BrandId && g.IsDefault && g.IsActive, ct);

                if (defaultGallery is not null)
                {
                    var alreadyIn = await _db.GalleryAssets.AnyAsync(ga => ga.GalleryId == defaultGallery.Id && ga.AssetId == asset.Id, ct);
                    if (!alreadyIn)
                    {
                        await _db.GalleryAssets.AddAsync(new GalleryAsset
                        {
                            GalleryId = defaultGallery.Id,
                            AssetId = asset.Id,
                            SortOrder = await _db.GalleryAssets.CountAsync(ga => ga.GalleryId == defaultGallery.Id, ct)
                        }, ct);
                        await _db.SaveChangesAsync(ct);
                    }
                }
            }

            results.Add(MapToDto(asset));
        }

        if (!ModelState.IsValid && !results.Any())
            return BadRequest(ApiResponse<List<AssetDto>>.Fail(
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));

        return Ok(ApiResponse<List<AssetDto>>.Ok(results));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<AssetDto>>> UpdateAsset(
        Guid id, [FromBody] UpdateAssetRequest request, CancellationToken ct = default)
    {
        var asset = await _db.Assets.FindAsync([id], ct);
        if (asset is null) return NotFound();

        asset.AltText = request.AltText;
        asset.Caption = request.Caption;
        asset.Description = request.Description;
        asset.Usage = request.Usage;
        asset.Visibility = request.Visibility;
        asset.IsGalleryItem = request.IsGalleryItem;
        asset.FolderPath = request.FolderPath;
        asset.TagsJson = JsonSerializer.Serialize(request.Tags);

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<AssetDto>.Ok(MapToDto(asset)));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsset(Guid id, CancellationToken ct = default)
    {
        var asset = await _db.Assets.FindAsync([id], ct);
        if (asset is null) return NotFound();

        await _storage.DeleteAsync(asset.StoragePath, ct);

        if (!string.IsNullOrWhiteSpace(asset.VariantsJson))
        {
            var variants = JsonSerializer.Deserialize<Dictionary<string, string>>(asset.VariantsJson);
            if (variants is not null)
            {
                foreach (var path in variants.Values)
                    await _storage.DeleteAsync(path, ct);
            }
        }

        asset.IsDeleted = true;
        asset.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static AssetDto MapToDto(Asset a) => new()
    {
        Id = a.Id,
        BrandId = a.BrandId,
        FileName = a.FileName,
        OriginalFileName = a.OriginalFileName,
        ContentType = a.ContentType,
        FileSize = a.FileSize,
        StoragePath = a.StoragePath,
        PublicUrl = a.PublicUrl,
        Width = a.Width,
        Height = a.Height,
        AltText = a.AltText,
        Caption = a.Caption,
        Description = a.Description,
        AssetType = a.AssetType,
        Visibility = a.Visibility,
        Usage = a.Usage,
        IsGalleryItem = a.IsGalleryItem,
        FolderPath = a.FolderPath,
        TagsJson = a.TagsJson,
        VariantsJson = a.VariantsJson,
        UploadedByUserId = a.UploadedByUserId,
        CreatedAt = a.CreatedAt
    };
}
