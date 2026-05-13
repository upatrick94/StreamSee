package com.mpp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpp.backend.dto.PageResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.dto.SongRequest;
import com.mpp.backend.error.ResourceNotFoundException;
import com.mpp.backend.mapper.PlaylistMapper;
import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;
import com.mpp.backend.model.PlaylistStatistics;
import com.mpp.backend.model.Song;
import com.mpp.backend.service.AuditLogService;
import com.mpp.backend.service.AuthorizationService;
import com.mpp.backend.service.PlaylistService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {PlaylistController.class, StatisticsController.class})
@Import({PlaylistMapper.class, com.mpp.backend.error.RestExceptionHandler.class})
class PlaylistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PlaylistService playlistService;

    @MockBean
    private AuthorizationService authorizationService;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    void shouldReturnPlaylistsPage() throws Exception {
        Playlist playlist = samplePlaylist();
        given(playlistService.getAllPlaylists(0, 10, new com.mpp.backend.repository.PlaylistFilter(null, null, null)))
                .willReturn(new PageResponse<>(List.of(playlist), 0, 10, 1, 1));

        mockMvc.perform(get("/api/playlists")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Late Night Drive"))
                .andExpect(jsonPath("$.content[0].songsCount").value(2))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void shouldReturnStatistics() throws Exception {
        PlaylistStatistics statistics = new PlaylistStatistics(
                2,
                5,
                1200,
                2.5,
                600.0,
                List.of(
                        new PlaylistStatistics.GenreCount("Electronic", 2),
                        new PlaylistStatistics.GenreCount("Lo-fi", 1)
                ),
                new PlaylistStatistics.PlaylistSummary(1L, "Late Night Drive", "Patrick", 2, 501)
        );

        given(playlistService.getStatistics()).willReturn(statistics);

        mockMvc.perform(get("/api/statistics")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPlaylists").value(2))
                .andExpect(jsonPath("$.totalSongs").value(5))
                .andExpect(jsonPath("$.topGenres[0].genre").value("Electronic"))
                .andExpect(jsonPath("$.longestPlaylist.name").value("Late Night Drive"));
    }

    @Test
    void shouldCreatePlaylist() throws Exception {
        given(playlistService.createPlaylist(any())).willReturn(samplePlaylist());

        mockMvc.perform(post("/api/playlists")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Late Night Drive"))
                .andExpect(jsonPath("$.songsCount").value(2));
    }

    @Test
    void shouldRejectInvalidCreateRequest() throws Exception {
        PlaylistRequest invalidRequest = new PlaylistRequest(
                "",
                "",
                "ftp://invalid",
                "short",
                List.of(""),
                List.of()
        );

        mockMvc.perform(post("/api/playlists")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed."))
                .andExpect(jsonPath("$.details").isArray());
    }

    @Test
    void shouldRejectInvalidUpdateRequest() throws Exception {
        PlaylistRequest invalidRequest = new PlaylistRequest(
                "Valid Name",
                "Valid Creator",
                "https://example.com/cover.jpg",
                "This description is valid enough.",
                List.of("Electronic"),
                List.of(new SongRequest("Valid song", "Valid artist", 0))
        );

        mockMvc.perform(put("/api/playlists/1")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed."))
                .andExpect(jsonPath("$.details").isArray());
    }

    @Test
    void shouldReturnNotFoundForGetById() throws Exception {
        given(playlistService.getPlaylistById(999L))
                .willThrow(new ResourceNotFoundException("Playlist with id 999 was not found."));

        mockMvc.perform(get("/api/playlists/999")
                        .header("X-User-Id", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Playlist with id 999 was not found."));
    }

    @Test
    void shouldUpdatePlaylist() throws Exception {
        Playlist updated = samplePlaylist();
        given(playlistService.updatePlaylist(eq(1L), any())).willReturn(updated);

        mockMvc.perform(put("/api/playlists/1")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creator").value("Patrick"));
    }

    @Test
    void shouldDeletePlaylist() throws Exception {
        mockMvc.perform(delete("/api/playlists/1")
                        .header("X-User-Id", "1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldReturnNotFoundForDelete() throws Exception {
        doThrow(new ResourceNotFoundException("Playlist with id 999 was not found."))
                .when(playlistService).deletePlaylist(999L);

        mockMvc.perform(delete("/api/playlists/999")
                        .header("X-User-Id", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Playlist with id 999 was not found."));
    }

    @Test
    void shouldReturnHistoryPage() throws Exception {
        Playlist playlist = samplePlaylist();
        PlaylistHistoryEntry entry = new PlaylistHistoryEntry(5L, "CREATED", "Late Night Drive", Instant.now(), playlist);
        given(playlistService.getPlaylistHistory(1L, 0, 10))
                .willReturn(new PageResponse<>(List.of(entry), 0, 10, 1, 1));

        mockMvc.perform(get("/api/playlists/1/history")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].action").value("CREATED"));
    }

    @Test
    void shouldReturnNotFoundForHistory() throws Exception {
        given(playlistService.getPlaylistHistory(999L, 0, 10))
                .willThrow(new ResourceNotFoundException("Playlist with id 999 was not found."));

        mockMvc.perform(get("/api/playlists/999/history")
                        .header("X-User-Id", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Playlist with id 999 was not found."));
    }

    @Test
    void shouldRestoreHistoryEntry() throws Exception {
        given(playlistService.restoreSnapshot(1L, 5L)).willReturn(samplePlaylist());

        mockMvc.perform(post("/api/playlists/1/history/5/restore")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldReturnNotFoundForMissingHistoryEntryRestore() throws Exception {
        given(playlistService.restoreSnapshot(1L, 999L))
                .willThrow(new ResourceNotFoundException("History entry with id 999 was not found for playlist 1."));

        mockMvc.perform(post("/api/playlists/1/history/999/restore")
                        .header("X-User-Id", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("History entry with id 999 was not found for playlist 1."));
    }

    @Test
    void shouldRejectNegativePage() throws Exception {
        mockMvc.perform(get("/api/playlists")
                        .header("X-User-Id", "1")
                        .param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed."));
    }

    @Test
    void shouldRejectZeroSize() throws Exception {
        mockMvc.perform(get("/api/playlists")
                        .header("X-User-Id", "1")
                        .param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed."));
    }

    @Test
    void shouldRejectTooLargeSize() throws Exception {
        mockMvc.perform(get("/api/playlists")
                        .header("X-User-Id", "1")
                        .param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed."));
    }

    private Playlist samplePlaylist() {
        return new Playlist(
                1L,
                "Late Night Drive",
                "Patrick",
                "https://example.com/cover.jpg",
                "A valid description for testing.",
                List.of("Electronic", "Lo-fi"),
                List.of(
                        new Song(1L, "Nightcall", "Kavinsky", 257),
                        new Song(2L, "Midnight City", "M83", 244)
                ),
                Instant.parse("2026-05-04T10:00:00Z"),
                Instant.parse("2026-05-04T10:05:00Z")
        );
    }




    private PlaylistRequest validRequest() {
        return new PlaylistRequest(
                "Late Night Drive",
                "Patrick",
                "https://example.com/cover.jpg",
                "A valid description for testing.",
                List.of("Electronic", "Lo-fi"),
                List.of(
                        new SongRequest("Nightcall", "Kavinsky", 257),
                        new SongRequest("Midnight City", "M83", 244)
                )
        );
    }
}
