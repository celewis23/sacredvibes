using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Newsletters;

namespace SacredVibes.Infrastructure.Services.Newsletters;

// Polls for newsletters that are due (or mid-send) and dispatches them. Structurally the
// same shape as EmailPollingBackgroundService: singleton hosted service, own DI scope per
// tick since the work is scoped (AppDbContext), defensive try/catch so one bad tick never
// stops the loop. Single-Railway-instance deployment means the Scheduled->Sending flip in
// NewsletterDispatchService is a safe single-writer claim with no need for a distributed lock.
public class NewsletterDispatchBackgroundService : BackgroundService
{
    private const int MaxNewslettersPerTick = 5;
    private const int MaxRecipientsPerNewsletterPerTick = 200;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<NewsletterDispatchBackgroundService> _logger;

    public NewsletterDispatchBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<NewsletterDispatchBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var configuredSeconds = Environment.GetEnvironmentVariable("NEWSLETTER_POLL_INTERVAL_SECONDS")
            ?? _config["Newsletter:PollingIntervalSeconds"];
        var interval = TimeSpan.FromSeconds(
            int.TryParse(configuredSeconds, out var seconds) ? Math.Max(20, seconds) : 60);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Newsletter dispatch tick failed");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var dispatch = scope.ServiceProvider.GetRequiredService<INewsletterDispatchService>();

        var dueIds = await dispatch.GetDueNewsletterIdsAsync(MaxNewslettersPerTick, ct);
        foreach (var id in dueIds)
        {
            try
            {
                await dispatch.DispatchOneAsync(id, MaxRecipientsPerNewsletterPerTick, ct);
            }
            catch (Exception ex)
            {
                // One newsletter failing to dispatch must never block the others due this tick.
                _logger.LogError(ex, "Failed to dispatch newsletter {NewsletterId}", id);
            }
        }
    }
}
