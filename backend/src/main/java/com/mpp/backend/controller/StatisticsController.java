package com.mpp.backend.controller;

import com.mpp.backend.dto.StatisticsResponse;
import com.mpp.backend.mapper.PlaylistMapper;
import com.mpp.backend.service.AuditLogService;
import com.mpp.backend.service.AuthorizationService;
import com.mpp.backend.service.PlaylistService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final PlaylistService playlistService;
    private final PlaylistMapper playlistMapper;
    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;

    public StatisticsController(
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
    public StatisticsResponse getStatistics(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId
    ) {
        authorizationService.ensurePermission(authToken, userId, "PLAYLIST_READ");
        auditLogService.logAuthenticatedAction(userId, "READ_STATISTICS");
        return playlistMapper.toResponse(playlistService.getStatistics());
    }
}