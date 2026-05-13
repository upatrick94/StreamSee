package com.mpp.backend.repository.audit;

import com.mpp.backend.repository.security.UserAccountEntity;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "observation_entries")
public class ObservationEntryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccountEntity user;

    @Column(nullable = false, length = 300)
    private String reason;

    @Column(nullable = false)
    private int evidenceCount;

    @Column(nullable = false)
    private Instant firstDetectedAt;

    @Column(nullable = false)
    private Instant lastDetectedAt;

    protected ObservationEntryEntity() {
    }

    public ObservationEntryEntity(UserAccountEntity user, String reason, int evidenceCount, Instant firstDetectedAt, Instant lastDetectedAt) {
        this.user = user;
        this.reason = reason;
        this.evidenceCount = evidenceCount;
        this.firstDetectedAt = firstDetectedAt;
        this.lastDetectedAt = lastDetectedAt;
    }

    public UserAccountEntity getUser() { return user; }
    public String getReason() { return reason; }
    public int getEvidenceCount() { return evidenceCount; }
    public Instant getFirstDetectedAt() { return firstDetectedAt; }
    public Instant getLastDetectedAt() { return lastDetectedAt; }

    public void refresh(String reason, int evidenceCount, Instant at) {
        this.reason = reason;
        this.evidenceCount = evidenceCount;
        this.lastDetectedAt = at;
    }
}
