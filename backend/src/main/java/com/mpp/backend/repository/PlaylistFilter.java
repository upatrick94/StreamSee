package com.mpp.backend.repository;

public record PlaylistFilter(
        String name,
        String creator,
        String genre
) {
    public boolean isEmpty() {
        return isBlank(name) && isBlank(creator) && isBlank(genre);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
