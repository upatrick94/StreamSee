package com.mpp.backend.controller;

import com.mpp.backend.dto.GeneratorStatusResponse;
import com.mpp.backend.service.FakePlaylistGeneratorService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/generator")
public class GeneratorController {

    private final FakePlaylistGeneratorService fakePlaylistGeneratorService;

    public GeneratorController(FakePlaylistGeneratorService fakePlaylistGeneratorService) {
        this.fakePlaylistGeneratorService = fakePlaylistGeneratorService;
    }

    @PostMapping("/start")
    public GeneratorStatusResponse start(
            @RequestParam(defaultValue = "3") @Min(1) @Max(25) int batchSize,
            @RequestParam(defaultValue = "5") @Min(1) @Max(60) int intervalSeconds
    ) {
        return fakePlaylistGeneratorService.start(batchSize, intervalSeconds);
    }

    @PostMapping("/stop")
    public GeneratorStatusResponse stop() {
        return fakePlaylistGeneratorService.stop();
    }

    @GetMapping("/status")
    public GeneratorStatusResponse status() {
        return fakePlaylistGeneratorService.status();
    }
}
