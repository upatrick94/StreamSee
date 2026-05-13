package com.mpp.backend.service;

import com.mpp.backend.dto.PageResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.error.ResourceNotFoundException;
import com.mpp.backend.mapper.PlaylistMapper;
import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;
import com.mpp.backend.model.PlaylistStatistics;
import com.mpp.backend.model.Song;
import com.mpp.backend.repository.PlaylistFilter;
import com.mpp.backend.repository.PlaylistRepository;
import com.mpp.backend.repository.PlaylistStore;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistMapper playlistMapper;
    private final AtomicLong playlistIdSequence = new AtomicLong(100);
    private final AtomicLong songIdSequence = new AtomicLong(1000);
    private final AtomicLong historyIdSequence = new AtomicLong(5000);

    public PlaylistService(PlaylistRepository playlistRepository, PlaylistMapper playlistMapper) {
        this.playlistRepository = playlistRepository;
        this.playlistMapper = playlistMapper;
    }

    public PageResponse<Playlist> getAllPlaylists(int page, int size) {
        return getAllPlaylists(page, size, new PlaylistFilter(null, null, null));
    }

    public PageResponse<Playlist> getAllPlaylists(int page, int size, PlaylistFilter filter) {
        validatePaging(page, size);

        List<Playlist> playlists = (filter == null || filter.isEmpty()
                ? playlistRepository.findAll()
                : playlistRepository.findAll(filter))
                .stream()
                .map(PlaylistStore::getPlaylist)
                .sorted(Comparator.comparing(Playlist::updatedAt).reversed().thenComparing(Playlist::id))
                .toList();

        return paginate(playlists, page, size);
    }

    public Playlist getPlaylistById(long id) {
        return findStore(id).getPlaylist();
    }

    public Playlist createPlaylist(PlaylistRequest request) {
        long playlistId = playlistIdSequence.incrementAndGet();
        Instant now = Instant.now();
        Playlist playlist = playlistMapper.toNewPlaylist(request, playlistId, songIdSequence, now);

        PlaylistHistoryEntry initialHistory = new PlaylistHistoryEntry(
                historyIdSequence.incrementAndGet(),
                "CREATED",
                playlist.name(),
                now,
                playlist
        );

        playlistRepository.save(new PlaylistStore(playlist, List.of(initialHistory)));
        return playlist;
    }

    public Playlist updatePlaylist(long id, PlaylistRequest request) {
        PlaylistStore store = findStore(id);
        Instant now = Instant.now();
        Playlist updatedPlaylist = playlistMapper.toUpdatedPlaylist(store.getPlaylist(), request, songIdSequence, now);

        store.setPlaylist(updatedPlaylist);
        store.getHistoryEntries().add(new PlaylistHistoryEntry(
                historyIdSequence.incrementAndGet(),
                "UPDATED",
                updatedPlaylist.name(),
                now,
                updatedPlaylist
        ));

        playlistRepository.save(store);
        return updatedPlaylist;
    }

    public void deletePlaylist(long id) {
        if (!playlistRepository.existsById(id)) {
            throw new ResourceNotFoundException("Playlist with id " + id + " was not found.");
        }
        playlistRepository.deleteById(id);
    }

    public PageResponse<PlaylistHistoryEntry> getPlaylistHistory(long id, int page, int size) {
        validatePaging(page, size);
        PlaylistStore store = findStore(id);
        List<PlaylistHistoryEntry> historyEntries = store.getHistoryEntries().stream()
                .sorted(Comparator.comparing(PlaylistHistoryEntry::createdAt).reversed())
                .toList();

        return paginate(historyEntries, page, size);
    }

    public Playlist restoreSnapshot(long id, long historyEntryId) {
        PlaylistStore store = findStore(id);
        PlaylistHistoryEntry historyEntry = store.getHistoryEntries().stream()
                .filter(entry -> entry.id() == historyEntryId)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "History entry with id " + historyEntryId + " was not found for playlist " + id + "."
                ));

        Instant now = Instant.now();
        Playlist restored = new Playlist(
                store.getPlaylist().id(),
                historyEntry.snapshot().name(),
                historyEntry.snapshot().creator(),
                historyEntry.snapshot().coverUrl(),
                historyEntry.snapshot().description(),
                historyEntry.snapshot().genres(),
                historyEntry.snapshot().songs(),
                store.getPlaylist().createdAt(),
                now
        );

        store.setPlaylist(restored);
        store.getHistoryEntries().add(new PlaylistHistoryEntry(
                historyIdSequence.incrementAndGet(),
                "RESTORED",
                historyEntry.highlight(),
                now,
                restored
        ));

        playlistRepository.save(store);
        return restored;
    }

    public PlaylistStatistics getStatistics() {
        List<Playlist> playlists = playlistRepository.findAll().stream()
                .map(PlaylistStore::getPlaylist)
                .toList();

        long totalPlaylists = playlists.size();
        long totalSongs = playlists.stream().mapToLong(playlist -> playlist.songs().size()).sum();
        long totalDurationSeconds = playlists.stream()
                .flatMap(playlist -> playlist.songs().stream())
                .mapToLong(Song::durationSeconds)
                .sum();

        double averageSongsPerPlaylist = totalPlaylists == 0 ? 0 : (double) totalSongs / totalPlaylists;
        double averageDurationPerPlaylist = totalPlaylists == 0 ? 0 : (double) totalDurationSeconds / totalPlaylists;

        List<PlaylistStatistics.GenreCount> topGenres = playlists.stream()
                .flatMap(playlist -> playlist.genres().stream())
                .collect(java.util.stream.Collectors.groupingBy(genre -> genre, java.util.stream.Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry::getKey))
                .limit(5)
                .map(entry -> new PlaylistStatistics.GenreCount(entry.getKey(), entry.getValue()))
                .toList();

        PlaylistStatistics.PlaylistSummary longestPlaylist = playlists.stream()
                .max(Comparator.comparingLong(this::totalDuration))
                .map(playlist -> new PlaylistStatistics.PlaylistSummary(
                        playlist.id(),
                        playlist.name(),
                        playlist.creator(),
                        playlist.songs().size(),
                        totalDuration(playlist)
                ))
                .orElse(null);

        return new PlaylistStatistics(
                totalPlaylists,
                totalSongs,
                totalDurationSeconds,
                round(averageSongsPerPlaylist),
                round(averageDurationPerPlaylist),
                topGenres,
                longestPlaylist
        );
    }

    public void seedPlaylist(Playlist playlist) {
        playlistIdSequence.updateAndGet(current -> Math.max(current, playlist.id()));
        playlist.songs().forEach(song -> songIdSequence.updateAndGet(current -> Math.max(current, song.id())));

        PlaylistHistoryEntry initialHistory = new PlaylistHistoryEntry(
                historyIdSequence.incrementAndGet(),
                "CREATED",
                playlist.name(),
                playlist.createdAt(),
                playlist
        );

        playlistRepository.save(new PlaylistStore(playlist, List.of(initialHistory)));
    }

    private PlaylistStore findStore(long id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist with id " + id + " was not found."));
    }

    private <T> PageResponse<T> paginate(List<T> items, int page, int size) {
        int fromIndex = Math.min(page * size, items.size());
        int toIndex = Math.min(fromIndex + size, items.size());
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) items.size() / size);

        return new PageResponse<>(items.subList(fromIndex, toIndex), page, size, items.size(), totalPages);
    }

    private void validatePaging(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page index must be greater than or equal to 0.");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100.");
        }
    }

    private long totalDuration(Playlist playlist) {
        return playlist.songs().stream().mapToLong(Song::durationSeconds).sum();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
