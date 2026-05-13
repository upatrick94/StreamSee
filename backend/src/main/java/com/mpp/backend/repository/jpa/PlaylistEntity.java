package com.mpp.backend.repository.jpa;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "playlists")
public class PlaylistEntity {

    @Id
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String creator;

    @Column(nullable = false, length = 1000)
    private String coverUrl;

    @Column(nullable = false, length = 500)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "playlist_genres", joinColumns = @JoinColumn(name = "playlist_id"))
    @OrderColumn(name = "genre_order")
    @Column(name = "genre", nullable = false, length = 80)
    private List<String> genres = new ArrayList<>();

    @OneToMany(mappedBy = "playlist", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position asc")
    private List<SongEntity> songs = new ArrayList<>();

    @OneToMany(mappedBy = "playlist", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt desc")
    private List<PlaylistHistoryEntryEntity> historyEntries = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected PlaylistEntity() {
    }

    public PlaylistEntity(Long id, String name, String creator, String coverUrl, String description, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.creator = creator;
        this.coverUrl = coverUrl;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void updateDetails(
            String name,
            String creator,
            String coverUrl,
            String description,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.name = name;
        this.creator = creator;
        this.coverUrl = coverUrl;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void replaceGenres(List<String> values) {
        genres.clear();
        genres.addAll(values);
    }

    public void replaceSongs(List<SongEntity> values) {
        songs.clear();
        songs.addAll(values);
    }

    public void replaceHistoryEntries(List<PlaylistHistoryEntryEntity> values) {
        historyEntries.clear();
        historyEntries.addAll(values);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCreator() {
        return creator;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public String getDescription() {
        return description;
    }

    public List<String> getGenres() {
        return genres;
    }

    public List<SongEntity> getSongs() {
        return songs;
    }

    public List<PlaylistHistoryEntryEntity> getHistoryEntries() {
        return historyEntries;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
