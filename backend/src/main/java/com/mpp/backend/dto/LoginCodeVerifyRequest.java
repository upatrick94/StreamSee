package com.mpp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginCodeVerifyRequest(
        @NotBlank String challengeId,
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Verification code must be exactly 6 digits.")
        String code
) {
}