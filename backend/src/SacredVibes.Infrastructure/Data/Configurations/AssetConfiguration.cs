using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class AssetConfiguration : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> builder)
    {
        builder.ToTable("assets");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.FileName).IsRequired().HasMaxLength(500);
        builder.Property(a => a.OriginalFileName).IsRequired().HasMaxLength(500);
        builder.Property(a => a.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(a => a.StoragePath).IsRequired().HasMaxLength(1000);
        builder.Property(a => a.PublicUrl).HasMaxLength(2000);
        builder.Property(a => a.AltText).HasMaxLength(500);
        builder.Property(a => a.Caption).HasMaxLength(1000);
        builder.Property(a => a.TagsJson).HasColumnType("jsonb").HasDefaultValue("[]");
        builder.Property(a => a.VariantsJson).HasColumnType("jsonb");
        builder.Property(a => a.AssetType).HasConversion<int>();
        builder.Property(a => a.Visibility).HasConversion<int>();
        builder.Property(a => a.Usage).HasConversion<int>();
        builder.HasIndex(a => a.BrandId);
        builder.HasIndex(a => a.IsGalleryItem);
        builder.HasIndex(a => a.AssetType);
        builder.HasOne(a => a.Brand).WithMany(b => b.Assets).HasForeignKey(a => a.BrandId).IsRequired(false);
        builder.HasOne(a => a.UploadedByUser).WithMany(u => u.UploadedAssets).HasForeignKey(a => a.UploadedByUserId).IsRequired(false);
    }
}

public class GalleryConfiguration : IEntityTypeConfiguration<Gallery>
{
    public void Configure(EntityTypeBuilder<Gallery> builder)
    {
        builder.ToTable("galleries");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Name).IsRequired().HasMaxLength(200);
        builder.Property(g => g.Slug).IsRequired().HasMaxLength(200);
        builder.HasIndex(g => new { g.BrandId, g.Slug }).IsUnique();
        builder.HasOne(g => g.Brand).WithMany(b => b.Galleries).HasForeignKey(g => g.BrandId);
    }
}

public class GalleryAssetConfiguration : IEntityTypeConfiguration<GalleryAsset>
{
    public void Configure(EntityTypeBuilder<GalleryAsset> builder)
    {
        builder.ToTable("gallery_assets");
        builder.HasKey(ga => new { ga.GalleryId, ga.AssetId });
        builder.HasOne(ga => ga.Gallery).WithMany(g => g.GalleryAssets).HasForeignKey(ga => ga.GalleryId);
        builder.HasOne(ga => ga.Asset).WithMany(a => a.GalleryAssets).HasForeignKey(ga => ga.AssetId);
    }
}
