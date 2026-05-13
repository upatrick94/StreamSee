package com.mpp.backend.repository.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
    List<AuditLogEntity> findTop100ByOrderByTimestampDesc();
    long countByUserIdAndActionInformationStartingWithAndTimestampAfter(Long userId, String prefix, Instant after);
}
