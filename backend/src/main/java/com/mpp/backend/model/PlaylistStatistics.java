package com.mpp.backend.model;

import java.util.List;

public record PlaylistStatistics(
        long totalPlaylists,
        long totalSongs,
        long totalDurationSeconds,
        double averageSongsPerPlaylist,
        double averageDurationSecondsPerPlaylist,
        List<GenreCount> topGenres,
        PlaylistSummary longestPlaylist
) {
    public record GenreCount(String genre, long count) {
    }

    public record PlaylistSummary(long id, String name, String creator, int songsCount, long totalDurationSeconds) {
    }
}