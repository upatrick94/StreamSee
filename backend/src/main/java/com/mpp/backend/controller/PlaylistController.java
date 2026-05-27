package com.mpp.backend.controller;

import com.mpp.backend.dto.PageResponse;
import com.mpp.backend.dto.PlaylistHistoryEntryResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.dto.PlaylistResponse;
import com.mpp.backend.mapper.PlaylistMapper;
import com.mpp.backend.repository.PlaylistFilter;
import com.mpp.backend.service.AuditLogService;
import com.mpp.backend.service.AuthorizationService;
import com.mpp.backend.service.PlaylistService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;
    private final PlaylistMapper playlistMapper;
    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;

    public PlaylistController(
            PlaylistService playlistService,
            PlaylistMapper playlistMapper,
            AuthorizationService authorizationService,
            AuditLogService auditLogService
    ) {
        this.playlistService = playlistService;
        this.playlistMapper = playlistMapper;
        this.authorizationService = authorizationService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public PageResponse<PlaylistResponse> getPlaylists(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String creator,
            @RequestParam(required = false) String genre
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_READ");
        auditLogService.logAuthenticatedAction(userId, "READ_PLAYLISTS");
        var playlistPage = playlistService.getAllPlaylists(page, size, new PlaylistFilter(name, creator, genre));
        return new PageResponse<>(playlistPage.content().stream().map(playlistMapper::toResponse).toList(), playlistPage.page(), playlistPage.size(), playlistPage.totalElements(), playlistPage.totalPages());
    }

    @GetMapping("/{id}")
    public PlaylistResponse getPlaylist(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable long id
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_READ");
        auditLogService.logAuthenticatedAction(userId, "READ_PLAYLIST id=" + id);
        return playlistMapper.toResponse(playlistService.getPlaylistById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaylistResponse createPlaylist(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody PlaylistRequest request
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_WRITE");
        PlaylistResponse response = playlistMapper.toResponse(playlistService.createPlaylist(request));
        auditLogService.logAuthenticatedAction(userId, "CREATE_PLAYLIST id=" + response.id());
        return response;
    }

    @PutMapping("/{id}")
    public PlaylistResponse updatePlaylist(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable long id,
            @Valid @RequestBody PlaylistRequest request
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_WRITE");
        PlaylistResponse response = playlistMapper.toResponse(playlistService.updatePlaylist(id, request));
        auditLogService.logAuthenticatedAction(userId, "UPDATE_PLAYLIST id=" + id);
        return response;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlaylist(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable long id
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_DELETE");
        playlistService.deletePlaylist(id);
        auditLogService.logAuthenticatedAction(userId, "DELETE_PLAYLIST id=" + id);
    }

    @GetMapping("/{id}/history")
    public PageResponse<PlaylistHistoryEntryResponse> getPlaylistHistory(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable long id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_READ");
        auditLogService.logAuthenticatedAction(userId, "READ_PLAYLIST_HISTORY id=" + id);
        var historyPage = playlistService.getPlaylistHistory(id, page, size);
        return new PageResponse<>(historyPage.content().stream().map(playlistMapper::toResponse).toList(), historyPage.page(), historyPage.size(), historyPage.totalElements(), historyPage.totalPages());
    }

    @PostMapping("/{id}/history/{historyEntryId}/restore")
    public PlaylistResponse restoreHistoryEntry(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable long id,
            @PathVariable long historyEntryId
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_RESTORE");
        PlaylistResponse response = playlistMapper.toResponse(playlistService.restoreSnapshot(id, historyEntryId));
        auditLogService.logAuthenticatedAction(userId, "RESTORE_PLAYLIST id=" + id + " historyEntryId=" + historyEntryId);
        return response;
    }
}