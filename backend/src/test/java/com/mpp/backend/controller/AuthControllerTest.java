package com.mpp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpp.backend.dto.LoginRequest;
import com.mpp.backend.dto.LoginResponse;
import com.mpp.backend.dto.RegisterRequest;
import com.mpp.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import(com.mpp.backend.error.RestExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void shouldLoginSuccessfully() throws Exception {
        given(authService.login(eq(new LoginRequest("admin", "admin123")), anyString()))
                .willReturn(new LoginResponse(
                        1L,
                        "admin",
                        "Administrator",
                        List.of("ADMIN"),
                        List.of("AUDIT_VIEW", "CHAT_USE")
                ));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "admin123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.roles[0]").value("ADMIN"));
    }

    @Test
    void shouldRejectInvalidCredentials() throws Exception {
        willThrow(new IllegalArgumentException("Invalid username or password."))
                .given(authService).login(eq(new LoginRequest("admin", "wrong")), anyString());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "wrong"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid username or password."));
    }

    @Test
    void shouldRegisterSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("alex", "Alex Carter", "secret123");

        given(authService.register(eq(request), anyString()))
                .willReturn(new LoginResponse(
                        3L,
                        "alex",
                        "Alex Carter",
                        List.of("USER"),
                        List.of("CHAT_USE", "PLAYLIST_READ", "PLAYLIST_WRITE")
                ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alex"))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }
}
