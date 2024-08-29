using System.Timers;

namespace Application.Services
{
    public class JobExecutedEventArgs : EventArgs { }

    /// <summary>
    /// Executes job at given interval
    /// </summary>
    public class PeriodicExecutor(int interval) : IDisposable
    {
        public event EventHandler<JobExecutedEventArgs>? JobExecuted;
        public DateTime LastExecution;

        private System.Timers.Timer? _timer;
        private bool _running;

        /// <summary>
        /// Initializes a new instance of the <see cref="PeriodicExecutor"/> class
        /// </summary>
        protected virtual void OnJobExecuted()
        {
            JobExecuted?.Invoke(this, new JobExecutedEventArgs());
            LastExecution = DateTime.Now;
        }

        /// <summary>
        /// Starts executing the job
        /// </summary>
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

        /// <summary>
        /// Handles the timer job
        /// </summary>
        private void HandleTimer(object? sender, ElapsedEventArgs e) =>
            OnJobExecuted();

        /// <summary>
        /// Stops executing the job
        /// </summary>
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
