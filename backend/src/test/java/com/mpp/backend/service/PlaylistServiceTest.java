package com.mpp.backend.service;

import com.mpp.backend.dto.PageResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.dto.SongRequest;
import com.mpp.backend.error.ResourceNotFoundException;
import com.mpp.backend.mapper.PlaylistMapper;
import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;
import com.mpp.backend.model.PlaylistStatistics;
import com.mpp.backend.repository.InMemoryPlaylistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PlaylistServiceTest {

    private PlaylistService playlistService;

    @BeforeEach
    void setUp() {
        playlistService = new PlaylistService(new InMemoryPlaylistRepository(), new PlaylistMapper());
        playlistService.seedPlaylist(new Playlist(
                1L,
                "Focus Flow",
                "Patrick",
                "https://example.com/focus.jpg",
                "Focused music for studying and deep work sessions.",
                List.of("Lo-fi", "Electronic"),
                List.of(
                        new com.mpp.backend.model.Song(10L, "Track One", "Artist A", 120),
                        new com.mpp.backend.model.Song(11L, "Track Two", "Artist B", 180)
                ),
                Instant.parse("2026-04-01T10:00:00Z"),
                Instant.parse("2026-04-01T10:00:00Z")
        ));
    }

    @Test
    void shouldCreatePlaylistAndInitializeHistory() {
        Playlist created = playlistService.createPlaylist(validRequest());

        assertThat(created.id()).isGreaterThan(1L);
        assertThat(created.songs()).hasSize(2);

        PageResponse<PlaylistHistoryEntry> history = playlistService.getPlaylistHistory(created.id(), 0, 10);
        assertThat(history.content()).hasSize(1);
        assertThat(history.content().getFirst().action()).isEqualTo("CREATED");
    }

    @Test
    void shouldGetPlaylistById() {
        Playlist playlist = playlistService.getPlaylistById(1L);

        assertThat(playlist.name()).isEqualTo("Focus Flow");
        assertThat(playlist.creator()).isEqualTo("Patrick");
    }

    @Test
    void shouldUpdatePlaylistAndAppendHistory() {
        Playlist updated = playlistService.updatePlaylist(1L, new PlaylistRequest(
                "Focus Flow Updated",
                "Patrick",
                "https://example.com/focus.jpg",
                "Focused music for studying and exams.",
                List.of("Lo-fi", "Ambient"),
                List.of(new SongRequest("New Track", "Artist C", 240))
        ));

        assertThat(updated.name()).isEqualTo("Focus Flow Updated");
        assertThat(updated.songs()).hasSize(1);

        PageResponse<PlaylistHistoryEntry> history = playlistService.getPlaylistHistory(1L, 0, 10);
        assertThat(history.content()).hasSize(2);
        assertThat(history.content().getFirst().action()).isEqualTo("UPDATED");
    }

    @Test
    void shouldRestorePlaylistFromHistory() {
        Playlist updated = playlistService.updatePlaylist(1L, new PlaylistRequest(
                "Completely Different",
                "Patrick",
                "https://example.com/focus.jpg",
                "A different study playlist description.",
                List.of("Ambient"),
                List.of(new SongRequest("Only Song", "Artist Z", 300))
        ));

        PageResponse<PlaylistHistoryEntry> history = playlistService.getPlaylistHistory(updated.id(), 0, 10);
        Playlist restored = playlistService.restoreSnapshot(updated.id(), history.content().getLast().id());

        assertThat(restored.name()).isEqualTo("Focus Flow");
        assertThat(restored.songs()).hasSize(2);

        PageResponse<PlaylistHistoryEntry> updatedHistory = playlistService.getPlaylistHistory(updated.id(), 0, 10);
        assertThat(updatedHistory.content().getFirst().action()).isEqualTo("RESTORED");
    }

    @Test
    void shouldDeletePlaylist() {
        playlistService.deletePlaylist(1L);

        assertThatThrownBy(() -> playlistService.getPlaylistById(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void shouldReturnPaginatedPlaylists() {
        playlistService.createPlaylist(new PlaylistRequest(
                "Second Playlist",
                "Ana",
                "https://example.com/second.jpg",
                "Another playlist used to verify pagination.",
                List.of("Pop"),
                List.of(new SongRequest("Song", "Artist", 200))
        ));

        PageResponse<Playlist> page = playlistService.getAllPlaylists(0, 1);

        assertThat(page.content()).hasSize(1);
        assertThat(page.totalElements()).isEqualTo(2);
        assertThat(page.totalPages()).isEqualTo(2);
    }

    @Test
    void shouldReturnHistoryPage() {
        PageResponse<PlaylistHistoryEntry> page = playlistService.getPlaylistHistory(1L, 0, 10);

        assertThat(page.content()).hasSize(1);
        assertThat(page.totalElements()).isEqualTo(1);
        assertThat(page.content().getFirst().action()).isEqualTo("CREATED");
    }

    @Test
    void shouldComputeStatistics() {
        PlaylistStatistics statistics = playlistService.getStatistics();

        assertThat(statistics.totalPlaylists()).isEqualTo(1);
        assertThat(statistics.totalSongs()).isEqualTo(2);
        assertThat(statistics.totalDurationSeconds()).isEqualTo(300);
        assertThat(statistics.topGenres()).extracting(PlaylistStatistics.GenreCount::genre)
                .contains("Lo-fi", "Electronic");
        assertThat(statistics.longestPlaylist()).isNotNull();
    }

    @Test
    void shouldFailForMissingPlaylistOnUpdate() {
        assertThatThrownBy(() -> playlistService.updatePlaylist(999L, validRequest()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void shouldFailForMissingPlaylistOnDelete() {
        assertThatThrownBy(() -> playlistService.deletePlaylist(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Playlist with id 999 was not found.");
    }

    @Test
    void shouldFailForMissingPlaylistOnHistory() {
        assertThatThrownBy(() -> playlistService.getPlaylistHistory(999L, 0, 10))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Playlist with id 999 was not found.");
    }

    @Test
    void shouldFailForMissingHistoryEntryRestore() {
        assertThatThrownBy(() -> playlistService.restoreSnapshot(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("History entry with id 999 was not found for playlist 1.");
    }

    @Test
    void shouldRejectNegativePage() {
        assertThatThrownBy(() -> playlistService.getAllPlaylists(-1, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Page index must be greater than or equal to 0.");
    }

    @Test
    void shouldRejectSizeBelowRange() {
        assertThatThrownBy(() -> playlistService.getAllPlaylists(0, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Page size must be between 1 and 100.");
    }

    @Test
    void shouldRejectSizeAboveRange() {
        assertThatThrownBy(() -> playlistService.getAllPlaylists(0, 101))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Page size must be between 1 and 100.");
    }

    private PlaylistRequest validRequest() {
        return new PlaylistRequest(
                "Study Mix",
                "Patrick",
                "https://example.com/study.jpg",
                "A playlist for study sessions and concentration.",
                List.of("Lo-fi", "Ambient"),
                List.of(
                        new SongRequest("Intro", "Artist A", 150),
                        new SongRequest("Focus Beat", "Artist B", 210)
                )
        );
    }
}
