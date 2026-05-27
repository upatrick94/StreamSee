package com.mpp.backend.controller;

import com.mpp.backend.dto.*;
import com.mpp.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login/request-code")
    public AuthCodeChallengeResponse requestLoginCode(
            @Valid @RequestBody LoginStartRequest request,
            HttpServletRequest httpRequest
    ) {
        return authService.requestLoginCode(request, httpRequest.getRemoteAddr());
    }

    @PostMapping("/login/verify-code")
    public LoginResponse verifyLoginCode(
            @Valid @RequestBody LoginCodeVerifyRequest request,
            HttpServletRequest httpRequest
    ) {
        return authService.verifyLoginCode(request, httpRequest.getRemoteAddr());
    }

    @PostMapping("/register/request-code")
    public AuthCodeChallengeResponse requestRegisterCode(@Valid @RequestBody RegisterStartRequest request) {
        return authService.requestRegisterCode(request);
    }

    @PostMapping("/register/verify-code")
    public LoginResponse verifyRegisterCode(
            @Valid @RequestBody RegisterCodeVerifyRequest request,
            HttpServletRequest httpRequest
    ) {
        return authService.verifyRegisterCode(request, httpRequest.getRemoteAddr());
    }

    @PostMapping("/recover/request-code")
    public AuthCodeChallengeResponse requestPasswordResetCode(@Valid @RequestBody PasswordResetStartRequest request) {
        return authService.requestPasswordResetCode(request);
    }

    @PostMapping("/recover/verify-code")
    public Map<String, String> verifyPasswordResetCode(@Valid @RequestBody PasswordResetCodeVerifyRequest request) {
        authService.verifyPasswordResetCode(request);
        return Map.of("message", "Password reset successfully.");
    }

    @PostMapping("/logout")
    public Map<String, String> logout(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader("X-User-Id") Long userId
    ) {
        authService.logout(authToken, userId);
        return Map.of("message", "Logged out successfully.");
    }
}