package com.mpp.backend.repository;

import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.PlaylistHistoryEntry;

import java.util.ArrayList;
import java.util.List;

public class PlaylistStore {

    private Playlist playlist;
    private final List<PlaylistHistoryEntry> historyEntries;

    public PlaylistStore(Playlist playlist, List<PlaylistHistoryEntry> historyEntries) {
        this.playlist = playlist;
        this.historyEntries = new ArrayList<>(historyEntries);
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