using Application.Models;
using Application.Models.Settings;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Infrastructure.Services
{
    public class EmailSenderService(ILogger<EmailSenderService> logger)
    {
        /// <summary>
        /// Sends email using SMTP client
        /// </summary>
        public bool SendEmail(SMTPValues smtp, EmailModel email)
        {
            MimeMessage message = new();
            message.From.Add(new MailboxAddress(email.From, email.From));
            message.To.Add(new MailboxAddress(smtp.To, smtp.To));
            message.Subject = email.Subject;
            BodyBuilder bodyBuilder = new() { TextBody = email.Body };
            message.Body = bodyBuilder.ToMessageBody();

            try
            {
                using SmtpClient client = new();
                client.Connect(smtp.Server, smtp.Port, true);
                client.Authenticate(smtp.User, smtp.Pass);

                client.Send(message);
                client.Disconnect(true);

                logger.LogInformation("Email sent {Subject}", message.Subject);
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error sending email {Subject} - {From} - {Body}", message.Subject, message.From, message.Body);
                return false;
            }
        }
    }
}
