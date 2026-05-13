package com.mpp.backend.dto;

import java.util.List;

public record LoginResponse(
        Long userId,
        String username,
        String displayName,
        List<String> roles,
        List<String> permissions
) {
}
