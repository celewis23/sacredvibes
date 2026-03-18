using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Imports;
using SacredVibes.Application.Features.Subscribers.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;
using System.Net.Http.Headers;
using System.Text.Json;

namespace SacredVibes.Infrastructure.Services.Stripe;

/// <summary>
/// Stripe customer import service — used for importing contact data only, not payments.
/// CONFIGURATION REQUIRED: Set Stripe:SecretKey in appsettings or environment variables.
/// Obtain from Stripe Dashboard > Developers > API Keys.
/// </summary>
public class StripeImportService : IStripeImportService
{
    private readonly IConfiguration _config;
    private readonly ILogger<StripeImportService> _logger;
    private readonly AppDbContext _db;
    private readonly HttpClient _http;

    private string SecretKey => _config["Stripe:SecretKey"] ?? throw new InvalidOperationException("Stripe:SecretKey not configured");
    private const string BaseUrl = "https://api.stripe.com/v1";

    public StripeImportService(IConfiguration config, ILogger<StripeImportService> logger, AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _logger = logger;
        _db = db;
        _http = httpClientFactory.CreateClient("Stripe");
    }

    public async Task<ImportResultDto> ImportCustomersAsync(string? startingAfter = null, int limit = 100, CancellationToken ct = default)
    {
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", SecretKey);

        var importJob = new ImportJob
        {
            Source = ImportSource.Stripe,
            Status = ImportStatus.Processing,
            StartedAt = DateTime.UtcNow,
            InitiatedByUserId = "system",
            ExternalReference = "stripe-customer-import"
        };

        await _db.ImportJobs.AddAsync(importJob, ct);
        await _db.SaveChangesAsync(ct);

        var result = new ImportResultDto { ImportJobId = importJob.Id };
        string? cursor = startingAfter;
        bool hasMore = true;

        try
        {
            while (hasMore)
            {
                var url = $"{BaseUrl}/customers?limit={Math.Min(limit, 100)}&expand[]=data.subscriptions";
                if (cursor is not null) url += $"&starting_after={cursor}";

                var response = await _http.GetAsync(url, ct);
                var body = await response.Content.ReadAsStringAsync(ct);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Stripe customer list failed: {Status} {Body}", response.StatusCode, body);
                    importJob.Status = ImportStatus.Failed;
                    importJob.ErrorSummary = $"Stripe API error: HTTP {response.StatusCode}";
                    await _db.SaveChangesAsync(ct);
                    result.Status = ImportStatus.Failed;
                    return result;
                }

                using var doc = JsonDocument.Parse(body);
                var data = doc.RootElement.GetProperty("data");
                hasMore = doc.RootElement.GetProperty("has_more").GetBoolean();

                string? lastId = null;
                foreach (var customer in data.EnumerateArray())
                {
                    importJob.TotalRows++;
                    lastId = customer.GetProperty("id").GetString();

                    var item = new ImportJobItem
                    {
                        ImportJobId = importJob.Id,
                        RowNumber = importJob.TotalRows,
                        RawDataJson = customer.GetRawText()
                    };

                    try
                    {
                        var email = customer.TryGetProperty("email", out var emailEl) && emailEl.ValueKind != JsonValueKind.Null
                            ? emailEl.GetString()?.ToLowerInvariant()
                            : null;

                        item.Email = email;

                        if (string.IsNullOrWhiteSpace(email))
                        {
                            item.Status = ImportItemStatus.Skipped;
                            item.ErrorMessage = "No email address";
                            importJob.SkippedCount++;
                            await _db.ImportJobItems.AddAsync(item, ct);
                            continue;
                        }

                        var name = customer.TryGetProperty("name", out var nameEl) && nameEl.ValueKind != JsonValueKind.Null
                            ? nameEl.GetString()
                            : null;

                        var phone = customer.TryGetProperty("phone", out var phoneEl) && phoneEl.ValueKind != JsonValueKind.Null
                            ? phoneEl.GetString()
                            : null;

                        var customerId = customer.GetProperty("id").GetString();

                        string? firstName = null, lastName = null;
                        if (!string.IsNullOrWhiteSpace(name))
                        {
                            var parts = name.Trim().Split(' ', 2);
                            firstName = parts[0];
                            lastName = parts.Length > 1 ? parts[1] : null;
                        }

                        var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Email == email, ct);
                        if (existing is not null)
                        {
                            existing.FirstName ??= firstName;
                            existing.LastName ??= lastName;
                            existing.Phone ??= phone;
                            item.Status = ImportItemStatus.Updated;
                            item.SubscriberId = existing.Id;
                            importJob.UpdatedCount++;
                        }
                        else
                        {
                            var subscriber = new Subscriber
                            {
                                Email = email,
                                FirstName = firstName,
                                LastName = lastName,
                                Phone = phone,
                                Source = ImportSource.Stripe,
                                ExternalSourceId = customerId,
                                ImportJobId = importJob.Id,
                                IsSubscribed = true,
                                ConsentStatus = ConsentStatus.Unknown
                            };

                            await _db.Subscribers.AddAsync(subscriber, ct);
                            await _db.SaveChangesAsync(ct); // need ID for item
                            item.Status = ImportItemStatus.Inserted;
                            item.SubscriberId = subscriber.Id;
                            importJob.InsertedCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        item.Status = ImportItemStatus.Error;
                        item.ErrorMessage = ex.Message;
                        importJob.ErrorCount++;
                        _logger.LogWarning(ex, "Error importing Stripe customer row {Row}", importJob.TotalRows);
                    }

                    await _db.ImportJobItems.AddAsync(item, ct);
                }

                cursor = lastId;
                await _db.SaveChangesAsync(ct);
            }

            importJob.Status = importJob.ErrorCount > 0 && importJob.InsertedCount + importJob.UpdatedCount > 0
                ? ImportStatus.PartiallyCompleted
                : importJob.ErrorCount > 0 ? ImportStatus.Failed : ImportStatus.Completed;

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
            _logger.LogError(ex, "Fatal error during Stripe import");
            importJob.Status = ImportStatus.Failed;
            importJob.ErrorSummary = ex.Message;
            importJob.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            result.Status = ImportStatus.Failed;
            result.ErrorSummary = ex.Message;
            return result;
        }
    }

    public async Task<int> GetCustomerCountAsync(CancellationToken ct = default)
    {
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", SecretKey);

        try
        {
            var response = await _http.GetAsync($"{BaseUrl}/customers?limit=1", ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode) return -1;

            using var doc = JsonDocument.Parse(body);
            return doc.RootElement.TryGetProperty("total_count", out var count) ? count.GetInt32() : -1;
        }
        catch
        {
            return -1;
        }
    }
}
