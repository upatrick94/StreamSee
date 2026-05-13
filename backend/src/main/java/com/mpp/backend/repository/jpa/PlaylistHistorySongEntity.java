package com.mpp.backend.repository.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "playlist_history_songs")
public class PlaylistHistorySongEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "history_entry_id", nullable = false)
    private PlaylistHistoryEntryEntity historyEntry;

    @Column(nullable = false)
    private Long originalSongId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 120)
    private String artist;

    @Column(nullable = false)
    private Integer durationSeconds;

    @Column(nullable = false)
    private Integer position;

    protected PlaylistHistorySongEntity() {
    }

    public PlaylistHistorySongEntity(
            PlaylistHistoryEntryEntity historyEntry,
            Long originalSongId,
            String title,
            String artist,
            Integer durationSeconds,
            Integer position
    ) {
        this.historyEntry = historyEntry;
        this.originalSongId = originalSongId;
        this.title = title;
        this.artist = artist;
        this.durationSeconds = durationSeconds;
        this.position = position;
    }

    public Long getOriginalSongId() {
        return originalSongId;
    }

    public String getTitle() {
        return title;
    }

    public String getArtist() {
        return artist;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public Integer getPosition() {
        return position;
    }
}
