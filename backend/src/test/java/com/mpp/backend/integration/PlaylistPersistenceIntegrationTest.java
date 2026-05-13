package com.mpp.backend.integration;

import com.mpp.backend.dto.PageResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.dto.SongRequest;
import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;
import com.mpp.backend.model.PlaylistStatistics;
import com.mpp.backend.repository.jpa.SpringDataPlaylistRepository;
import com.mpp.backend.service.PlaylistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class PlaylistPersistenceIntegrationTest {

    @Autowired
    private PlaylistService playlistService;

    @Autowired
    private SpringDataPlaylistRepository springDataPlaylistRepository;

    @BeforeEach
    void cleanDatabase() {
        springDataPlaylistRepository.deleteAll();
    }

    @Test
    void shouldPersistCreateUpdateRestoreDeleteAndHistory() {
        Playlist created = playlistService.createPlaylist(request(
                "Focus Flow",
                "Patrick",
                List.of("Lo-fi", "Electronic"),
                List.of(
                        new SongRequest("Track One", "Artist A", 120),
                        new SongRequest("Track Two", "Artist B", 180)
                )
        ));

        Playlist loaded = playlistService.getPlaylistById(created.id());
        assertThat(loaded.name()).isEqualTo("Focus Flow");
        assertThat(loaded.songs()).hasSize(2);

        Playlist updated = playlistService.updatePlaylist(created.id(), request(
                "Focus Flow Updated",
                "Patrick",
                List.of("Ambient"),
                List.of(new SongRequest("Track Three", "Artist C", 240))
        ));

        assertThat(updated.name()).isEqualTo("Focus Flow Updated");
        assertThat(updated.songs()).hasSize(1);

        PageResponse<PlaylistHistoryEntry> history = playlistService.getPlaylistHistory(created.id(), 0, 10);
        assertThat(history.content()).hasSize(2);
        assertThat(history.content().getFirst().action()).isEqualTo("UPDATED");

        Playlist restored = playlistService.restoreSnapshot(created.id(), history.content().getLast().id());
        assertThat(restored.name()).isEqualTo("Focus Flow");
        assertThat(restored.songs()).hasSize(2);

        playlistService.deletePlaylist(created.id());
        assertThat(springDataPlaylistRepository.existsById(created.id())).isFalse();
    }

    @Test
    void shouldFilterAndComputeStatisticsAgainstDatabase() {
        playlistService.createPlaylist(request(
                "Late Night Drive",
                "Patrick",
                List.of("Synthwave", "Electronic"),
                List.of(
                        new SongRequest("Nightcall", "Kavinsky", 257),
                        new SongRequest("Midnight City", "M83", 244)
                )
        ));

        playlistService.createPlaylist(request(
                "Morning Focus",
                "Bianca",
                List.of("Ambient"),
                List.of(new SongRequest("Awake", "Tycho", 282))
        ));

        PageResponse<Playlist> filteredByCreator = playlistService.getAllPlaylists(
                0, 10, new com.mpp.backend.repository.PlaylistFilter(null, "patrick", null)
        );
        assertThat(filteredByCreator.totalElements()).isEqualTo(1);

        PageResponse<Playlist> filteredByGenre = playlistService.getAllPlaylists(
                0, 10, new com.mpp.backend.repository.PlaylistFilter(null, null, "ambient")
        );
        assertThat(filteredByGenre.totalElements()).isEqualTo(1);

        PlaylistStatistics statistics = playlistService.getStatistics();
        assertThat(statistics.totalPlaylists()).isEqualTo(2);
        assertThat(statistics.totalSongs()).isEqualTo(3);
        assertThat(statistics.totalDurationSeconds()).isEqualTo(783);
        assertThat(statistics.topGenres()).isNotEmpty();
        assertThat(statistics.longestPlaylist()).isNotNull();
    }

    private PlaylistRequest request(String name, String creator, List<String> genres, List<SongRequest> songs) {
        return new PlaylistRequest(
                name,
                creator,
                "https://example.com/cover.jpg",
                "A valid description for persistence testing.",
                genres,
                songs
        );
    }
}
