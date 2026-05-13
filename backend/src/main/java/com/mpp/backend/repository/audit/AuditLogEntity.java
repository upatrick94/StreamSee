package com.mpp.backend.repository.audit;

import com.mpp.backend.repository.security.UserAccountEntity;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private UserAccountEntity user;

    @Column(nullable = false, length = 80)
    private String usernameSnapshot;

    @Column(nullable = false, length = 20)
    private String groupName;

    @Column(nullable = false, length = 300)
    private String actionInformation;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private boolean suspicious;

    protected AuditLogEntity() {
    }

    public AuditLogEntity(UserAccountEntity user, String usernameSnapshot, String groupName, String actionInformation, Instant timestamp, boolean suspicious) {
        this.user = user;
        this.usernameSnapshot = usernameSnapshot;
        this.groupName = groupName;
        this.actionInformation = actionInformation;
        this.timestamp = timestamp;
        this.suspicious = suspicious;
    }

    public Long getId() { return id; }
    public UserAccountEntity getUser() { return user; }
    public String getUsernameSnapshot() { return usernameSnapshot; }
    public String getGroupName() { return groupName; }
    public String getActionInformation() { return actionInformation; }
    public Instant getTimestamp() { return timestamp; }
    public boolean isSuspicious() { return suspicious; }
}
