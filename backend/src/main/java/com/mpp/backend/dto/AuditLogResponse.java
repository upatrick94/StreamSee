package com.mpp.backend.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        Long userId,
        String username,
        String groupName,
        String actionInformation,
        Instant timestamp,
        boolean suspicious
) {
}
