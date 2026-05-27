package com.mpp.backend.config;

import com.mpp.backend.repository.security.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class SecurityDataInitializer implements ApplicationRunner {

    private static final String DEFAULT_EMAIL = "ursu.patrick94@gmail.com";

    private final PermissionRepository permissions;
    private final RoleRepository roles;
    private final UserAccountRepository users;
    private final PasswordEncoder encoder;

    public SecurityDataInitializer(
            PermissionRepository permissions,
            RoleRepository roles,
            UserAccountRepository users,
            PasswordEncoder encoder
    ) {
        this.permissions = permissions;
        this.roles = roles;
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        PermissionEntity read = savePermission("PLAYLIST_READ");
        PermissionEntity write = savePermission("PLAYLIST_WRITE");
        PermissionEntity delete = savePermission("PLAYLIST_DELETE");
        PermissionEntity restore = savePermission("PLAYLIST_RESTORE");
        PermissionEntity chat = savePermission("CHAT_USE");
        PermissionEntity audit = savePermission("AUDIT_VIEW");
        PermissionEntity observation = savePermission("OBSERVATION_VIEW");

        RoleEntity admin = roles.findByName("ADMIN").orElseGet(() -> roles.save(new RoleEntity("ADMIN", "Full permissions")));
        admin.getPermissions().clear();
        admin.getPermissions().addAll(List.of(read, write, delete, restore, chat, audit, observation));
        roles.save(admin);

        RoleEntity user = roles.findByName("USER").orElseGet(() -> roles.save(new RoleEntity("USER", "Restricted permissions")));
        user.getPermissions().clear();
        user.getPermissions().addAll(List.of(read, write, chat));
        roles.save(user);

        ensureSeedUser(
                "admin",
                "admin123",
                "Administrator",
                DEFAULT_EMAIL,
                "What was the name of your first school?",
                "blue",
                admin
        );

        ensureSeedUser(
                "user",
                "user123",
                "Normal User",
                DEFAULT_EMAIL,
                "What city were you born in?",
                "luna",
                user
        );

        assignEmailIfPresent("user23", DEFAULT_EMAIL);
        assignEmailIfPresent("user24", DEFAULT_EMAIL);
    }

    private void ensureSeedUser(
            String username,
            String password,
            String displayName,
            String email,
            String securityQuestion,
            String securityAnswer,
            RoleEntity role
    ) {
        Optional<UserAccountEntity> existing = users.findByUsernameIgnoreCase(username);

        if (existing.isPresent()) {
            UserAccountEntity user = existing.get();
            user.setEmail(email);
            user.getRoles().add(role);
            users.save(user);
            return;
        }

        UserAccountEntity user = new UserAccountEntity(
                username,
                encoder.encode(password),
                displayName,
                email,
                securityQuestion,
                encoder.encode(securityAnswer.trim().toLowerCase()),
                encoder.encode("EMAIL-CODE-AUTH")
        );
        user.getRoles().add(role);
        users.save(user);
    }

    private void assignEmailIfPresent(String username, String email) {
        users.findByUsernameIgnoreCase(username).ifPresent(user -> {
            user.setEmail(email);
            users.save(user);
        });
    }

    private PermissionEntity savePermission(String code) {
        return permissions.findByCode(code).orElseGet(() -> permissions.save(new PermissionEntity(code, code)));
    }
}