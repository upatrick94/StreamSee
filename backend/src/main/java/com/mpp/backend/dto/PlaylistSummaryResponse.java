package com.mpp.backend.dto;

public record PlaylistSummaryResponse(
        long id,
        String name,
        String creator,
        int songsCount,
        long totalDurationSeconds
) {
}