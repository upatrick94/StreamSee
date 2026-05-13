package com.mpp.backend.graphql;

import com.mpp.backend.dto.GeneratorStatusResponse;
import com.mpp.backend.dto.PageResponse;
import com.mpp.backend.dto.PlaylistHistoryEntryResponse;
import com.mpp.backend.dto.PlaylistRequest;
import com.mpp.backend.dto.PlaylistResponse;
import com.mpp.backend.dto.SongResponse;
import com.mpp.backend.dto.SongStatisticsResponse;
import com.mpp.backend.dto.StatisticsResponse;
import com.mpp.backend.mapper.PlaylistMapper;
import com.mpp.backend.service.FakePlaylistGeneratorService;
import com.mpp.backend.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.Comparator;
import java.util.Set;
import java.util.stream.Collectors;

@Controller
public class PlaylistGraphqlController {

    private final PlaylistService playlistService;
    private final PlaylistMapper playlistMapper;
    private final FakePlaylistGeneratorService fakePlaylistGeneratorService;

    public PlaylistGraphqlController(
            PlaylistService playlistService,
            PlaylistMapper playlistMapper,
            FakePlaylistGeneratorService fakePlaylistGeneratorService
    ) {
        this.playlistService = playlistService;
        this.playlistMapper = playlistMapper;
        this.fakePlaylistGeneratorService = fakePlaylistGeneratorService;
    }

    @QueryMapping
    public PageResponse<PlaylistResponse> playlists(@Argument Integer page, @Argument Integer size) {
        var playlistPage = playlistService.getAllPlaylists(defaultPage(page), defaultPlaylistSize(size));

        return new PageResponse<>(
                playlistPage.content().stream().map(playlistMapper::toResponse).toList(),
                playlistPage.page(),
                playlistPage.size(),
                playlistPage.totalElements(),
                playlistPage.totalPages()
        );
    }

    @QueryMapping
    public PlaylistResponse playlist(@Argument Integer id) {
        return playlistMapper.toResponse(playlistService.getPlaylistById(id.longValue()));
    }

    @QueryMapping
    public PageResponse<PlaylistHistoryEntryResponse> playlistHistory(
            @Argument Integer playlistId,
            @Argument Integer page,
            @Argument Integer size
    ) {
        var historyPage = playlistService.getPlaylistHistory(
                playlistId.longValue(),
                defaultPage(page),
                defaultHistorySize(size)
        );

        return new PageResponse<>(
                historyPage.content().stream().map(playlistMapper::toResponse).toList(),
                historyPage.page(),
                historyPage.size(),
                historyPage.totalElements(),
                historyPage.totalPages()
        );
    }

    @QueryMapping
    public StatisticsResponse statistics() {
        return playlistMapper.toResponse(playlistService.getStatistics());
    }

    @QueryMapping
    public GeneratorStatusResponse generatorStatus() {
        return fakePlaylistGeneratorService.status();
    }

    @MutationMapping
    public PlaylistResponse createPlaylist(@Argument("input") @Valid PlaylistRequest input) {
        return playlistMapper.toResponse(playlistService.createPlaylist(input));
    }

    @MutationMapping
    public PlaylistResponse updatePlaylist(@Argument Integer id, @Argument("input") @Valid PlaylistRequest input) {
        return playlistMapper.toResponse(playlistService.updatePlaylist(id.longValue(), input));
    }

    @MutationMapping
    public Boolean deletePlaylist(@Argument Integer id) {
        playlistService.deletePlaylist(id.longValue());
        return true;
    }

    @MutationMapping
    public PlaylistResponse restoreHistoryEntry(@Argument Integer playlistId, @Argument Integer historyEntryId) {
        return playlistMapper.toResponse(
                playlistService.restoreSnapshot(playlistId.longValue(), historyEntryId.longValue())
        );
    }

    @MutationMapping
    public GeneratorStatusResponse startGenerator(@Argument Integer batchSize, @Argument Integer intervalSeconds) {
        return fakePlaylistGeneratorService.start(
                batchSize == null ? 3 : batchSize,
                intervalSeconds == null ? 5 : intervalSeconds
        );
    }

    @MutationMapping
    public GeneratorStatusResponse stopGenerator() {
        return fakePlaylistGeneratorService.stop();
    }

    @SchemaMapping(typeName = "Playlist", field = "songStatistics")
    public SongStatisticsResponse songStatistics(PlaylistResponse playlist) {
        int totalSongs = playlist.songs().size();
        int totalDurationSeconds = (int) playlist.songs().stream()
                .mapToLong(SongResponse::durationSeconds)
                .sum();

        Set<String> uniqueArtists = playlist.songs().stream()
                .map(SongResponse::artist)
                .map(artist -> artist == null ? "" : artist.trim().toLowerCase())
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());

        SongResponse longestSong = playlist.songs().stream()
                .max(Comparator.comparingInt(SongResponse::durationSeconds))
                .orElse(null);

        double averageSongDurationSeconds = totalSongs == 0
                ? 0
                : round((double) totalDurationSeconds / totalSongs);

        return new SongStatisticsResponse(
                totalSongs,
                uniqueArtists.size(),
                averageSongDurationSeconds,
                totalDurationSeconds,
                longestSong
        );
    }

    private int defaultPage(Integer page) {
        return page == null ? 0 : page;
    }

    private int defaultPlaylistSize(Integer size) {
        return size == null ? 12 : size;
    }

    private int defaultHistorySize(Integer size) {
        return size == null ? 10 : size;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
