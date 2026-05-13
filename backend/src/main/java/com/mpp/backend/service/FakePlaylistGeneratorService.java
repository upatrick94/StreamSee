package com.mpp.backend.service;

import com.github.javafaker.Faker;
import com.mpp.backend.dto.GeneratorBatchEventResponse;
import com.mpp.backend.dto.GeneratorStatusResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.dto.PlaylistResponse;
import com.mpp.backend.dto.SongRequest;
import com.mpp.backend.dto.StatisticsResponse;
import com.mpp.backend.mapper.PlaylistMapper;
import jakarta.annotation.PreDestroy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class FakePlaylistGeneratorService {

    private final PlaylistService playlistService;
    private final PlaylistMapper playlistMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ScheduledExecutorService scheduler;
    private final Faker faker = new Faker(Locale.ENGLISH);

    private final AtomicBoolean running = new AtomicBoolean(false);

    private volatile ScheduledFuture<?> scheduledTask;
    private volatile int batchSize = 3;
    private volatile int intervalSeconds = 5;

    public FakePlaylistGeneratorService(
            PlaylistService playlistService,
            PlaylistMapper playlistMapper,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.playlistService = playlistService;
        this.playlistMapper = playlistMapper;
        this.messagingTemplate = messagingTemplate;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(runnable -> {
            Thread thread = new Thread(runnable, "fake-playlist-generator");
            thread.setDaemon(true);
            return thread;
        });
    }

    public synchronized GeneratorStatusResponse start(int requestedBatchSize, int requestedIntervalSeconds) {
        batchSize = requestedBatchSize;
        intervalSeconds = requestedIntervalSeconds;

        if (running.get()) {
            return status();
        }

        running.set(true);
        scheduledTask = scheduler.scheduleWithFixedDelay(
                this::generateBatchSafely,
                0,
                intervalSeconds,
                TimeUnit.SECONDS
        );

        return status();
    }

    public synchronized GeneratorStatusResponse stop() {
        running.set(false);

        if (scheduledTask != null) {
            scheduledTask.cancel(false);
            scheduledTask = null;
        }

        return status();
    }

    public GeneratorStatusResponse status() {
        return new GeneratorStatusResponse(running.get(), batchSize, intervalSeconds);
    }

    private void generateBatchSafely() {
        if (!running.get()) {
            return;
        }

        try {
            generateBatch();
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    private void generateBatch() {
        List<PlaylistResponse> createdPlaylists = new ArrayList<>();

        for (int index = 0; index < batchSize; index += 1) {
            PlaylistRequest request = buildPlaylistRequest();
            PlaylistResponse response = playlistMapper.toResponse(playlistService.createPlaylist(request));
            createdPlaylists.add(response);
        }

        StatisticsResponse statistics = playlistMapper.toResponse(playlistService.getStatistics());

        messagingTemplate.convertAndSend(
                "/topic/playlists-updated",
                new GeneratorBatchEventResponse(
                        "BATCH_CREATED",
                        createdPlaylists.size(),
                        statistics.totalPlaylists(),
                        createdPlaylists,
                        statistics,
                        Instant.now()
                )
        );
    }

    private PlaylistRequest buildPlaylistRequest() {
        return new PlaylistRequest(
                buildPlaylistName(),
                faker.name().fullName(),
                buildCoverUrl(),
                buildDescription(),
                buildGenres(),
                buildSongs()
        );
    }

    private String buildPlaylistName() {
        String suffix = faker.options().option("Drive", "Flow", "Pulse", "Mix", "Session", "Collection");
        return faker.music().genre() + " " + suffix;
    }

    private String buildCoverUrl() {
        return "https://picsum.photos/seed/" + UUID.randomUUID() + "/400/400";
    }

    private String buildDescription() {
        return faker.lorem().sentence(14);
    }

    private List<String> buildGenres() {
        Set<String> genres = new LinkedHashSet<>();
        int genresCount = faker.number().numberBetween(1, 4);

        while (genres.size() < genresCount) {
            genres.add(faker.music().genre());
        }

        return List.copyOf(genres);
    }

    private List<SongRequest> buildSongs() {
        int songsCount = faker.number().numberBetween(2, 6);
        List<SongRequest> songs = new ArrayList<>(songsCount);

        for (int index = 0; index < songsCount; index += 1) {
            songs.add(new SongRequest(
                    null,
                    faker.book().title(),
                    faker.rockBand().name(),
                    faker.number().numberBetween(120, 361)
            ));
        }

        return songs;
    }

    @PreDestroy
    public void shutdown() {
        stop();
        scheduler.shutdownNow();
    }
}
