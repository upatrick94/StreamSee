package com.mpp.backend.dto;

import java.time.Instant;

public record ObservationEntryResponse(
        Long userId,
        String username,
        String reason,
        int evidenceCount,
        Instant firstDetectedAt,
        Instant lastDetectedAt
) {
}
