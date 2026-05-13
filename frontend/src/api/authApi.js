const AUTH_STORAGE_KEY = "mpp.auth.session";
const API_HOST = import.meta.env.VITE_API_HOST || window.location.hostname;
const API_PORT = import.meta.env.VITE_API_PORT || "8080";
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || window.location.protocol;
const API_BASE_URL = `${API_PROTOCOL}//${API_HOST}:${API_PORT}`;

export function readAuthSession() {
    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function writeAuthSession(session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function hasPermission(session, permissionCode) {
    return Boolean(session?.permissions?.includes(permissionCode));
}

async function submitAuth(path, payload, fallbackMessage) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let message = fallbackMessage;

        try {
            const data = await response.json();
            message = data.message || fallbackMessage;
        } catch {
            // ignore parse errors
        }

        throw new Error(message);
    }

    const session = await response.json();
    writeAuthSession(session);
    return session;
}

export function loginApi(username, password) {
    return submitAuth(
        "/api/auth/login",
        { username, password },
        "Login failed."
    );
}

export function registerApi(username, displayName, password) {
    return submitAuth(
        "/api/auth/register",
        { username, displayName, password },
        "Registration failed."
    );
}
