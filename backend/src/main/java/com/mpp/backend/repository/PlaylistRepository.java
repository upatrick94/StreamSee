package com.mpp.backend.repository;

import java.util.List;
import java.util.Optional;

public interface PlaylistRepository {

    List<PlaylistStore> findAll();

    List<PlaylistStore> findAll(PlaylistFilter filter);

    Optional<PlaylistStore> findById(long id);

    PlaylistStore save(PlaylistStore store);

    void deleteById(long id);

    boolean existsById(long id);
}
