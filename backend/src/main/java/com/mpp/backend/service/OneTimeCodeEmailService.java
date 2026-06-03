package com.mpp.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class OneTimeCodeEmailService {

    private static final Logger log = LoggerFactory.getLogger(OneTimeCodeEmailService.class);

    private final String fromAddress;
    private final String deliveryMode;
    private final JavaMailSender mailSender;
    private final String sendGridApiKey;
    private final HttpClient httpClient;

    public OneTimeCodeEmailService(
            @Value("${app.mail.from}") String fromAddress,
            @Value("${app.mail.delivery-mode:log}") String deliveryMode,
            @Value("${app.mail.sendgrid.api-key:}") String sendGridApiKey,
            ObjectProvider<JavaMailSender> mailSenderProvider
    ) {
        this.fromAddress = fromAddress;
        this.deliveryMode = deliveryMode;
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.sendGridApiKey = sendGridApiKey == null ? "" : sendGridApiKey.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendCode(String recipientEmail, String purpose, String code) {
        String subject = "Your StreamSee verification code";
        String body = """
                Hello,

                Your StreamSee verification code for %s is: %s

                This code expires in 10 minutes.

                If you did not request this code, you can ignore this email.
                """.formatted(purpose, code);

        if ("log".equalsIgnoreCase(deliveryMode)) {
            log.info("Verification code [{}] for {} sent to {}", code, purpose, recipientEmail);
            return;
        }

        if ("sendgrid".equalsIgnoreCase(deliveryMode)) {
            sendWithSendGrid(recipientEmail, subject, body);
            return;
        }

        if (!"smtp".equalsIgnoreCase(deliveryMode)) {
            throw new IllegalStateException("Unsupported mail delivery mode: " + deliveryMode);
        }

        if (mailSender == null) {
            throw new IllegalStateException("SMTP mail delivery is enabled, but JavaMailSender is not configured.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipientEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    private void sendWithSendGrid(String recipientEmail, String subject, String body) {
        if (sendGridApiKey.isBlank()) {
            throw new IllegalStateException("SendGrid delivery is enabled, but no API key is configured.");
        }

        String payload = """
                {
                  "personalizations": [
                    {
                      "to": [
                        {
                          "email": "%s"
                        }
                      ]
                    }
                  ],
                  "from": {
                    "email": "%s"
                  },
                  "subject": "%s",
                  "content": [
                    {
                      "type": "text/plain",
                      "value": "%s"
                    }
                  ]
                }
                """.formatted(
                escapeJson(recipientEmail),
                escapeJson(fromAddress),
                escapeJson(subject),
                escapeJson(body)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + sendGridApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("SendGrid request failed with status %s: %s"
                        .formatted(response.statusCode(), response.body()));
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Could not send verification email through SendGrid: " + exception.getMessage(), exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("SendGrid request was interrupted.", exception);
        }
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }
}
