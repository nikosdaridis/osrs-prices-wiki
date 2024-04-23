using System.Timers;

namespace Infrastructure.Services
{
    public class JobExecutedEventArgs : EventArgs { }

    public class PeriodicExecutor(int interval) : IDisposable
    {
        public event EventHandler<JobExecutedEventArgs>? JobExecuted;
        public DateTime LastExecution;

        private System.Timers.Timer? _timer;
        private bool _running;

        protected virtual void OnJobExecuted()
        {
            JobExecuted?.Invoke(this, new JobExecutedEventArgs());
            LastExecution = DateTime.Now;
        }

        public void StartExecuting()
        {
            if (_running)
                return;

            _timer = new System.Timers.Timer(interval);
            _timer.Elapsed += HandleTimer;
            _timer.AutoReset = true;
            _timer.Enabled = true;

            OnJobExecuted();

            _running = true;
        }

        private void HandleTimer(object? sender, ElapsedEventArgs e) => OnJobExecuted();

        public void Dispose()
        {
            if (!_running || _timer is null)
                return;

            _timer.Stop();
            _timer.Elapsed -= HandleTimer;
            _running = false;
            _timer.Dispose();
        }
    }
}
