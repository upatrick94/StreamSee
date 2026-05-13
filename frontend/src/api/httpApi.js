import { readAuthSession } from "./authApi";

const API_HOST = import.meta.env.VITE_API_HOST || window.location.hostname;
const API_PORT = import.meta.env.VITE_API_PORT || "8080";
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || window.location.protocol;
const API_BASE_URL = `${API_PROTOCOL}//${API_HOST}:${API_PORT}`;

export function getApiBaseUrl() {
    return API_BASE_URL;
}

export function getWsBaseUrl() {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${API_HOST}:${API_PORT}`;
}

export async function apiFetch(path, options = {}) {
    const session = readAuthSession();
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body !== undefined) {
        headers.set("Content-Type", "application/json");
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
