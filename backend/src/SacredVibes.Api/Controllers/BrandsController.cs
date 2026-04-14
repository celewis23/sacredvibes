using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Settings.DTOs;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/brands")]
public class BrandsController : ControllerBase
{
    private readonly AppDbContext _db;
    public BrandsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<BrandDto>>>> GetBrands(CancellationToken ct = default)
    {
        var brands = await _db.Brands
            .OrderBy(b => b.SortOrder)
            .Select(b => new BrandDto
            {
                Id = b.Id, Name = b.Name, Slug = b.Slug,
                Type = b.Type.ToString(), Subdomain = b.Subdomain,
                Description = b.Description, Tagline = b.Tagline, LogoPath = b.LogoPath,
                ThemeSettingsJson = b.ThemeSettingsJson, SeoSettingsJson = b.SeoSettingsJson,
                IsActive = b.IsActive, SortOrder = b.SortOrder
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<BrandDto>>.Ok(brands));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<BrandDto>>> GetBrand(Guid id, CancellationToken ct = default)
    {
        var b = await _db.Brands.FindAsync([id], ct);
        if (b is null) return NotFound();
        return Ok(ApiResponse<BrandDto>.Ok(new BrandDto
        {
            Id = b.Id, Name = b.Name, Slug = b.Slug,
            Type = b.Type.ToString(), Subdomain = b.Subdomain,
            Description = b.Description, Tagline = b.Tagline, LogoPath = b.LogoPath,
            ThemeSettingsJson = b.ThemeSettingsJson, SeoSettingsJson = b.SeoSettingsJson,
            IsActive = b.IsActive, SortOrder = b.SortOrder
        }));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<BrandDto>>> UpdateBrand(
        Guid id, [FromBody] SaveBrandRequest req, CancellationToken ct = default)
    {
        var brand = await _db.Brands.FindAsync([id], ct);
        if (brand is null) return NotFound();

        brand.Name = req.Name;
        brand.Description = req.Description;
        brand.Tagline = req.Tagline;
        brand.IsActive = req.IsActive;
        brand.SortOrder = req.SortOrder;
        if (!string.IsNullOrWhiteSpace(req.ThemeSettingsJson))
            brand.ThemeSettingsJson = req.ThemeSettingsJson;
        if (!string.IsNullOrWhiteSpace(req.SeoSettingsJson))
            brand.SeoSettingsJson = req.SeoSettingsJson;

        await _db.SaveChangesAsync(ct);

        return Ok(ApiResponse<BrandDto>.Ok(new BrandDto
        {
            Id = brand.Id, Name = brand.Name, Slug = brand.Slug,
            Type = brand.Type.ToString(), Subdomain = brand.Subdomain,
            Description = brand.Description, Tagline = brand.Tagline, LogoPath = brand.LogoPath,
            ThemeSettingsJson = brand.ThemeSettingsJson, SeoSettingsJson = brand.SeoSettingsJson,
            IsActive = brand.IsActive, SortOrder = brand.SortOrder
        }));
    }
}

public class SaveBrandRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Tagline { get; set; }
    public string? ThemeSettingsJson { get; set; }
    public string? SeoSettingsJson { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
