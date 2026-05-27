package com.mpp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpp.backend.dto.*;
import com.mpp.backend.error.RestExceptionHandler;
import com.mpp.backend.error.UnauthorizedException;
import com.mpp.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import(RestExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void shouldRequestLoginCodeSuccessfully() throws Exception {
        LoginStartRequest request = new LoginStartRequest("admin", "admin123", "blue");

        given(authService.requestLoginCode(eq(request), anyString()))
                .willReturn(new AuthCodeChallengeResponse(
                        "challenge-1",
                        "u***@g***.com",
                        "Verification code sent to the email associated with this account."
                ));

        mockMvc.perform(post("/api/auth/login/request-code")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challengeId").value("challenge-1"));
    }

    @Test
    void shouldVerifyLoginCodeSuccessfully() throws Exception {
        LoginCodeVerifyRequest request = new LoginCodeVerifyRequest("challenge-1", "123456");

        given(authService.verifyLoginCode(eq(request), anyString()))
                .willReturn(new LoginResponse(
                        1L,
                        "admin",
                        "Administrator",
                        List.of("ADMIN"),
                        List.of("AUDIT_VIEW", "CHAT_USE"),
                        "token-123",
                        Instant.parse("2026-05-20T10:15:30Z"),
                        900
                ));

        mockMvc.perform(post("/api/auth/login/verify-code")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.token").value("token-123"));
    }

    @Test
    void shouldRejectInvalidLoginRequest() throws Exception {
        LoginStartRequest request = new LoginStartRequest("admin", "wrong", "wrong");

        willThrow(new UnauthorizedException("Invalid username, password, or security answer."))
                .given(authService).requestLoginCode(eq(request), anyString());

        mockMvc.perform(post("/api/auth/login/request-code")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username, password, or security answer."));
    }

    @Test
    void shouldRequestRegisterCodeSuccessfully() throws Exception {
        RegisterStartRequest request = new RegisterStartRequest(
                "alex",
                "Alex Carter",
                "alex@example.com",
                "secret123",
                "What city were you born in?",
                "rock"
        );

        given(authService.requestRegisterCode(eq(request)))
                .willReturn(new AuthCodeChallengeResponse(
                        "challenge-2",
                        "a***@e***.com",
                        "Verification code sent to the email address for this new account."
                ));

        mockMvc.perform(post("/api/auth/register/request-code")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challengeId").value("challenge-2"));
    }

    @Test
    void shouldVerifyRegisterCodeSuccessfully() throws Exception {
        RegisterCodeVerifyRequest request = new RegisterCodeVerifyRequest("challenge-2", "654321");

        given(authService.verifyRegisterCode(eq(request), anyString()))
                .willReturn(new LoginResponse(
                        3L,
                        "alex",
                        "Alex Carter",
                        List.of("USER"),
                        List.of("CHAT_USE", "PLAYLIST_READ", "PLAYLIST_WRITE"),
                        "token-abc",
                        Instant.parse("2026-05-20T10:15:30Z"),
                        900
                ));

        mockMvc.perform(post("/api/auth/register/verify-code")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alex"))
                .andExpect(jsonPath("$.token").value("token-abc"));
    }

    @Test
    void shouldRequestPasswordResetCodeSuccessfully() throws Exception {
        PasswordResetStartRequest request = new PasswordResetStartRequest("user", "luna", "newpass123");

        given(authService.requestPasswordResetCode(eq(request)))
                .willReturn(new AuthCodeChallengeResponse(
                        "challenge-3",
                        "u***@g***.com",
                        "Verification code sent to the email associated with this account."
                ));

        mockMvc.perform(post("/api/auth/recover/request-code")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challengeId").value("challenge-3"));
    }

    @Test
    void shouldVerifyPasswordResetSuccessfully() throws Exception {
        PasswordResetCodeVerifyRequest request = new PasswordResetCodeVerifyRequest("challenge-3", "111222");

        willDoNothing().given(authService).verifyPasswordResetCode(eq(request));

        mockMvc.perform(post("/api/auth/recover/verify-code")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully."));
    }
}