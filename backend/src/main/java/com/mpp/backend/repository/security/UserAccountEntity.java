package com.mpp.backend.repository.security;

import jakarta.persistence.*;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class UserAccountEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String username;

    @Column(nullable = false, length = 120)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String displayName;

    @Column(length = 160)
    private String email;

    @Column(nullable = false, length = 200)
    private String securityQuestion;

    @Column(nullable = false, length = 255)
    private String securityAnswerHash;

    @Column(nullable = false, length = 255)
    private String recoveryCodeHash;

    @Column(nullable = false)
    private boolean enabled = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<RoleEntity> roles = new LinkedHashSet<>();

    protected UserAccountEntity() {
    }

    public UserAccountEntity(
            String username,
            String passwordHash,
            String displayName,
            String email,
            String securityQuestion,
            String securityAnswerHash,
            String recoveryCodeHash
    ) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.email = email;
        this.securityQuestion = securityQuestion;
        this.securityAnswerHash = securityAnswerHash;
        this.recoveryCodeHash = recoveryCodeHash;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getDisplayName() { return displayName; }
    public String getEmail() { return email; }
    public String getSecurityQuestion() { return securityQuestion; }
    public String getSecurityAnswerHash() { return securityAnswerHash; }
    public String getRecoveryCodeHash() { return recoveryCodeHash; }
    public boolean isEnabled() { return enabled; }
    public Set<RoleEntity> getRoles() { return roles; }

    public void setEmail(String email) {
        this.email = email;
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}