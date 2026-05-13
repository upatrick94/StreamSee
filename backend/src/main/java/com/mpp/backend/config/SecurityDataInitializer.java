package com.mpp.backend.config;

import com.mpp.backend.repository.security.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SecurityDataInitializer implements ApplicationRunner {

    private final PermissionRepository permissions;
    private final RoleRepository roles;
    private final UserAccountRepository users;
    private final PasswordEncoder encoder;

    public SecurityDataInitializer(PermissionRepository permissions, RoleRepository roles, UserAccountRepository users, PasswordEncoder encoder) {
        this.permissions = permissions;
        this.roles = roles;
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) return;

        PermissionEntity read = savePermission("PLAYLIST_READ");
        PermissionEntity write = savePermission("PLAYLIST_WRITE");
        PermissionEntity delete = savePermission("PLAYLIST_DELETE");
        PermissionEntity restore = savePermission("PLAYLIST_RESTORE");
        PermissionEntity chat = savePermission("CHAT_USE");
        PermissionEntity audit = savePermission("AUDIT_VIEW");
        PermissionEntity observation = savePermission("OBSERVATION_VIEW");

        RoleEntity admin = new RoleEntity("ADMIN", "Full permissions");
        admin.getPermissions().addAll(List.of(read, write, delete, restore, chat, audit, observation));
        roles.save(admin);

        RoleEntity user = new RoleEntity("USER", "Restricted permissions");
        user.getPermissions().addAll(List.of(read, write, chat));
        roles.save(user);

        UserAccountEntity adminUser = new UserAccountEntity("admin", encoder.encode("admin123"), "Administrator");
        adminUser.getRoles().add(admin);
        users.save(adminUser);

        UserAccountEntity normalUser = new UserAccountEntity("user", encoder.encode("user123"), "Normal User");
        normalUser.getRoles().add(user);
        users.save(normalUser);
    }

    private PermissionEntity savePermission(String code) {
        return permissions.save(new PermissionEntity(code, code));
    }
}
