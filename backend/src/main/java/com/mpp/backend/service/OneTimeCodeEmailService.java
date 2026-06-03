package com.mpp.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OneTimeCodeEmailService {

    private static final Logger log = LoggerFactory.getLogger(OneTimeCodeEmailService.class);

    private final String fromAddress;
    private final String deliveryMode;
    private final JavaMailSender mailSender;

    public OneTimeCodeEmailService(
            @Value("${app.mail.from}") String fromAddress,
            @Value("${app.mail.delivery-mode:log}") String deliveryMode,
            JavaMailSender mailSender
    ) {
        this.fromAddress = fromAddress;
        this.deliveryMode = deliveryMode;
        this.mailSender = mailSender;
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

        if (!"smtp".equalsIgnoreCase(deliveryMode)) {
            throw new IllegalStateException("Unsupported mail delivery mode: " + deliveryMode);
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipientEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
