using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class ServerBackgroundService(ServerService serverService, ILogger<ServerBackgroundService> logger) : BackgroundService
    {
        /// <summary>
        /// Initializes tasks and manages concurrent execution
        /// </summary>
        protected override async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            Dictionary<string, (Func<Task> Func, TimeSpan Interval)> tasks = new()
            {
                { nameof(serverService.GetLatestItemsAsync), (serverService.GetLatestItemsAsync, TimeSpan.FromMinutes(1)) },
                { nameof(serverService.GetMappingAsync), (serverService.GetMappingAsync, TimeSpan.FromMinutes(60)) },
                { nameof(serverService.GetVolumeAsync), (serverService.GetVolumeAsync, TimeSpan.FromMinutes(60)) }
                //{ nameof(serverService.GenerateSitemapAsync), (serverService.GenerateSitemapAsync, TimeSpan.FromDays(1)) }
            };

            Task[] runningTasks = tasks.Select(task => RepeatTaskAsync(task.Key, task.Value.Func, task.Value.Interval, cancellationToken)).ToArray();

            await Task.WhenAll(runningTasks);
        }

        /// <summary>
        /// Executes specific task repeatedly at interval until cancellation
        /// </summary>
        private async Task RepeatTaskAsync(string name, Func<Task> func, TimeSpan interval, CancellationToken cancellationToken)
        {
            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    await func();
                    await Task.Delay(interval, cancellationToken);
                }
            }
            catch (TaskCanceledException ex)
            {
                logger.LogWarning(ex, "Task {TaskName} was cancelled", name);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while executing task {TaskName}", name);
            }
        }
    }
}
