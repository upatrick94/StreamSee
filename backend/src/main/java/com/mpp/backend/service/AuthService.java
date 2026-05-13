package com.mpp.backend.service;

import com.mpp.backend.dto.LoginRequest;
import com.mpp.backend.dto.LoginResponse;
import com.mpp.backend.dto.RegisterRequest;
import com.mpp.backend.repository.security.RoleEntity;
import com.mpp.backend.repository.security.RoleRepository;
import com.mpp.backend.repository.security.UserAccountEntity;
import com.mpp.backend.repository.security.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class AuthService {

    private final UserAccountRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public AuthService(
            UserAccountRepository users,
            RoleRepository roles,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService
    ) {
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public LoginResponse login(LoginRequest request, String ipAddress) {
        UserAccountEntity user = users.findByUsernameIgnoreCase(request.username())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password."));

        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditLogService.logLoginFailure(request.username(), ipAddress);
            throw new IllegalArgumentException("Invalid username or password.");
        }

        auditLogService.logLoginSuccess(user, ipAddress);

        List<String> roleNames = user.getRoles().stream()
                .map(RoleEntity::getName)
                .sorted()
                .toList();

        List<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> permission.getCode())
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();

        return new LoginResponse(user.getId(), user.getUsername(), user.getDisplayName(), roleNames, permissions);
    }

    public LoginResponse register(RegisterRequest request, String ipAddress) {
        String username = request.username().trim();
        String displayName = request.displayName().trim();

        if (users.findByUsernameIgnoreCase(username).isPresent()) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        RoleEntity userRole = roles.findByName("USER")
                .orElseThrow(() -> new IllegalStateException("USER role is not configured."));

        UserAccountEntity user = new UserAccountEntity(
                username,
                passwordEncoder.encode(request.password()),
                displayName
        );
        user.getRoles().add(userRole);

        UserAccountEntity saved = users.save(user);
        auditLogService.logLoginSuccess(saved, ipAddress);

        List<String> permissions = userRole.getPermissions().stream()
                .map(permission -> permission.getCode())
                .sorted(Comparator.naturalOrder())
                .toList();

        return new LoginResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getDisplayName(),
                List.of("USER"),
                permissions
        );
    }
}
