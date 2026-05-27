package com.mpp.backend.service;

import com.mpp.backend.error.ForbiddenException;
import com.mpp.backend.error.ResourceNotFoundException;
import com.mpp.backend.repository.security.UserAccountEntity;
import com.mpp.backend.repository.security.UserAccountRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {

    private final UserAccountRepository users;
    private final SessionService sessionService;

    public AuthorizationService(UserAccountRepository users, SessionService sessionService) {
        this.users = users;
        this.sessionService = sessionService;
    }

    public UserAccountEntity requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User with id " + userId + " was not found."));
    }

    public void ensurePermission(String authToken, Long userId, String permissionCode) {
        sessionService.requireSession(authToken, userId);

        UserAccountEntity user = requireUser(userId);
        boolean allowed = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .anyMatch(permission -> permission.getCode().equals(permissionCode));

        if (!allowed) {
            throw new ForbiddenException("User does not have permission: " + permissionCode);
        }
    }
}