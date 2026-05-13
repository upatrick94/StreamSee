package com.mpp.backend.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataPlaylistRepository extends JpaRepository<PlaylistEntity, Long> {

    @Query("""
        select distinct p
        from PlaylistEntity p
        left join p.genres g
        where (:name is null or lower(p.name) like lower(concat('%', :name, '%')))
          and (:creator is null or lower(p.creator) like lower(concat('%', :creator, '%')))
          and (:genre is null or lower(g) = lower(:genre))
        order by p.updatedAt desc, p.id asc
    """)
    List<PlaylistEntity> search(String name, String creator, String genre);
}
