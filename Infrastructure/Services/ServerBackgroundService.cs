using Microsoft.Extensions.Hosting;

namespace Infrastructure.Services
{
    public class ServerBackgroundService(ServerService serverService) : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                await serverService.GetLatestItems();

                await Task.Delay(60_000, cancellationToken);
            }
        }
    }
}
