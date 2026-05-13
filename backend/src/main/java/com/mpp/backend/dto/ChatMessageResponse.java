package com.mpp.backend.dto;

import java.time.Instant;

public record ChatMessageResponse(
        String id,
        String room,
        Long userId,
        String username,
        String content,
        Instant sentAt
) {
}
