using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("brands");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Slug).IsRequired().HasMaxLength(100);
        builder.HasIndex(b => b.Slug).IsUnique();
        builder.Property(b => b.Subdomain).HasMaxLength(100);
        builder.HasIndex(b => b.Subdomain);
        builder.Property(b => b.Description).HasMaxLength(2000);
        builder.Property(b => b.Tagline).HasMaxLength(500);
        builder.Property(b => b.ThemeSettingsJson).HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(b => b.SeoSettingsJson).HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(b => b.Type).HasConversion<int>();
    }
}

public class PageConfiguration : IEntityTypeConfiguration<Page>
{
    public void Configure(EntityTypeBuilder<Page> builder)
    {
        builder.ToTable("pages");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Title).IsRequired().HasMaxLength(500);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(300);
        builder.HasIndex(p => new { p.BrandId, p.Slug }).IsUnique();
        builder.Property(p => p.ContentJson).HasColumnType("jsonb");
        builder.Property(p => p.SeoTitle).HasMaxLength(200);
        builder.Property(p => p.SeoDescription).HasMaxLength(500);
        builder.Property(p => p.Status).HasConversion<int>();
        builder.HasOne(p => p.Brand).WithMany(b => b.Pages).HasForeignKey(p => p.BrandId);
        builder.HasOne(p => p.HeroImageAsset).WithMany().HasForeignKey(p => p.HeroImageAssetId).IsRequired(false);
    }
}
