import { buildPlaylist, normalizeSongs, parseSongDuration } from "../utils/playlistHelpers";
import { apiFetch } from "./httpApi";

const playlistPageCache = new Map();
const playlistPageRequests = new Map();

function pageCacheKey(page, size, filters = {}) {
    return `${page}:${size}:${filters.name || ""}:${filters.creator || ""}:${filters.genre || ""}`;
}

function formatDisplayDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

function toPlaylistRequest(playlistData) {
    const normalizedSongs = normalizeSongs(playlistData.songs ?? []);

    return {
        name: playlistData.name.trim(),
        creator: playlistData.creator.trim(),
        coverUrl: playlistData.cover?.trim() || "",
        description: playlistData.description.trim(),
        genres: playlistData.genres,
        songs: normalizedSongs.map((song) => ({
            id: typeof song.id === "number" && song.id > 0 ? song.id : null,
            title: song.title.trim(),
            artist: song.artist.trim(),
            durationSeconds:
                typeof song.durationSeconds === "number"
                    ? song.durationSeconds
                    : parseSongDuration(song.duration),
        })),
    };
}

export function mapPlaylistResponse(response) {
    return buildPlaylist({
        id: response.id,
        name: response.name,
        creator: response.creator,
        cover: response.coverUrl,
        description: response.description,
        genres: response.genres ?? [],
        songs: response.songs ?? [],
        createdAt: formatDisplayDate(response.createdAt),
        updatedAt: formatDisplayDate(response.updatedAt),
    });
}

function mapHistoryEntry(entry) {
    return {
        id: entry.id,
        action: entry.action,
        highlight: entry.highlight,
        date: formatDisplayDate(entry.createdAt),
        snapshot: mapPlaylistResponse(entry.snapshot),
    };
}

function mapPlaylistPage(data) {
    return {
        content: data.content.map(mapPlaylistResponse),
        page: data.page,
        size: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
    };
}

export function invalidatePlaylistsCache() {
    playlistPageCache.clear();
    playlistPageRequests.clear();
}

export async function fetchPlaylists(page = 0, size = 12, options = {}) {
    const filters = options.filters || {};
    const key = pageCacheKey(page, size, filters);

    if (!options.force && playlistPageCache.has(key)) {
        return playlistPageCache.get(key);
    }

    if (!options.force && playlistPageRequests.has(key)) {
        return playlistPageRequests.get(key);
    }

    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    if (filters.name) params.set("name", filters.name);
    if (filters.creator) params.set("creator", filters.creator);
    if (filters.genre) params.set("genre", filters.genre);

    const requestPromise = apiFetch(`/api/playlists?${params.toString()}`).then((data) => {
        const mapped = mapPlaylistPage(data);
        playlistPageCache.set(key, mapped);
        return mapped;
    }).finally(() => {
        playlistPageRequests.delete(key);
    });

    playlistPageRequests.set(key, requestPromise);
    return requestPromise;
}

export async function prefetchPlaylistsPage(page, size = 12) {
    try {
        await fetchPlaylists(page, size);
    } catch {
        // ignore prefetch failures
    }
}

export async function fetchAllPlaylists(size = 50) {
    const firstPage = await fetchPlaylists(0, size, { force: true });
    const playlists = [...firstPage.content];

    for (let page = 1; page < firstPage.totalPages; page += 1) {
        const nextPage = await fetchPlaylists(page, size, { force: true });
        playlists.push(...nextPage.content);
    }

    return playlists;
}

export async function fetchPlaylistByIdApi(playlistId) {
    const data = await apiFetch(`/api/playlists/${Number(playlistId)}`);
    return mapPlaylistResponse(data);
}

export async function createPlaylistApi(playlistData) {
    const data = await apiFetch("/api/playlists", {
        method: "POST",
        body: toPlaylistRequest(playlistData),
    });

    invalidatePlaylistsCache();
    return mapPlaylistResponse(data);
}

export async function updatePlaylistApi(playlistId, playlistData) {
    const data = await apiFetch(`/api/playlists/${Number(playlistId)}`, {
        method: "PUT",
        body: toPlaylistRequest(playlistData),
    });

    invalidatePlaylistsCache();
    return mapPlaylistResponse(data);
}

export async function deletePlaylistApi(playlistId) {
    await apiFetch(`/api/playlists/${Number(playlistId)}`, {
        method: "DELETE",
    });

    invalidatePlaylistsCache();
}

export async function fetchPlaylistHistoryApi(playlistId, page = 0, size = 50) {
    const data = await apiFetch(`/api/playlists/${Number(playlistId)}/history?page=${page}&size=${size}`);

    return {
        content: data.content.map(mapHistoryEntry),
        page: data.page,
        size: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
    };
}

export async function restorePlaylistSnapshotApi(playlistId, historyEntryId) {
    const data = await apiFetch(`/api/playlists/${Number(playlistId)}/history/${Number(historyEntryId)}/restore`, {
        method: "POST",
    });

    invalidatePlaylistsCache();
    return mapPlaylistResponse(data);
}

export async function fetchStatisticsApi() {
    return apiFetch("/api/statistics");
}

export async function pingServerApi() {
    await apiFetch("/api/playlists?page=0&size=1");
    return true;
}
