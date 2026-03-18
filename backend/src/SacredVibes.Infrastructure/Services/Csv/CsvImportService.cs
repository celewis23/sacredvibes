using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Imports;
using SacredVibes.Application.Features.Subscribers.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;
using System.Globalization;

namespace SacredVibes.Infrastructure.Services.Csv;

public class CsvImportService : ICsvImportService
{
    private readonly ILogger<CsvImportService> _logger;
    private readonly AppDbContext _db;

    public CsvImportService(ILogger<CsvImportService> logger, AppDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    public async Task<ImportPreviewResult> PreviewAsync(Stream csvStream, CsvImportOptions options, CancellationToken ct = default)
    {
        var result = new ImportPreviewResult();
        var rows = await ParseCsvAsync(csvStream, options, ct);

        result.DetectedColumns = rows.FirstOrDefault()?.Keys.ToList() ?? new();

        var existingEmails = new HashSet<string>(
            await _db.Subscribers.Select(s => s.Email).ToListAsync(ct),
            StringComparer.OrdinalIgnoreCase
        );

        int rowNum = 0;
        var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in rows.Skip(options.HasHeader ? 0 : 0)) // headers already stripped by parser
        {
            rowNum++;
            result.TotalRows++;

            var preview = new ImportRowPreview { RowNumber = rowNum };

            preview.Email = GetValue(row, options.EmailColumn ?? "email", "email", "e-mail", "email address");
            preview.FirstName = GetValue(row, options.FirstNameColumn ?? "firstname", "first_name", "first name", "fname");
            preview.LastName = GetValue(row, options.LastNameColumn ?? "lastname", "last_name", "last name", "lname");
            preview.Phone = GetValue(row, options.PhoneColumn ?? "phone", "phone_number", "mobile");

            if (string.IsNullOrWhiteSpace(preview.Email))
            {
                preview.IsValid = false;
                preview.ErrorMessage = "Missing email address";
                result.ErrorRows++;
            }
            else if (!IsValidEmail(preview.Email))
            {
                preview.IsValid = false;
                preview.ErrorMessage = "Invalid email format";
                result.ErrorRows++;
            }
            else if (seenEmails.Contains(preview.Email))
            {
                preview.IsValid = true;
                preview.IsDuplicate = true;
                result.DuplicateRows++;
            }
            else if (existingEmails.Contains(preview.Email))
            {
                preview.IsValid = true;
                preview.IsDuplicate = true;
                result.DuplicateRows++;
                seenEmails.Add(preview.Email);
            }
            else
            {
                preview.IsValid = true;
                result.ValidRows++;
                seenEmails.Add(preview.Email);
            }

            if (result.Rows.Count < 100) // Return first 100 rows for preview
                result.Rows.Add(preview);
        }

        return result;
    }

