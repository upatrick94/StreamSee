package com.mpp.backend.model;

public record Song(
        long id,
        String title,
        String artist,
        int durationSeconds
) {
}