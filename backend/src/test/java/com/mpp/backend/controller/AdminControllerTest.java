package com.mpp.backend.controller;

import com.mpp.backend.dto.AuditLogResponse;
import com.mpp.backend.dto.ObservationEntryResponse;
import com.mpp.backend.service.AuditLogService;
import com.mpp.backend.service.AuthorizationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.BDDMockito.doNothing;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AdminController.class)
@Import(com.mpp.backend.error.RestExceptionHandler.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthorizationService authorizationService;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    void shouldReturnAuditLogs() throws Exception {
        doNothing().when(authorizationService).ensurePermission(1L, "AUDIT_VIEW");
        given(auditLogService.getRecentLogs()).willReturn(List.of(
                new AuditLogResponse(10L, 1L, "admin", "ADMIN", "DELETE_PLAYLIST id=5", Instant.parse("2026-05-04T10:00:00Z"), true)
        ));

        mockMvc.perform(get("/api/admin/audit-logs").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].suspicious").value(true));
    }

    @Test
    void shouldReturnObservationList() throws Exception {
        doNothing().when(authorizationService).ensurePermission(1L, "OBSERVATION_VIEW");
        given(auditLogService.getObservationList()).willReturn(List.of(
                new ObservationEntryResponse(1L, "admin", "Repeated DELETE_PLAYLIST", 3, Instant.parse("2026-05-04T09:50:00Z"), Instant.parse("2026-05-04T10:00:00Z"))
        ));

        mockMvc.perform(get("/api/admin/observation-list").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].evidenceCount").value(3));
    }
}
