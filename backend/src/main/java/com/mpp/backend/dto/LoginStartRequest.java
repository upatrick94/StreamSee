package com.mpp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginStartRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 6, max = 120) String password,
        @NotBlank @Size(min = 2, max = 120) String securityAnswer
) {
}