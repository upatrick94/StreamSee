import { readAuthSession } from "./authApi";

function trimTrailingSlash(value) {
    return value.replace(/\/+$/, "");
}

const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
const WS_BASE_URL = trimTrailingSlash(
    import.meta.env.VITE_WS_BASE_URL ||
    `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
);

export function getApiBaseUrl() {
    return API_BASE_URL;
}

export function getWsBaseUrl() {
    return WS_BASE_URL;
}

export async function apiFetch(path, options = {}) {
    const session = readAuthSession();
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (session?.token) {
        headers.set("Authorization", `Bearer ${session.token}`);
    }

    if (session?.userId) {
        headers.set("X-User-Id", String(session.userId));
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
        let message = "Request failed.";

        try {
            const payload = await response.json();
            message = payload.message || payload.error || message;
        } catch {
            // ignore parse errors
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}
