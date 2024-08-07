﻿using Application.Models;
using Application.Models.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Infrastructure.Services
{
    public class EmailSenderService(ILogger<EmailSenderService> logger)
    {
        /// <summary>
        /// Sends email using SMTP client
        /// </summary>
        public async Task<bool> SendEmailAsync(SMTPValues smtp, EmailModel email)
        {
            MimeMessage message = new();
            message.From.Add(new MailboxAddress(email.From, email.From));
            message.To.Add(new MailboxAddress(smtp.To, smtp.To));
            message.Subject = email.Subject;
            BodyBuilder bodyBuilder = new() { TextBody = email.Body };
            message.Body = bodyBuilder.ToMessageBody();

            try
            {
                CancellationTokenSource cancellationTokenSource = new(TimeSpan.FromSeconds(10));
                using SmtpClient client = new();
                client.Connect(smtp.Server, smtp.Port, SecureSocketOptions.StartTls, cancellationTokenSource.Token);
                client.Authenticate(smtp.User, smtp.Pass);

                await client.SendAsync(message);
                client.Disconnect(true);

                logger.LogInformation("Email sent from {From}", message.From);
                return true;
            }
            catch (OperationCanceledException ex)
            {
                logger.LogError(ex, "Timeout occurred while sending email from {From} - {Subject} - {Body}", message.From, message.Subject, message.Body);
                return false;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error sending email from {From} - {Subject} - {Body}", message.From, message.Subject, message.Body);
                return false;
            }
        }
    }
}
