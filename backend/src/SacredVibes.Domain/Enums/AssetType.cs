namespace SacredVibes.Domain.Enums;

public enum AssetType
{
    Image = 0,
    Document = 1,
    Video = 2,
    Audio = 3,
    Other = 99
}

public enum AssetVisibility
{
    Public = 0,
    Private = 1,
    Unlisted = 2
}

public enum AssetUsage
{
    General = 0,
    Gallery = 1,
    Blog = 2,
    PageContent = 3,
    StorageOnly = 4,
    Profile = 5
}
