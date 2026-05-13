package com.mpp.backend.dto;

import java.time.Instant;
import java.util.List;

public record PlaylistResponse(
        long id,
        String name,
        String creator,
        String coverUrl,
        String description,
        List<String> genres,
        List<SongResponse> songs,
        int songsCount,
        long totalDurationSeconds,
        Instant createdAt,
        Instant updatedAt
) {
}