package com.mpp.backend.repository;

import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;
import com.mpp.backend.model.Song;
import com.mpp.backend.repository.jpa.PlaylistEntity;
import com.mpp.backend.repository.jpa.PlaylistHistoryEntryEntity;
import com.mpp.backend.repository.jpa.PlaylistHistorySongEntity;
import com.mpp.backend.repository.jpa.SongEntity;
import com.mpp.backend.repository.jpa.SpringDataPlaylistRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

@Repository
@Primary
public class JpaPlaylistRepository implements PlaylistRepository {

    private final SpringDataPlaylistRepository springDataRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaPlaylistRepository(SpringDataPlaylistRepository springDataRepository) {
        this.springDataRepository = springDataRepository;
    }

    @Override
    public List<PlaylistStore> findAll() {
        return springDataRepository.findAll().stream()
                .map(this::toStore)
                .toList();
    }

    @Override
    public List<PlaylistStore> findAll(PlaylistFilter filter) {
        return springDataRepository.search(normalize(filter.name()), normalize(filter.creator()), normalize(filter.genre())).stream()
                .map(this::toStore)
                .toList();
    }

    @Override
    public Optional<PlaylistStore> findById(long id) {
        return springDataRepository.findById(id).map(this::toStore);
    }

    @Override
    @Transactional
    public PlaylistStore save(PlaylistStore store) {
        Playlist playlist = store.getPlaylist();
        PlaylistEntity existing = springDataRepository.findById(playlist.id()).orElse(null);

        if (existing == null) {
            PlaylistEntity entity = toEntity(store);
            entityManager.persist(entity);
            entityManager.flush();
            return toStore(entity);
        }

        updateManagedEntity(existing, store);
        entityManager.flush();
        return toStore(existing);
    }

    @Override
    public void deleteById(long id) {
        springDataRepository.deleteById(id);
    }

    @Override
    public boolean existsById(long id) {
        return springDataRepository.existsById(id);
    }

    private void updateManagedEntity(PlaylistEntity entity, PlaylistStore store) {
        Playlist playlist = store.getPlaylist();

        entity.updateDetails(
                playlist.name(),
                playlist.creator(),
                playlist.coverUrl(),
                playlist.description(),
                playlist.createdAt(),
                playlist.updatedAt()
        );

        entity.replaceGenres(playlist.genres());

        entity.replaceSongs(List.of());
        entity.replaceHistoryEntries(List.of());
        entityManager.flush();

        List<SongEntity> songs = IntStream.range(0, playlist.songs().size())
                .mapToObj(index -> {
                    Song song = playlist.songs().get(index);
                    return new SongEntity(song.id(), entity, song.title(), song.artist(), song.durationSeconds(), index);
                })
                .toList();
        entity.replaceSongs(songs);
        songs.forEach(entityManager::persist);

        List<PlaylistHistoryEntryEntity> historyEntries = store.getHistoryEntries().stream()
                .map(history -> toHistoryEntity(entity, history))
                .toList();
        entity.replaceHistoryEntries(historyEntries);
        historyEntries.forEach(entityManager::persist);
    }

    private PlaylistStore toStore(PlaylistEntity entity) {
        Playlist playlist = new Playlist(
                entity.getId(),
                entity.getName(),
                entity.getCreator(),
                entity.getCoverUrl(),
                entity.getDescription(),
                List.copyOf(entity.getGenres()),
                entity.getSongs().stream()
                        .map(song -> new Song(song.getId(), song.getTitle(), song.getArtist(), song.getDurationSeconds()))
                        .toList(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );

        List<PlaylistHistoryEntry> historyEntries = entity.getHistoryEntries().stream()
                .map(history -> new PlaylistHistoryEntry(
                        history.getId(),
                        history.getAction(),
                        history.getHighlight(),
                        history.getCreatedAt(),
                        new Playlist(
                                entity.getId(),
                                history.getSnapshotName(),
                                history.getSnapshotCreator(),
                                history.getSnapshotCoverUrl(),
                                history.getSnapshotDescription(),
                                List.copyOf(history.getSnapshotGenres()),
                                history.getSnapshotSongs().stream()
                                        .map(song -> new Song(song.getOriginalSongId(), song.getTitle(), song.getArtist(), song.getDurationSeconds()))
                                        .toList(),
                                history.getSnapshotCreatedAt(),
                                history.getSnapshotUpdatedAt()
                        )
                ))
                .toList();

        return new PlaylistStore(playlist, historyEntries);
    }

    private PlaylistEntity toEntity(PlaylistStore store) {
        Playlist playlist = store.getPlaylist();

        PlaylistEntity entity = new PlaylistEntity(
                playlist.id(),
                playlist.name(),
                playlist.creator(),
                playlist.coverUrl(),
                playlist.description(),
                playlist.createdAt(),
                playlist.updatedAt()
        );

        entity.replaceGenres(playlist.genres());

        List<SongEntity> songs = IntStream.range(0, playlist.songs().size())
                .mapToObj(index -> {
                    Song song = playlist.songs().get(index);
                    return new SongEntity(song.id(), entity, song.title(), song.artist(), song.durationSeconds(), index);
                })
                .toList();
        entity.replaceSongs(songs);

        List<PlaylistHistoryEntryEntity> historyEntries = store.getHistoryEntries().stream()
                .map(history -> toHistoryEntity(entity, history))
                .toList();
        entity.replaceHistoryEntries(historyEntries);

        return entity;
    }

    private PlaylistHistoryEntryEntity toHistoryEntity(PlaylistEntity playlistEntity, PlaylistHistoryEntry history) {
        Playlist snapshot = history.snapshot();

        PlaylistHistoryEntryEntity entity = new PlaylistHistoryEntryEntity(
                history.id(),
                playlistEntity,
                history.action(),
                history.highlight(),
                history.createdAt(),
                snapshot.name(),
                snapshot.creator(),
                snapshot.coverUrl(),
                snapshot.description(),
                snapshot.createdAt(),
                snapshot.updatedAt()
        );

        entity.replaceSnapshotGenres(snapshot.genres());

        List<PlaylistHistorySongEntity> songs = IntStream.range(0, snapshot.songs().size())
                .mapToObj(index -> {
                    Song song = snapshot.songs().get(index);
                    return new PlaylistHistorySongEntity(
                            entity,
                            song.id(),
                            song.title(),
                            song.artist(),
                            song.durationSeconds(),
                            index
                    );
                })
                .toList();

        entity.replaceSnapshotSongs(songs);
        return entity;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
