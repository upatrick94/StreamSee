package com.mpp.backend.service;

import com.mpp.backend.dto.RegisterStartRequest;
import com.mpp.backend.error.UnauthorizedException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailCodeChallengeService {

    public enum ChallengeType {
        LOGIN,
        REGISTER,
        PASSWORD_RESET
    }

    public record Delivery(String challengeId, String deliveryHint) {}
    public record LoginPayload(Long userId) {}
    public record RegisterPayload(RegisterStartRequest request) {}
    public record PasswordResetPayload(Long userId, String newPassword) {}

    private record StoredChallenge(
            String id,
            ChallengeType type,
            String code,
            String email,
            Instant expiresAt,
            LoginPayload loginPayload,
            RegisterPayload registerPayload,
            PasswordResetPayload passwordResetPayload
    ) {}

    private final SecureRandom random = new SecureRandom();
    private final Map<String, StoredChallenge> challenges = new ConcurrentHashMap<>();
    private final Duration ttl = Duration.ofMinutes(10);

    public Delivery createLoginChallenge(Long userId, String email) {
        StoredChallenge challenge = createBaseChallenge(
                ChallengeType.LOGIN,
                email,
                new LoginPayload(userId),
                null,
                null
        );
        return new Delivery(challenge.id(), maskEmail(email));
    }

    public Delivery createRegisterChallenge(RegisterStartRequest request) {
        StoredChallenge challenge = createBaseChallenge(
                ChallengeType.REGISTER,
                request.email().trim().toLowerCase(),
                null,
                new RegisterPayload(request),
                null
        );
        return new Delivery(challenge.id(), maskEmail(request.email()));
    }

    public Delivery createPasswordResetChallenge(Long userId, String email, String newPassword) {
        StoredChallenge challenge = createBaseChallenge(
                ChallengeType.PASSWORD_RESET,
                email,
                null,
                null,
                new PasswordResetPayload(userId, newPassword)
        );
        return new Delivery(challenge.id(), maskEmail(email));
    }

    public String peekCode(String challengeId) {
        StoredChallenge challenge = requireChallenge(challengeId);
        return challenge.code();
    }

    public LoginPayload consumeLoginChallenge(String challengeId, String code) {
        StoredChallenge challenge = consumeChallenge(challengeId, code, ChallengeType.LOGIN);
        return challenge.loginPayload();
    }

    public RegisterPayload consumeRegisterChallenge(String challengeId, String code) {
        StoredChallenge challenge = consumeChallenge(challengeId, code, ChallengeType.REGISTER);
        return challenge.registerPayload();
    }

    public PasswordResetPayload consumePasswordResetChallenge(String challengeId, String code) {
        StoredChallenge challenge = consumeChallenge(challengeId, code, ChallengeType.PASSWORD_RESET);
        return challenge.passwordResetPayload();
    }

    private StoredChallenge createBaseChallenge(
            ChallengeType type,
            String email,
            LoginPayload loginPayload,
            RegisterPayload registerPayload,
            PasswordResetPayload passwordResetPayload
    ) {
        String challengeId = UUID.randomUUID().toString();
        String code = "%06d".formatted(random.nextInt(1_000_000));
        StoredChallenge challenge = new StoredChallenge(
                challengeId,
                type,
                code,
                email.trim().toLowerCase(),
                Instant.now().plus(ttl),
                loginPayload,
                registerPayload,
                passwordResetPayload
        );
        challenges.put(challengeId, challenge);
        return challenge;
    }

    private StoredChallenge consumeChallenge(String challengeId, String code, ChallengeType expectedType) {
        StoredChallenge challenge = requireChallenge(challengeId);

        if (challenge.type() != expectedType) {
            throw new UnauthorizedException("Verification code is not valid for this action.");
        }

        if (challenge.expiresAt().isBefore(Instant.now())) {
            challenges.remove(challengeId);
            throw new UnauthorizedException("Verification code has expired.");
        }

        if (!challenge.code().equals(code.trim())) {
            throw new UnauthorizedException("Verification code is invalid.");
        }

        challenges.remove(challengeId);
        return challenge;
    }

    private StoredChallenge requireChallenge(String challengeId) {
        StoredChallenge challenge = challenges.get(challengeId);

        if (challenge == null) {
            throw new UnauthorizedException("Verification challenge was not found or has expired.");
        }

        return challenge;
    }

    private String maskEmail(String email) {
        String normalized = email.trim().toLowerCase();
        int atIndex = normalized.indexOf('@');

        if (atIndex <= 1) {
            return normalized;
        }

        String local = normalized.substring(0, atIndex);
        String domain = normalized.substring(atIndex + 1);

        String maskedLocal = local.charAt(0) + "***";
        String maskedDomain = domain.length() <= 3 ? domain : domain.charAt(0) + "***" + domain.substring(domain.lastIndexOf('.'));

        return maskedLocal + "@" + maskedDomain;
    }
}