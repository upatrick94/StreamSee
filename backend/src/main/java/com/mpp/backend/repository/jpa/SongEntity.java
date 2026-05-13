package com.mpp.backend.repository.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "songs")
public class SongEntity {

    @Id
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private PlaylistEntity playlist;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 120)
    private String artist;

    @Column(nullable = false)
    private Integer durationSeconds;

    @Column(nullable = false)
    private Integer position;

    protected SongEntity() {
    }

    public SongEntity(Long id, PlaylistEntity playlist, String title, String artist, Integer durationSeconds, Integer position) {
        this.id = id;
        this.playlist = playlist;
        this.title = title;
        this.artist = artist;
        this.durationSeconds = durationSeconds;
        this.position = position;
    }

    public Long getId() {
        return id;
    }

    public PlaylistEntity getPlaylist() {
        return playlist;
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
