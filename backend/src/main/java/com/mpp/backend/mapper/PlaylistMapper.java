package com.mpp.backend.mapper;

import com.mpp.backend.dto.GenreCountResponse;
import com.mpp.backend.dto.PlaylistHistoryEntryResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.dto.PlaylistResponse;
import com.mpp.backend.dto.PlaylistSummaryResponse;
import com.mpp.backend.dto.SongRequest;
import com.mpp.backend.dto.SongResponse;
import com.mpp.backend.dto.StatisticsResponse;
import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;
import com.mpp.backend.model.PlaylistStatistics;
import com.mpp.backend.model.Song;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Component
public class PlaylistMapper {

    public Playlist toNewPlaylist(PlaylistRequest request, long playlistId, AtomicLong songIdSequence, Instant now) {
        return new Playlist(
                playlistId,
                request.name().trim(),
                request.creator().trim(),
                normalizeCoverUrl(request.coverUrl()),
                request.description().trim(),
                sanitizeGenres(request.genres()),
                request.songs().stream()
                        .map(song -> toSong(song, songIdSequence.incrementAndGet()))
                        .toList(),
                now,
                now
        );
    }

    public Playlist toUpdatedPlaylist(Playlist current, PlaylistRequest request, AtomicLong songIdSequence, Instant now) {
        Set<Long> existingSongIds = current.songs().stream()
                .map(Song::id)
                .collect(Collectors.toSet());

        return new Playlist(
                current.id(),
                request.name().trim(),
                request.creator().trim(),
                normalizeCoverUrl(request.coverUrl()),
                request.description().trim(),
                sanitizeGenres(request.genres()),
                request.songs().stream()
                        .map(song -> toSong(song, resolveSongId(song, existingSongIds, songIdSequence)))
                        .toList(),
                current.createdAt(),
                now
        );
    }

    public PlaylistResponse toResponse(Playlist playlist) {
        return new PlaylistResponse(
                playlist.id(),
                playlist.name(),
                playlist.creator(),
                playlist.coverUrl(),
                playlist.description(),
                playlist.genres(),
                playlist.songs().stream().map(this::toResponse).toList(),
                playlist.songs().size(),
                totalDuration(playlist),
                playlist.createdAt(),
                playlist.updatedAt()
        );
    }

    public PlaylistHistoryEntryResponse toResponse(PlaylistHistoryEntry historyEntry) {
        return new PlaylistHistoryEntryResponse(
                historyEntry.id(),
                historyEntry.action(),
                historyEntry.highlight(),
                historyEntry.createdAt(),
                toResponse(historyEntry.snapshot())
        );
    }

    public StatisticsResponse toResponse(PlaylistStatistics statistics) {
        return new StatisticsResponse(
                statistics.totalPlaylists(),
                statistics.totalSongs(),
                statistics.totalDurationSeconds(),
                statistics.averageSongsPerPlaylist(),
                statistics.averageDurationSecondsPerPlaylist(),
                statistics.topGenres().stream()
                        .map(genre -> new GenreCountResponse(genre.genre(), genre.count()))
                        .toList(),
                statistics.longestPlaylist() == null
                        ? null
                        : new PlaylistSummaryResponse(
                        statistics.longestPlaylist().id(),
                        statistics.longestPlaylist().name(),
                        statistics.longestPlaylist().creator(),
                        statistics.longestPlaylist().songsCount(),
                        statistics.longestPlaylist().totalDurationSeconds()
                )
        );
    }

    private long resolveSongId(SongRequest request, Set<Long> existingSongIds, AtomicLong songIdSequence) {
        Long requestedId = request.id();

        if (requestedId != null && existingSongIds.contains(requestedId)) {
            return requestedId;
        }

        return songIdSequence.incrementAndGet();
    }

    private Song toSong(SongRequest request, long songId) {
        return new Song(
                songId,
                request.title().trim(),
                request.artist().trim(),
                request.durationSeconds()
        );
    }

    private SongResponse toResponse(Song song) {
        return new SongResponse(song.id(), song.title(), song.artist(), song.durationSeconds());
    }

    private List<String> sanitizeGenres(List<String> genres) {
        return genres.stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private String normalizeCoverUrl(String coverUrl) {
        return coverUrl == null ? "" : coverUrl.trim();
    }

    private long totalDuration(Playlist playlist) {
        return playlist.songs().stream()
                .mapToLong(Song::durationSeconds)
                .sum();
    }
}
