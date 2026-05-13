package com.mpp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username is required.")
        @Size(min = 3, max = 60, message = "Username must have between 3 and 60 characters.")
        @Pattern(
                regexp = "^[A-Za-z0-9_.-]+$",
                message = "Username may only contain letters, numbers, dots, underscores, and hyphens."
        )
        String username,

        @NotBlank(message = "Display name is required.")
        @Size(min = 2, max = 120, message = "Display name must have between 2 and 120 characters.")
        String displayName,

        @NotBlank(message = "Password is required.")
        @Size(min = 6, max = 120, message = "Password must have between 6 and 120 characters.")
        String password
) {
}
