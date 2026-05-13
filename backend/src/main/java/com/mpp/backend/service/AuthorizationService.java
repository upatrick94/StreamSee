package com.mpp.backend.service;

import com.mpp.backend.error.ResourceNotFoundException;
import com.mpp.backend.repository.security.UserAccountEntity;
import com.mpp.backend.repository.security.UserAccountRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {

    private final UserAccountRepository users;

    public AuthorizationService(UserAccountRepository users) {
        this.users = users;
    }

    public UserAccountEntity requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User with id " + userId + " was not found."));
    }

    public void ensurePermission(Long userId, String permissionCode) {
        UserAccountEntity user = requireUser(userId);
        boolean allowed = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .anyMatch(permission -> permission.getCode().equals(permissionCode));

        if (!allowed) {
            throw new IllegalArgumentException("User does not have permission: " + permissionCode);
        }
    }
}
