package com.mpp.backend.dto;

import java.time.Instant;

public record PlaylistHistoryEntryResponse(
        long id,
        String action,
        String highlight,
        Instant createdAt,
        PlaylistResponse snapshot
) {
}