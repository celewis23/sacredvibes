using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Title).IsRequired().HasMaxLength(300);
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.Notes).HasColumnType("text");
        builder.Property(p => p.CoverImageUrl).HasMaxLength(2000);

        builder.HasMany(p => p.Images)
            .WithOne(i => i.Project)
            .HasForeignKey(i => i.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Tracks)
            .WithOne(t => t.Project)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProjectImageConfiguration : IEntityTypeConfiguration<ProjectImage>
{
    public void Configure(EntityTypeBuilder<ProjectImage> builder)
    {
        builder.ToTable("project_images");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Url).IsRequired().HasMaxLength(2000);
        builder.Property(i => i.SourceUrl).HasMaxLength(2000);
        builder.Property(i => i.Title).HasMaxLength(500);
        builder.Property(i => i.Description).HasMaxLength(2000);
        builder.Property(i => i.Source).IsRequired().HasMaxLength(50);
        builder.HasIndex(i => new { i.ProjectId, i.SortOrder });
    }
}

public class ProjectTrackConfiguration : IEntityTypeConfiguration<ProjectTrack>
{
    public void Configure(EntityTypeBuilder<ProjectTrack> builder)
    {
        builder.ToTable("project_tracks");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.SpotifyId).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Type).IsRequired().HasMaxLength(20);
        builder.Property(t => t.Title).IsRequired().HasMaxLength(500);
        builder.Property(t => t.Artist).HasMaxLength(500);
        builder.Property(t => t.AlbumName).HasMaxLength(500);
        builder.Property(t => t.AlbumArtUrl).HasMaxLength(2000);
        builder.Property(t => t.PreviewUrl).HasMaxLength(2000);
        builder.Property(t => t.SpotifyUri).IsRequired().HasMaxLength(200);
        builder.Property(t => t.ExternalUrl).HasMaxLength(2000);
        builder.HasIndex(t => new { t.ProjectId, t.SortOrder });
    }
}
