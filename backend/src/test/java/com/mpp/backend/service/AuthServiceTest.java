package com.mpp.backend.service;

import com.mpp.backend.dto.*;
import com.mpp.backend.error.UnauthorizedException;
import com.mpp.backend.repository.audit.AuditLogRepository;
import com.mpp.backend.repository.security.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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

    @Autowired
    private EmailCodeChallengeService challengeService;

    @MockBean
    private OneTimeCodeEmailService emailService;

    @Test
    void shouldLoginAdminAndReturnPermissionsAndToken() {
        AuthCodeChallengeResponse challenge = authService.requestLoginCode(
                new LoginStartRequest("admin", "admin123", "blue"),
                "127.0.0.1"
        );

        LoginResponse response = authService.verifyLoginCode(
                new LoginCodeVerifyRequest(
                        challenge.challengeId(),
                        challengeService.peekCode(challenge.challengeId())
                ),
                "127.0.0.1"
        );

        assertThat(response.roles()).contains("ADMIN");
        assertThat(response.permissions()).contains("AUDIT_VIEW", "OBSERVATION_VIEW", "CHAT_USE");
        assertThat(response.token()).isNotBlank();
        assertThat(response.inactivityTimeoutSeconds()).isPositive();
    }

    @Test
    void shouldRejectBadSecurityAnswer() {
        assertThatThrownBy(() -> authService.requestLoginCode(
                new LoginStartRequest("admin", "admin123", "wrong"),
                "127.0.0.1"
        )).isInstanceOf(UnauthorizedException.class);

        assertThat(auditLogRepository.findTop100ByOrderByTimestampDesc().getFirst().getActionInformation())
                .startsWith("LOGIN_FAILURE");
    }

    @Test
    void shouldRegisterNormalUser() {
        AuthCodeChallengeResponse challenge = authService.requestRegisterCode(
                new RegisterStartRequest(
                        "alex",
                        "Alex Carter",
                        "alex@example.com",
                        "secret123",
                        "What city were you born in?",
                        "rock"
                )
        );

        LoginResponse response = authService.verifyRegisterCode(
                new RegisterCodeVerifyRequest(
                        challenge.challengeId(),
                        challengeService.peekCode(challenge.challengeId())
                ),
                "127.0.0.1"
        );

        assertThat(response.username()).isEqualTo("alex");
        assertThat(response.displayName()).isEqualTo("Alex Carter");
        assertThat(response.roles()).containsExactly("USER");
        assertThat(response.permissions()).contains("PLAYLIST_READ", "PLAYLIST_WRITE", "CHAT_USE");
        assertThat(response.token()).isNotBlank();
        assertThat(userAccountRepository.findByUsernameIgnoreCase("alex")).isPresent();
    }

    @Test
    void shouldResetPassword() {
        AuthCodeChallengeResponse resetChallenge = authService.requestPasswordResetCode(
                new PasswordResetStartRequest("user", "luna", "newpass123")
        );

        authService.verifyPasswordResetCode(
                new PasswordResetCodeVerifyRequest(
                        resetChallenge.challengeId(),
                        challengeService.peekCode(resetChallenge.challengeId())
                )
        );

        AuthCodeChallengeResponse loginChallenge = authService.requestLoginCode(
                new LoginStartRequest("user", "newpass123", "luna"),
                "127.0.0.1"
        );

        LoginResponse response = authService.verifyLoginCode(
                new LoginCodeVerifyRequest(
                        loginChallenge.challengeId(),
                        challengeService.peekCode(loginChallenge.challengeId())
                ),
                "127.0.0.1"
        );

        assertThat(response.username()).isEqualTo("user");
    }
}