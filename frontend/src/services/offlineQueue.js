const PLAYLISTS_CACHE_KEY = "mpp.playlists.cache.v1";
const PENDING_QUEUE_KEY = "mpp.playlists.pending.v1";
const TEMP_ID_KEY = "mpp.playlists.temp-id.v1";

function readJson(key, fallbackValue) {
    if (typeof window === "undefined") {
        return fallbackValue;
    }

    try {
        const rawValue = window.localStorage.getItem(key);
        return rawValue ? JSON.parse(rawValue) : fallbackValue;
    } catch {
        return fallbackValue;
    }
}

function writeJson(key, value) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
}

export function readCachedPlaylists() {
    return readJson(PLAYLISTS_CACHE_KEY, []);
}

export function writeCachedPlaylists(playlists) {
    writeJson(PLAYLISTS_CACHE_KEY, playlists);
}

export function readPendingOperations() {
    return readJson(PENDING_QUEUE_KEY, []);
}

export function writePendingOperations(operations) {
    writeJson(PENDING_QUEUE_KEY, operations);
}

export function createTempPlaylistId() {
    if (typeof window === "undefined") {
        return -Date.now();
    }

    const currentValue = Number(window.localStorage.getItem(TEMP_ID_KEY) || "-1");
    const nextValue = currentValue - 1;

    window.localStorage.setItem(TEMP_ID_KEY, String(nextValue));
    return nextValue;
}

export function enqueueOperation(queue, operation) {
    const existingCreateIndex = queue.findIndex(
        (item) => item.type === "create" && item.playlistId === operation.playlistId
    );

    if (existingCreateIndex >= 0) {
        if (operation.type === "update") {
            const updatedQueue = [...queue];
            updatedQueue[existingCreateIndex] = {
                ...updatedQueue[existingCreateIndex],
                payload: operation.payload,
                queuedAt: operation.queuedAt,
            };
            return updatedQueue;
        }

        if (operation.type === "delete") {
            return queue.filter((item) => item.playlistId !== operation.playlistId);
        }
    }

    if (operation.type === "update") {
        const filteredQueue = queue.filter(
            (item) => !(item.type === "update" && item.playlistId === operation.playlistId)
        );

        return [...filteredQueue, operation];
    }

    if (operation.type === "delete") {
        const filteredQueue = queue.filter((item) => item.playlistId !== operation.playlistId);
        return [...filteredQueue, operation];
    }

    return [...queue, operation];
}
