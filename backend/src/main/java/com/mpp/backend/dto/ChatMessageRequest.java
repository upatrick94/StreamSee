package com.mpp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        @NotBlank String authToken,
        @NotNull Long userId,
        @NotBlank String room,
        @NotBlank @Size(max = 500) String content
) {
}