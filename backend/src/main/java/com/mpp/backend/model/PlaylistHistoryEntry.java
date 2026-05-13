package com.mpp.backend.model;

import java.time.Instant;

public record PlaylistHistoryEntry(
        long id,
        String action,
        String highlight,
        Instant createdAt,
        Playlist snapshot
) {
}