    public async Task<ImportResultDto> ImportAsync(Stream csvStream, CsvImportOptions options, List<Guid>? tagIds = null, CancellationToken ct = default)
    {
        var importJob = new ImportJob
        {
            Source = ImportSource.Csv,
            Status = ImportStatus.Processing,
            StartedAt = DateTime.UtcNow,
            InitiatedByUserId = "system",
            ColumnMappingJson = System.Text.Json.JsonSerializer.Serialize(options.ColumnMappings)
        };

        await _db.ImportJobs.AddAsync(importJob, ct);
        await _db.SaveChangesAsync(ct);

        var result = new ImportResultDto { ImportJobId = importJob.Id };

        try
        {
            var rows = await ParseCsvAsync(csvStream, options, ct);

            // Fetch existing subscriber emails for deduplication
            var existingSubscribers = await _db.Subscribers
                .ToDictionaryAsync(s => s.Email, s => s, StringComparer.OrdinalIgnoreCase, ct);

            // Fetch tags if provided
            List<SubscriberTag> tags = new();
            if (tagIds?.Any() == true)
            {
                tags = await _db.SubscriberTags.Where(t => tagIds.Contains(t.Id)).ToListAsync(ct);
            }

            var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            int rowNum = 0;

            foreach (var row in rows)
            {
                rowNum++;
                importJob.TotalRows++;

                var item = new ImportJobItem
                {
                    ImportJobId = importJob.Id,
                    RowNumber = rowNum,
                    RawDataJson = System.Text.Json.JsonSerializer.Serialize(row)
                };

                try
                {
                    var email = GetValue(row, options.EmailColumn ?? "email", "email", "e-mail", "email address")?.ToLowerInvariant()?.Trim();
                    item.Email = email;

                    if (string.IsNullOrWhiteSpace(email) || !IsValidEmail(email))
                    {
                        item.Status = ImportItemStatus.Error;
                        item.ErrorMessage = string.IsNullOrWhiteSpace(email) ? "No email" : "Invalid email";
                        importJob.ErrorCount++;

                        if (!options.SkipInvalid)
                            throw new InvalidOperationException(item.ErrorMessage);

                        await _db.ImportJobItems.AddAsync(item, ct);
                        continue;
                    }

                    if (seenEmails.Contains(email))
                    {
                        item.Status = ImportItemStatus.Skipped;
                        item.ErrorMessage = "Duplicate in import file";
                        importJob.SkippedCount++;
                        await _db.ImportJobItems.AddAsync(item, ct);
                        continue;
                    }

                    seenEmails.Add(email);

                    var firstName = GetValue(row, options.FirstNameColumn ?? "firstname", "first_name", "first name", "fname");
                    var lastName = GetValue(row, options.LastNameColumn ?? "lastname", "last_name", "last name", "lname");
                    var phone = GetValue(row, options.PhoneColumn ?? "phone", "phone_number", "mobile");

                    if (existingSubscribers.TryGetValue(email, out var existing))
                    {
                        if (options.UpdateExisting)
                        {
                            existing.FirstName ??= firstName;
                            existing.LastName ??= lastName;
                            existing.Phone ??= phone;

                            // Add tags if not already tagged
                            foreach (var tag in tags)
                            {
                                var alreadyTagged = await _db.SubscriberTagMaps
                                    .AnyAsync(m => m.SubscriberId == existing.Id && m.SubscriberTagId == tag.Id, ct);
                                if (!alreadyTagged)
                                {
                                    await _db.SubscriberTagMaps.AddAsync(new SubscriberTagMap
                                    {
                                        SubscriberId = existing.Id,
                                        SubscriberTagId = tag.Id
                                    }, ct);
                                }
                            }

                            item.Status = ImportItemStatus.Updated;
                            item.SubscriberId = existing.Id;
                            importJob.UpdatedCount++;
                        }
                        else
                        {
                            item.Status = ImportItemStatus.Skipped;
                            item.ErrorMessage = "Already exists";
                            importJob.SkippedCount++;
                        }
                    }
                    else
                    {
                        var subscriber = new Subscriber
                        {
                            Email = email,
                            FirstName = firstName,
                            LastName = lastName,
                            Phone = phone,
                            Source = ImportSource.Csv,
                            ImportJobId = importJob.Id,
                            IsSubscribed = true,
                            ConsentStatus = ConsentStatus.Unknown
                        };

                        await _db.Subscribers.AddAsync(subscriber, ct);
                        await _db.SaveChangesAsync(ct);

                        foreach (var tag in tags)
                        {
                            await _db.SubscriberTagMaps.AddAsync(new SubscriberTagMap
                            {
                                SubscriberId = subscriber.Id,
                                SubscriberTagId = tag.Id
                            }, ct);
                        }

                        existingSubscribers[email] = subscriber;
                        item.Status = ImportItemStatus.Inserted;
                        item.SubscriberId = subscriber.Id;
                        importJob.InsertedCount++;
                    }
                }
                catch (Exception ex) when (options.SkipInvalid)
                {
                    item.Status = ImportItemStatus.Error;
                    item.ErrorMessage = ex.Message;
                    importJob.ErrorCount++;
                    _logger.LogWarning(ex, "CSV import row {Row} error", rowNum);
                }

                await _db.ImportJobItems.AddAsync(item, ct);

                if (rowNum % 50 == 0)
                    await _db.SaveChangesAsync(ct);
            }

            importJob.Status = importJob.ErrorCount > 0 && importJob.InsertedCount + importJob.UpdatedCount > 0
                ? ImportStatus.PartiallyCompleted
                : importJob.ErrorCount > 0 && importJob.InsertedCount + importJob.UpdatedCount == 0
                    ? ImportStatus.Failed
                    : ImportStatus.Completed;

            importJob.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            result.TotalRows = importJob.TotalRows;
            result.InsertedCount = importJob.InsertedCount;
            result.UpdatedCount = importJob.UpdatedCount;
            result.SkippedCount = importJob.SkippedCount;
            result.ErrorCount = importJob.ErrorCount;
            result.Status = importJob.Status;
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error during CSV import");
            importJob.Status = ImportStatus.Failed;
            importJob.ErrorSummary = ex.Message;
            importJob.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            result.Status = ImportStatus.Failed;
            result.ErrorSummary = ex.Message;
            return result;
        }
    }

    private static async Task<List<Dictionary<string, string>>> ParseCsvAsync(Stream stream, CsvImportOptions options, CancellationToken ct)
    {
        var rows = new List<Dictionary<string, string>>();
        using var reader = new StreamReader(stream, leaveOpen: true);

        List<string>? headers = null;
        string? line;
        int lineNum = 0;

        while ((line = await reader.ReadLineAsync(ct)) is not null)
        {
            lineNum++;
            var values = ParseCsvLine(line, options.Delimiter);

            if (lineNum == 1 && options.HasHeader)
            {
                headers = values.Select(v => v.Trim().ToLowerInvariant()).ToList();
                continue;
            }

            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            if (headers is not null)
            {
                for (int i = 0; i < Math.Min(headers.Count, values.Count); i++)
                    row[headers[i]] = values[i];
            }
            else
            {
                for (int i = 0; i < values.Count; i++)
                    row[$"col{i}"] = values[i];
            }

            rows.Add(row);
        }

        return rows;
    }

    private static List<string> ParseCsvLine(string line, string delimiter)
    {
        var values = new List<string>();
        var inQuotes = false;
        var current = new System.Text.StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (!inQuotes && line[i..].StartsWith(delimiter))
            {
                values.Add(current.ToString().Trim());
                current.Clear();
                i += delimiter.Length - 1;
            }
            else
            {
                current.Append(c);
            }
        }

        values.Add(current.ToString().Trim());
        return values;
    }

    private static string? GetValue(Dictionary<string, string> row, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (row.TryGetValue(key, out var val) && !string.IsNullOrWhiteSpace(val))
                return val.Trim();
        }
        return null;
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
