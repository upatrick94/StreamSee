package com.mpp.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PlaylistRequest(
        @NotBlank(message = "Playlist name is required.")
        @Size(min = 2, max = 100, message = "Playlist name must have between 2 and 100 characters.")
        String name,

        @NotBlank(message = "Creator is required.")
        @Size(min = 2, max = 100, message = "Creator must have between 2 and 100 characters.")
        String creator,

        @Pattern(
                regexp = "^(https?://.+)?$",
                message = "Cover URL must be empty or start with http:// or https://."
        )
        String coverUrl,

        @NotBlank(message = "Description is required.")
        @Size(min = 10, max = 500, message = "Description must have between 10 and 500 characters.")
        String description,

        @NotEmpty(message = "At least one genre is required.")
        List<@NotBlank(message = "Genres cannot contain blank values.") String> genres,

        @NotEmpty(message = "At least one song is required.")
        List<@Valid SongRequest> songs
) {
}