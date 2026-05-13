package com.mpp.backend.model;

import java.time.Instant;
import java.util.List;

public record Playlist(
        long id,
        String name,
        String creator,
        String coverUrl,
        String description,
        List<String> genres,
        List<Song> songs,
        Instant createdAt,
        Instant updatedAt
) {
}