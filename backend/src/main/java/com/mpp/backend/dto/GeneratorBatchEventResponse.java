package com.mpp.backend.dto;

import java.time.Instant;
import java.util.List;

public record GeneratorBatchEventResponse(
        String type,
        int batchSize,
        long totalPlaylists,
        List<PlaylistResponse> playlists,
        StatisticsResponse statistics,
        Instant createdAt
) {
}
