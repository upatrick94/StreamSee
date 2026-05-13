package com.mpp.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SongRequest(
        Long id,

        @NotBlank(message = "Song title is required.")
        @Size(max = 120, message = "Song title must have at most 120 characters.")
        String title,

        @NotBlank(message = "Song artist is required.")
        @Size(max = 120, message = "Song artist must have at most 120 characters.")
        String artist,

        @NotNull(message = "Song duration is required.")
        @Min(value = 1, message = "Song duration must be greater than 0.")
        Integer durationSeconds
) {
    public SongRequest(String title, String artist, Integer durationSeconds) {
        this(null, title, artist, durationSeconds);
    }
}
