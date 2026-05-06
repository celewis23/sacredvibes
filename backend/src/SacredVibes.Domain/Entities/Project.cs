namespace SacredVibes.Domain.Entities;

public class Project : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Notes { get; set; } // HTML from TipTap
    public string? CoverImageUrl { get; set; }

    public ICollection<ProjectImage> Images { get; set; } = new List<ProjectImage>();
    public ICollection<ProjectTrack> Tracks { get; set; } = new List<ProjectTrack>();
}

public class ProjectImage : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Url { get; set; } = string.Empty;
    public string? SourceUrl { get; set; } // Original Pinterest URL
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string Source { get; set; } = "Manual"; // "Pinterest" | "Manual" | "Embedded"
    public int SortOrder { get; set; }
}

public class ProjectTrack : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string SpotifyId { get; set; } = string.Empty;
    public string Type { get; set; } = "Track"; // "Track" | "Playlist"
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? AlbumName { get; set; }
    public string? AlbumArtUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public string SpotifyUri { get; set; } = string.Empty;
    public string? ExternalUrl { get; set; }
    public int DurationMs { get; set; }
    public int SortOrder { get; set; }
}
