package com.mpp.backend.controller;

import com.mpp.backend.dto.AuditLogResponse;
import com.mpp.backend.dto.ObservationEntryResponse;
import com.mpp.backend.service.AuditLogService;
import com.mpp.backend.service.AuthorizationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;

    public AdminController(AuthorizationService authorizationService, AuditLogService auditLogService) {
        this.authorizationService = authorizationService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/audit-logs")
    public List<AuditLogResponse> getAuditLogs(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId
    ) {
        authorizationService.ensurePermission(authToken, userId, "AUDIT_VIEW");
        return auditLogService.getRecentLogs();
    }

    @GetMapping("/observation-list")
    public List<ObservationEntryResponse> getObservationList(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId
    ) {
        authorizationService.ensurePermission(authToken, userId, "OBSERVATION_VIEW");
        return auditLogService.getObservationList();
    }
}