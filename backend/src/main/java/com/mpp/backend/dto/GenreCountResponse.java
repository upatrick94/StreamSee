package com.mpp.backend.dto;

public record GenreCountResponse(
        String genre,
        long count
) {
}