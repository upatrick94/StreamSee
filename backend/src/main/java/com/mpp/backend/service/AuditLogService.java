package com.mpp.backend.service;

import com.mpp.backend.dto.AuditLogResponse;
import com.mpp.backend.dto.ObservationEntryResponse;
import com.mpp.backend.repository.audit.AuditLogEntity;
import com.mpp.backend.repository.audit.AuditLogRepository;
import com.mpp.backend.repository.audit.ObservationEntryEntity;
import com.mpp.backend.repository.audit.ObservationEntryRepository;
import com.mpp.backend.repository.security.UserAccountEntity;
import com.mpp.backend.repository.security.UserAccountRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository logs;
    private final ObservationEntryRepository observations;
    private final UserAccountRepository users;

    public AuditLogService(AuditLogRepository logs, ObservationEntryRepository observations, UserAccountRepository users) {
        this.logs = logs;
        this.observations = observations;
        this.users = users;
    }

    public void logLoginSuccess(UserAccountEntity user, String ipAddress) {
        save(user, "LOGIN_SUCCESS ip=" + ipAddress, false);
    }

    public void logLoginFailure(String username, String ipAddress) {
        logs.save(new AuditLogEntity(null, username, "ANONYMOUS", "LOGIN_FAILURE ip=" + ipAddress, Instant.now(), false));
    }

    public void logAuthenticatedAction(Long userId, String actionInformation) {
        UserAccountEntity user = users.findById(userId).orElseThrow();
        boolean suspicious = isSuspicious(userId, actionInformation);
        save(user, actionInformation, suspicious);
        if (suspicious) {
            Instant now = Instant.now();
            int evidenceCount = (int) logs.countByUserIdAndActionInformationStartingWithAndTimestampAfter(
                    userId, suspiciousPrefix(actionInformation), now.minus(10, ChronoUnit.MINUTES)
            );
            observations.findByUserId(userId)
                    .ifPresentOrElse(
                            entry -> {
                                entry.refresh("Repeated " + suspiciousPrefix(actionInformation), evidenceCount, now);
                                observations.save(entry);
                            },
                            () -> observations.save(new ObservationEntryEntity(
                                    user,
                                    "Repeated " + suspiciousPrefix(actionInformation),
                                    evidenceCount,
                                    now,
                                    now
                            ))
                    );
        }
    }

    public List<AuditLogResponse> getRecentLogs() {
        return logs.findTop100ByOrderByTimestampDesc().stream()
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getUser() == null ? null : log.getUser().getId(),
                        log.getUsernameSnapshot(),
                        log.getGroupName(),
                        log.getActionInformation(),
                        log.getTimestamp(),
                        log.isSuspicious()
                ))
                .toList();
    }

    public List<ObservationEntryResponse> getObservationList() {
        return observations.findAllByOrderByLastDetectedAtDesc().stream()
                .map(entry -> new ObservationEntryResponse(
                        entry.getUser().getId(),
                        entry.getUser().getUsername(),
                        entry.getReason(),
                        entry.getEvidenceCount(),
                        entry.getFirstDetectedAt(),
                        entry.getLastDetectedAt()
                ))
                .toList();
    }

    private void save(UserAccountEntity user, String info, boolean suspicious) {
        String group = user.getRoles().stream().anyMatch(role -> role.getName().equals("ADMIN")) ? "ADMIN" : "USER";
        logs.save(new AuditLogEntity(user, user.getUsername(), group, info, Instant.now(), suspicious));
    }

    private boolean isSuspicious(Long userId, String actionInformation) {
        String prefix = suspiciousPrefix(actionInformation);
        if (prefix == null) {
            return false;
        }
        Instant threshold = prefix.equals("SEND_CHAT_MESSAGE")
                ? Instant.now().minus(1, ChronoUnit.MINUTES)
                : Instant.now().minus(10, ChronoUnit.MINUTES);

        long count = logs.countByUserIdAndActionInformationStartingWithAndTimestampAfter(userId, prefix, threshold);
        long limit = prefix.equals("SEND_CHAT_MESSAGE") ? 20 : 3;
        return count + 1 >= limit;
    }

    private String suspiciousPrefix(String info) {
        if (info.startsWith("DELETE_PLAYLIST")) return "DELETE_PLAYLIST";
        if (info.startsWith("RESTORE_PLAYLIST")) return "RESTORE_PLAYLIST";
        if (info.startsWith("SEND_CHAT_MESSAGE")) return "SEND_CHAT_MESSAGE";
        return null;
    }
}
