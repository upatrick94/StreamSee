package com.mpp.backend.repository.jpa;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "playlist_history_entries")
public class PlaylistHistoryEntryEntity {

    @Id
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private PlaylistEntity playlist;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(nullable = false, length = 120)
    private String highlight;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false, length = 100)
    private String snapshotName;

    @Column(nullable = false, length = 100)
    private String snapshotCreator;

    @Column(nullable = false, length = 1000)
    private String snapshotCoverUrl;

    @Column(nullable = false, length = 500)
    private String snapshotDescription;

    @Column(nullable = false)
    private Instant snapshotCreatedAt;

    @Column(nullable = false)
    private Instant snapshotUpdatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "playlist_history_genres", joinColumns = @JoinColumn(name = "history_entry_id"))
    @OrderColumn(name = "genre_order")
    @Column(name = "genre", nullable = false, length = 80)
    private List<String> snapshotGenres = new ArrayList<>();

    @OneToMany(mappedBy = "historyEntry", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position asc")
    private List<PlaylistHistorySongEntity> snapshotSongs = new ArrayList<>();

    protected PlaylistHistoryEntryEntity() {
    }

    public PlaylistHistoryEntryEntity(
            Long id,
            PlaylistEntity playlist,
            String action,
            String highlight,
            Instant createdAt,
            String snapshotName,
            String snapshotCreator,
            String snapshotCoverUrl,
            String snapshotDescription,
            Instant snapshotCreatedAt,
            Instant snapshotUpdatedAt
    ) {
        this.id = id;
        this.playlist = playlist;
        this.action = action;
        this.highlight = highlight;
        this.createdAt = createdAt;
        this.snapshotName = snapshotName;
        this.snapshotCreator = snapshotCreator;
        this.snapshotCoverUrl = snapshotCoverUrl;
        this.snapshotDescription = snapshotDescription;
        this.snapshotCreatedAt = snapshotCreatedAt;
        this.snapshotUpdatedAt = snapshotUpdatedAt;
    }

    public void replaceSnapshotGenres(List<String> values) {
        snapshotGenres.clear();
        snapshotGenres.addAll(values);
    }

    public void replaceSnapshotSongs(List<PlaylistHistorySongEntity> values) {
        snapshotSongs.clear();
        snapshotSongs.addAll(values);
    }

    public Long getId() {
        return id;
    }

    public PlaylistEntity getPlaylist() {
        return playlist;
    }

    public String getAction() {
        return action;
    }

    public String getHighlight() {
        return highlight;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getSnapshotName() {
        return snapshotName;
    }

    public String getSnapshotCreator() {
        return snapshotCreator;
    }

    public String getSnapshotCoverUrl() {
        return snapshotCoverUrl;
    }

    public String getSnapshotDescription() {
        return snapshotDescription;
    }

    public Instant getSnapshotCreatedAt() {
        return snapshotCreatedAt;
    }

    public Instant getSnapshotUpdatedAt() {
        return snapshotUpdatedAt;
    }

    public List<String> getSnapshotGenres() {
        return snapshotGenres;
    }

    public List<PlaylistHistorySongEntity> getSnapshotSongs() {
        return snapshotSongs;
    }
}
