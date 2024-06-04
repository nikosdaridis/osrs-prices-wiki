namespace Application.Models.Settings
{
    public class SMTPValues
    {
        public string? Server { get; set; }
        public int Port { get; set; }
        public string? User { get; set; }
        public string? Pass { get; set; }
        public string? To { get; set; }
    }
}
