namespace SacredVibes.Application.Features.Projects.DTOs;

public class ProjectSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public int ImageCount { get; set; }
    public int TrackCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ProjectDto : ProjectSummaryDto
{
    public string? Notes { get; set; }
    public List<ProjectImageDto> Images { get; set; } = new();
    public List<ProjectTrackDto> Tracks { get; set; } = new();
}

public class ProjectImageDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string Source { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class ProjectTrackDto
{
    public Guid Id { get; set; }
    public string SpotifyId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
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

public class CreateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public string? CoverImageUrl { get; set; }
}

public class AddImageRequest
{
    public string Url { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string Source { get; set; } = "Manual";
}

public class AddTrackRequest
{
    public string SpotifyId { get; set; } = string.Empty;
    public string Type { get; set; } = "Track";
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? AlbumName { get; set; }
    public string? AlbumArtUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public string SpotifyUri { get; set; } = string.Empty;
    public string? ExternalUrl { get; set; }
    public int DurationMs { get; set; }
}

public class ReorderItemsRequest
{
    public List<Guid> Ids { get; set; } = new();
}
