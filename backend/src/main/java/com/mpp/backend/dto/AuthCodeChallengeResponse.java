package com.mpp.backend.dto;

public record AuthCodeChallengeResponse(
        String challengeId,
        String deliveryHint,
        String message
) {
}