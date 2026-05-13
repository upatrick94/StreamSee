package com.mpp.backend.repository.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ObservationEntryRepository extends JpaRepository<ObservationEntryEntity, Long> {
    Optional<ObservationEntryEntity> findByUserId(Long userId);
    List<ObservationEntryEntity> findAllByOrderByLastDetectedAtDesc();
}
