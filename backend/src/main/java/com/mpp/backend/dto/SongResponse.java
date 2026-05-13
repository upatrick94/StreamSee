package com.mpp.backend.dto;

public record SongResponse(
        long id,
        String title,
        String artist,
        int durationSeconds
) {
}
