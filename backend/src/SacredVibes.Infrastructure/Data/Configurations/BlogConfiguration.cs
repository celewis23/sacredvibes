using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class BlogPostConfiguration : IEntityTypeConfiguration<BlogPost>
{
    public void Configure(EntityTypeBuilder<BlogPost> builder)
    {
        builder.ToTable("blog_posts");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Title).IsRequired().HasMaxLength(500);
        builder.Property(b => b.Slug).IsRequired().HasMaxLength(300);
        builder.HasIndex(b => new { b.BrandId, b.Slug }).IsUnique();
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => b.PublishedAt);
        builder.Property(b => b.Excerpt).HasMaxLength(1000);
        builder.Property(b => b.Content).IsRequired().HasColumnType("text");
        builder.Property(b => b.SeoTitle).HasMaxLength(200);
        builder.Property(b => b.SeoDescription).HasMaxLength(500);
        builder.Property(b => b.Status).HasConversion<int>();
        builder.HasOne(b => b.Brand).WithMany(br => br.BlogPosts).HasForeignKey(b => b.BrandId);
        builder.HasOne(b => b.Author).WithMany(u => u.BlogPosts).HasForeignKey(b => b.AuthorId).IsRequired(false);
        builder.HasOne(b => b.FeaturedImageAsset).WithMany().HasForeignKey(b => b.FeaturedImageAssetId).IsRequired(false);
    }
}

public class BlogCategoryConfiguration : IEntityTypeConfiguration<BlogCategory>
{
    public void Configure(EntityTypeBuilder<BlogCategory> builder)
    {
        builder.ToTable("blog_categories");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Slug).IsRequired().HasMaxLength(200);
        builder.HasIndex(b => new { b.BrandId, b.Slug }).IsUnique();
        builder.HasOne(b => b.Brand).WithMany().HasForeignKey(b => b.BrandId);
        builder.HasOne(b => b.ParentCategory).WithMany().HasForeignKey(b => b.ParentCategoryId).IsRequired(false);
    }
}

public class BlogTagConfiguration : IEntityTypeConfiguration<BlogTag>
{
    public void Configure(EntityTypeBuilder<BlogTag> builder)
    {
        builder.ToTable("blog_tags");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).IsRequired().HasMaxLength(100);
        builder.Property(b => b.Slug).IsRequired().HasMaxLength(100);
        builder.HasIndex(b => new { b.BrandId, b.Slug }).IsUnique();
        builder.HasOne(b => b.Brand).WithMany().HasForeignKey(b => b.BrandId);
    }
}

public class BlogPostCategoryConfiguration : IEntityTypeConfiguration<BlogPostCategory>
{
    public void Configure(EntityTypeBuilder<BlogPostCategory> builder)
    {
        builder.ToTable("blog_post_categories");
        builder.HasKey(b => new { b.BlogPostId, b.BlogCategoryId });
        builder.HasOne(b => b.BlogPost).WithMany(p => p.BlogPostCategories).HasForeignKey(b => b.BlogPostId);
        builder.HasOne(b => b.BlogCategory).WithMany(c => c.BlogPostCategories).HasForeignKey(b => b.BlogCategoryId);
    }
}

public class BlogPostTagConfiguration : IEntityTypeConfiguration<BlogPostTag>
{
    public void Configure(EntityTypeBuilder<BlogPostTag> builder)
    {
        builder.ToTable("blog_post_tags");
        builder.HasKey(b => new { b.BlogPostId, b.BlogTagId });
        builder.HasOne(b => b.BlogPost).WithMany(p => p.BlogPostTags).HasForeignKey(b => b.BlogPostId);
        builder.HasOne(b => b.BlogTag).WithMany(t => t.BlogPostTags).HasForeignKey(b => b.BlogTagId);
    }
}
