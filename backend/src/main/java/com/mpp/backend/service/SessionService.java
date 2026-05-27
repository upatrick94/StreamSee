package com.mpp.backend.service;

import com.mpp.backend.error.UnauthorizedException;
import com.mpp.backend.repository.security.UserAccountEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {

    private final long sessionTimeoutSeconds;
    private final Map<String, StoredSession> sessions = new ConcurrentHashMap<>();

    public SessionService(@Value("${app.session.timeout-seconds:900}") long sessionTimeoutSeconds) {
        this.sessionTimeoutSeconds = sessionTimeoutSeconds;
    }

    public SessionSnapshot createSession(UserAccountEntity user) {
        cleanupExpiredSessions();

        String token = UUID.randomUUID() + "." + UUID.randomUUID();
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(sessionTimeoutSeconds);

        sessions.put(token, new StoredSession(token, user.getId(), expiresAt, now));
        return new SessionSnapshot(token, expiresAt, sessionTimeoutSeconds);
    }

    public SessionSnapshot requireSession(String rawToken, Long expectedUserId) {
        cleanupExpiredSessions();

        String token = normalizeToken(rawToken);
        StoredSession session = sessions.get(token);
        Instant now = Instant.now();

        if (session == null || session.expiresAt().isBefore(now)) {
            sessions.remove(token);
            throw new UnauthorizedException("Session expired or invalid.");
        }

        if (expectedUserId != null && !expectedUserId.equals(session.userId())) {
            throw new UnauthorizedException("The authentication token does not belong to the provided user.");
        }

        Instant refreshedExpiresAt = now.plusSeconds(sessionTimeoutSeconds);
        sessions.put(token, new StoredSession(token, session.userId(), refreshedExpiresAt, now));
        return new SessionSnapshot(token, refreshedExpiresAt, sessionTimeoutSeconds);
    }

    public void invalidate(String rawToken, Long expectedUserId) {
        String token = normalizeToken(rawToken);
        StoredSession session = sessions.get(token);

        if (session == null) {
            return;
        }

        if (expectedUserId != null && !expectedUserId.equals(session.userId())) {
            throw new UnauthorizedException("The authentication token does not belong to the provided user.");
        }

        sessions.remove(token);
    }

    public void invalidateAllForUser(Long userId) {
        sessions.entrySet().removeIf(entry -> entry.getValue().userId().equals(userId));
    }

    public long getSessionTimeoutSeconds() {
        return sessionTimeoutSeconds;
    }

    private void cleanupExpiredSessions() {
        Instant now = Instant.now();
        sessions.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private String normalizeToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("Authentication token is required.");
        }

        String token = rawToken.trim();
        if (token.regionMatches(true, 0, "Bearer ", 0, 7)) {
            token = token.substring(7).trim();
        }

        if (token.isBlank()) {
            throw new UnauthorizedException("Authentication token is required.");
        }

        return token;
    }

    public record SessionSnapshot(String token, Instant expiresAt, long inactivityTimeoutSeconds) {
    }

    private record StoredSession(String token, Long userId, Instant expiresAt, Instant lastSeenAt) {
    }
}