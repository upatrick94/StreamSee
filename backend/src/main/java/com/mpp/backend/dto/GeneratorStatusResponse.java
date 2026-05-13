package com.mpp.backend.dto;

public record GeneratorStatusResponse(
        boolean running,
        int batchSize,
        int intervalSeconds
) {
}
