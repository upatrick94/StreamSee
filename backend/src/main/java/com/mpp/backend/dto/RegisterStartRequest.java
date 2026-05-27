package com.mpp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterStartRequest(
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

        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be valid.")
        @Size(max = 160, message = "Email must have at most 160 characters.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 6, max = 120, message = "Password must have between 6 and 120 characters.")
        String password,

        @NotBlank(message = "Security question is required.")
        String securityQuestion,

        @NotBlank(message = "Security answer is required.")
        @Size(min = 2, max = 120, message = "Security answer must have between 2 and 120 characters.")
        String securityAnswer
) {
}