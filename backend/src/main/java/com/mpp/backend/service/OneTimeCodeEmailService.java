package com.mpp.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class OneTimeCodeEmailService {

    private final String fromAddress;

    public OneTimeCodeEmailService(@Value("${app.mail.from}") String fromAddress) {
        this.fromAddress = fromAddress;
    }

    public void sendCode(String recipientEmail, String purpose, String code) {
        String subject = "Your StreamSee verification code";
        String body = """
                Hello,

                Your StreamSee verification code for %s is: %s

                This code expires in 10 minutes.

                If you did not request this code, you can ignore this email.
                """.formatted(purpose, code);

        String script = """
                set recipientAddress to "%s"
                set senderAddress to "%s"
                set messageSubject to "%s"
                set messageBody to "%s"

                tell application "Mail"
                    set newMessage to make new outgoing message with properties {subject:messageSubject, content:messageBody & return & return, visible:false}
                    tell newMessage
                        make new to recipient at end of to recipients with properties {address:recipientAddress}
                        try
                            set sender to senderAddress
                        end try
                        send
                    end tell
                end tell
                """.formatted(
                escapeAppleScript(recipientEmail),
                escapeAppleScript(fromAddress),
                escapeAppleScript(subject),
                escapeAppleScript(body)
        );

        try {
            Process process = new ProcessBuilder("osascript", "-e", script).start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new IllegalStateException("Could not send verification email through Mail.app: " + error);
            }
        } catch (IOException | InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Could not send verification email through Mail.app: " + exception.getMessage(), exception);
        }
    }

    private String escapeAppleScript(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }
}