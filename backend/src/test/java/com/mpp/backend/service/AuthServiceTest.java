package com.mpp.backend.service;

import com.mpp.backend.dto.LoginRequest;
import com.mpp.backend.dto.LoginResponse;
import com.mpp.backend.dto.RegisterRequest;
import com.mpp.backend.repository.audit.AuditLogRepository;
import com.mpp.backend.repository.security.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Test
    void shouldLoginAdminAndReturnPermissions() {
        LoginResponse response = authService.login(new LoginRequest("admin", "admin123"), "127.0.0.1");
        assertThat(response.roles()).contains("ADMIN");
        assertThat(response.permissions()).contains("AUDIT_VIEW", "OBSERVATION_VIEW", "CHAT_USE");
    }

    @Test
    void shouldRejectBadPassword() {
        assertThatThrownBy(() -> authService.login(new LoginRequest("admin", "wrong"), "127.0.0.1"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(auditLogRepository.findTop100ByOrderByTimestampDesc().getFirst().getActionInformation())
                .startsWith("LOGIN_FAILURE");
    }

    @Test
    void shouldRegisterNormalUser() {
        LoginResponse response = authService.register(
                new RegisterRequest("alex", "Alex Carter", "secret123"),
                "127.0.0.1"
        );

        assertThat(response.username()).isEqualTo("alex");
        assertThat(response.displayName()).isEqualTo("Alex Carter");
        assertThat(response.roles()).containsExactly("USER");
        assertThat(response.permissions()).contains("PLAYLIST_READ", "PLAYLIST_WRITE", "CHAT_USE");
        assertThat(userAccountRepository.findByUsernameIgnoreCase("alex")).isPresent();
    }
}
