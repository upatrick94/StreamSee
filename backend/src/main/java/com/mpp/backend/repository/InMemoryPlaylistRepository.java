package com.mpp.backend.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class InMemoryPlaylistRepository implements PlaylistRepository {

    private final ConcurrentMap<Long, PlaylistStore> stores = new ConcurrentHashMap<>();

    @Override
    public List<PlaylistStore> findAll() {
        return new ArrayList<>(stores.values());
    }

    @Override
    public List<PlaylistStore> findAll(PlaylistFilter filter) {
        return findAll().stream()
                .filter(store -> filter.name() == null || store.getPlaylist().name().toLowerCase().contains(filter.name().toLowerCase()))
                .filter(store -> filter.creator() == null || store.getPlaylist().creator().toLowerCase().contains(filter.creator().toLowerCase()))
                .filter(store -> filter.genre() == null || store.getPlaylist().genres().stream().anyMatch(g -> g.equalsIgnoreCase(filter.genre())))
                .toList();
    }

    @Override
    public Optional<PlaylistStore> findById(long id) {
        return Optional.ofNullable(stores.get(id));
    }

    @Override
    public PlaylistStore save(PlaylistStore store) {
        stores.put(store.getPlaylist().id(), store);
        return store;
    }

    @Override
    public void deleteById(long id) {
        stores.remove(id);
    }

    @Override
    public boolean existsById(long id) {
        return stores.containsKey(id);
    }
}
