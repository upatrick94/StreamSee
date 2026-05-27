const AUTH_STORAGE_KEY = "mpp.auth.session";
const API_HOST = import.meta.env.VITE_API_HOST || window.location.hostname;
const API_PORT = import.meta.env.VITE_API_PORT || "8080";
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || window.location.protocol;
const API_BASE_URL = `${API_PROTOCOL}//${API_HOST}:${API_PORT}`;

export const SECURITY_QUESTION_OPTIONS = [
    "What was the name of your first school?",
    "What city were you born in?",
    "What is the title of your favorite movie?",
];

export function isSessionExpired(session) {
    if (!session?.lastActivityAt || !session?.inactivityTimeoutSeconds) {
        return false;
    }

    return Date.now() - session.lastActivityAt >= session.inactivityTimeoutSeconds * 1000;
}

export function readAuthSession() {
    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        const session = raw ? JSON.parse(raw) : null;

        if (!session) {
            return null;
        }

        if (
            !session.userId ||
            !session.token ||
            !Array.isArray(session.permissions) ||
            !Array.isArray(session.roles)
        ) {
            clearAuthSession();
            return null;
        }

        if (isSessionExpired(session)) {
            clearAuthSession();
            return null;
        }

        return session;
    } catch {
        return null;
    }
}

export function writeAuthSession(session) {
    window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
            ...session,
            lastActivityAt: Date.now(),
        })
    );
}

export function touchAuthSession() {
    const session = readAuthSession();
    if (!session) {
        return null;
    }

    writeAuthSession(session);
    return session;
}

export function clearAuthSession() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function hasPermission(session, permissionCode) {
    return Boolean(session?.permissions?.includes(permissionCode));
}

async function parseError(response, fallbackMessage) {
    let message = fallbackMessage;

    try {
        const data = await response.json();

        if (Array.isArray(data.details) && data.details.length > 0) {
            message = data.details.join(" ");
        } else {
            message = data.message || fallbackMessage;
        }
    } catch {
        // ignore parse errors
    }

    return message;
}

async function postJson(path, payload, fallbackMessage) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await parseError(response, fallbackMessage));
    }

    return response.json();
}

export async function logoutApi(session) {
    if (!session?.token || !session?.userId) {
        clearAuthSession();
        return;
    }

    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
                "X-User-Id": String(session.userId),
            },
        });
    } finally {
        clearAuthSession();
    }
}

export function requestLoginCodeApi(username, password, securityAnswer) {
    return postJson(
        "/api/auth/login/request-code",
        { username, password, securityAnswer },
        "Could not send login verification code."
    );
}

export async function verifyLoginCodeApi(challengeId, code) {
    const session = await postJson(
        "/api/auth/login/verify-code",
        { challengeId, code },
        "Login verification failed."
    );
    writeAuthSession(session);
    return session;
}

export function requestRegisterCodeApi(username, displayName, email, password, securityQuestion, securityAnswer) {
    return postJson(
        "/api/auth/register/request-code",
        { username, displayName, email, password, securityQuestion, securityAnswer },
        "Could not send registration verification code."
    );
}

export async function verifyRegisterCodeApi(challengeId, code) {
    const session = await postJson(
        "/api/auth/register/verify-code",
        { challengeId, code },
        "Registration verification failed."
    );
    writeAuthSession(session);
    return session;
}

export function requestPasswordResetCodeApi(username, securityAnswer, newPassword) {
    return postJson(
        "/api/auth/recover/request-code",
        { username, securityAnswer, newPassword },
        "Could not send password reset verification code."
    );
}

export function verifyPasswordResetCodeApi(challengeId, code) {
    return postJson(
        "/api/auth/recover/verify-code",
        { challengeId, code },
        "Password reset verification failed."
    );
}