namespace SacredVibes.Domain.Enums;

public enum ImportSource
{
    Manual = 0,
    Square = 1,
    Stripe = 2,
    Csv = 3,
    Api = 4
}

public enum ImportStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3,
    PartiallyCompleted = 4
}

public enum ImportItemStatus
{
    Pending = 0,
    Inserted = 1,
    Updated = 2,
    Skipped = 3,
    Error = 4
}
