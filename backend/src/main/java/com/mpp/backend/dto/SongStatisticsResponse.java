package com.mpp.backend.dto;

public record SongStatisticsResponse(
        int totalSongs,
        int uniqueArtists,
        double averageSongDurationSeconds,
        int totalDurationSeconds,
        SongResponse longestSong
) {
}
