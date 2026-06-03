package com.mpp.backend.repository;

import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;

import java.util.ArrayList;
import java.util.List;

public class PlaylistStore {

    private final Long ownerUserId;
    private Playlist playlist;
    private final List<PlaylistHistoryEntry> historyEntries;

    public PlaylistStore(Long ownerUserId, Playlist playlist, List<PlaylistHistoryEntry> historyEntries) {
        this.ownerUserId = ownerUserId;
        this.playlist = playlist;
        this.historyEntries = new ArrayList<>(historyEntries);
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public Playlist getPlaylist() {
        return playlist;
    }

    public void setPlaylist(Playlist playlist) {
        this.playlist = playlist;
    }

    public List<PlaylistHistoryEntry> getHistoryEntries() {
        return historyEntries;
    }
}
