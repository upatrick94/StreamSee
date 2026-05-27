package com.mpp.backend.service;

import com.mpp.backend.dto.*;
import com.mpp.backend.error.UnauthorizedException;
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
    private final SessionService sessionService;
    private final EmailCodeChallengeService challengeService;
    private final OneTimeCodeEmailService emailService;

    public AuthService(
            UserAccountRepository users,
            RoleRepository roles,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService,
            SessionService sessionService,
            EmailCodeChallengeService challengeService,
            OneTimeCodeEmailService emailService
    ) {
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
        this.sessionService = sessionService;
        this.challengeService = challengeService;
        this.emailService = emailService;
    }

    public AuthCodeChallengeResponse requestLoginCode(LoginStartRequest request, String ipAddress) {
        UserAccountEntity user = users.findByUsernameIgnoreCase(request.username().trim())
                .orElseThrow(() -> invalidLogin(request.username(), ipAddress));

        boolean valid = user.isEnabled()
                && passwordEncoder.matches(request.password(), user.getPasswordHash())
                && passwordEncoder.matches(normalizeSecurityAnswer(request.securityAnswer()), user.getSecurityAnswerHash());

        if (!valid) {
            throw invalidLogin(request.username(), ipAddress);
        }

        String email = requireEmail(user);
        EmailCodeChallengeService.Delivery delivery = challengeService.createLoginChallenge(user.getId(), email);
        emailService.sendCode(email, "login", challengeService.peekCode(delivery.challengeId()));

        return new AuthCodeChallengeResponse(
                delivery.challengeId(),
                delivery.deliveryHint(),
                "Verification code sent to the email associated with this account."
        );
    }

    public LoginResponse verifyLoginCode(LoginCodeVerifyRequest request, String ipAddress) {
        EmailCodeChallengeService.LoginPayload payload =
                challengeService.consumeLoginChallenge(request.challengeId(), request.code());

        UserAccountEntity user = users.findById(payload.userId())
                .orElseThrow(() -> new UnauthorizedException("User account was not found."));

        auditLogService.logLoginSuccess(user, ipAddress);
        SessionService.SessionSnapshot session = sessionService.createSession(user);
        return buildLoginResponse(user, session);
    }

    public AuthCodeChallengeResponse requestRegisterCode(RegisterStartRequest request) {
        String username = request.username().trim();
        String email = normalizeEmail(request.email());

        if (users.findByUsernameIgnoreCase(username).isPresent()) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        if (!SecurityQuestionCatalog.isAllowed(request.securityQuestion())) {
            throw new IllegalArgumentException("Please select one of the allowed security questions.");
        }

        RegisterStartRequest normalized = new RegisterStartRequest(
                username,
                request.displayName().trim(),
                email,
                request.password(),
                request.securityQuestion().trim(),
                request.securityAnswer().trim()
        );

        EmailCodeChallengeService.Delivery delivery = challengeService.createRegisterChallenge(normalized);
        emailService.sendCode(email, "account registration", challengeService.peekCode(delivery.challengeId()));

        return new AuthCodeChallengeResponse(
                delivery.challengeId(),
                delivery.deliveryHint(),
                "Verification code sent to the email address for this new account."
        );
    }

    public LoginResponse verifyRegisterCode(RegisterCodeVerifyRequest request, String ipAddress) {
        EmailCodeChallengeService.RegisterPayload payload =
                challengeService.consumeRegisterChallenge(request.challengeId(), request.code());

        RegisterStartRequest registerRequest = payload.request();

        if (users.findByUsernameIgnoreCase(registerRequest.username()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        RoleEntity userRole = roles.findByName("USER")
                .orElseThrow(() -> new IllegalStateException("USER role is not configured."));

        UserAccountEntity user = new UserAccountEntity(
                registerRequest.username(),
                passwordEncoder.encode(registerRequest.password()),
                registerRequest.displayName(),
                normalizeEmail(registerRequest.email()),
                registerRequest.securityQuestion().trim(),
                passwordEncoder.encode(normalizeSecurityAnswer(registerRequest.securityAnswer())),
                passwordEncoder.encode("EMAIL-CODE-AUTH")
        );
        user.getRoles().add(userRole);

        UserAccountEntity saved = users.save(user);
        auditLogService.logLoginSuccess(saved, ipAddress);

        SessionService.SessionSnapshot session = sessionService.createSession(saved);
        return buildLoginResponse(saved, session);
    }

    public AuthCodeChallengeResponse requestPasswordResetCode(PasswordResetStartRequest request) {
        UserAccountEntity user = users.findByUsernameIgnoreCase(request.username().trim())
                .orElseThrow(() -> new UnauthorizedException("Recovery details are invalid."));

        boolean valid = passwordEncoder.matches(normalizeSecurityAnswer(request.securityAnswer()), user.getSecurityAnswerHash());

        if (!valid) {
            throw new UnauthorizedException("Recovery details are invalid.");
        }

        String email = requireEmail(user);
        EmailCodeChallengeService.Delivery delivery =
                challengeService.createPasswordResetChallenge(user.getId(), email, request.newPassword());
        emailService.sendCode(email, "password reset", challengeService.peekCode(delivery.challengeId()));

        return new AuthCodeChallengeResponse(
                delivery.challengeId(),
                delivery.deliveryHint(),
                "Verification code sent to the email associated with this account."
        );
    }

    public void verifyPasswordResetCode(PasswordResetCodeVerifyRequest request) {
        EmailCodeChallengeService.PasswordResetPayload payload =
                challengeService.consumePasswordResetChallenge(request.challengeId(), request.code());

        UserAccountEntity user = users.findById(payload.userId())
                .orElseThrow(() -> new UnauthorizedException("User account was not found."));

        user.changePasswordHash(passwordEncoder.encode(payload.newPassword()));
        users.save(user);
        sessionService.invalidateAllForUser(user.getId());
        auditLogService.logAuthenticatedAction(user.getId(), "RESET_PASSWORD");
    }

    public void logout(String authToken, Long userId) {
        sessionService.invalidate(authToken, userId);
    }

    private LoginResponse buildLoginResponse(UserAccountEntity user, SessionService.SessionSnapshot session) {
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

        return new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                roleNames,
                permissions,
                session.token(),
                session.expiresAt(),
                session.inactivityTimeoutSeconds()
        );
    }

    private UnauthorizedException invalidLogin(String username, String ipAddress) {
        auditLogService.logLoginFailure(username, ipAddress);
        return new UnauthorizedException("Invalid username, password, or security answer.");
    }

    private String normalizeSecurityAnswer(String value) {
        return value.trim().toLowerCase();
    }

    private String normalizeEmail(String value) {
        return value.trim().toLowerCase();
    }

    private String requireEmail(UserAccountEntity user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalStateException("This account does not have an email address configured.");
        }

        return normalizeEmail(user.getEmail());
    }
}