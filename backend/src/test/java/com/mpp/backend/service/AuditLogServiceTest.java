package com.mpp.backend.service;

import com.mpp.backend.dto.ObservationEntryResponse;
import com.mpp.backend.repository.security.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AuditLogServiceTest {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserAccountRepository users;

    @Test
    void shouldPlaceUserInObservationListAfterRepeatedDeletes() {
        Long userId = users.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        auditLogService.logAuthenticatedAction(userId, "DELETE_PLAYLIST id=1");
        auditLogService.logAuthenticatedAction(userId, "DELETE_PLAYLIST id=2");
        auditLogService.logAuthenticatedAction(userId, "DELETE_PLAYLIST id=3");

        List<ObservationEntryResponse> entries = auditLogService.getObservationList();
        assertThat(entries).isNotEmpty();
        assertThat(entries.getFirst().username()).isEqualTo("admin");
    }
}
