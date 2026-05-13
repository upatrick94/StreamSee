package com.mpp.backend.dto;

import java.util.List;

public record StatisticsResponse(
        long totalPlaylists,
        long totalSongs,
        long totalDurationSeconds,
        double averageSongsPerPlaylist,
        double averageDurationSecondsPerPlaylist,
        List<GenreCountResponse> topGenres,
        PlaylistSummaryResponse longestPlaylist
) {
}