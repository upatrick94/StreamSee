const COOKIE_NAME = "streamsee_activity";
const COOKIE_DAYS = 30;

function setCookie(name, value, days = COOKIE_DAYS) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const prefix = `${name}=`;
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(prefix)) {
            return decodeURIComponent(trimmed.substring(prefix.length));
        }
    }

    return null;
}

function getDefaultActivityProfile() {
    return {
        totalVisits: 0,
        totalPlaylistViews: 0,
        totalPlaylistAdds: 0,
        totalPlaylistDeletes: 0,
        pageVisits: {},
        genreScores: {},
        creatorScores: {},
        playlistScores: {},
        lastAction: null,
    };
}

export function readActivityProfile() {
    try {
        const raw = getCookie(COOKIE_NAME);

        if (!raw) {
            return getDefaultActivityProfile();
        }

        const parsed = JSON.parse(raw);

        return {
            ...getDefaultActivityProfile(),
            ...parsed,
            pageVisits: parsed.pageVisits || {},
            genreScores: parsed.genreScores || {},
            creatorScores: parsed.creatorScores || {},
            playlistScores: parsed.playlistScores || {},
        };
    } catch {
        return getDefaultActivityProfile();
    }
}

export function saveActivityProfile(profile) {
    setCookie(COOKIE_NAME, JSON.stringify(profile));
}

function incrementMapValue(mapObject, key, amount = 1) {
    if (!key) {
        return;
    }

    mapObject[key] = (mapObject[key] || 0) + amount;
}

function updatePreferenceScores(profile, playlist, weight = 1) {
    if (!playlist) {
        return;
    }

    incrementMapValue(profile.playlistScores, playlist.name, weight);
    incrementMapValue(profile.creatorScores, playlist.creator, weight);

    (playlist.genres || []).forEach((genre) => {
        incrementMapValue(profile.genreScores, genre, weight);
    });
}

export function trackPageVisit(pathname) {
    const profile = readActivityProfile();

    profile.totalVisits += 1;
    incrementMapValue(profile.pageVisits, pathname, 1);
    profile.lastAction = `Visited ${pathname}`;

    saveActivityProfile(profile);
    return profile;
}

export function trackPlaylistAction(action, playlist) {
    const profile = readActivityProfile();

    if (action === "view") {
        profile.totalPlaylistViews += 1;
        updatePreferenceScores(profile, playlist, 3);
        profile.lastAction = `Viewed ${playlist?.name || "playlist"}`;
    }

    if (action === "add") {
        profile.totalPlaylistAdds += 1;
        updatePreferenceScores(profile, playlist, 5);
        profile.lastAction = `Added ${playlist?.name || "playlist"}`;
    }

    if (action === "delete") {
        profile.totalPlaylistDeletes += 1;
        updatePreferenceScores(profile, playlist, 1);
        profile.lastAction = `Deleted ${playlist?.name || "playlist"}`;
    }

    saveActivityProfile(profile);
    return profile;
}

function getSortedEntries(scoreMap) {
    return Object.entries(scoreMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
}

export function getTopPreferences(profile) {
    return {
        genres: getSortedEntries(profile.genreScores).slice(0, 3),
        creators: getSortedEntries(profile.creatorScores).slice(0, 3),
        playlists: getSortedEntries(profile.playlistScores).slice(0, 3),
    };
}

export function personalizeRecommendedPlaylists(playlists, profile) {
    const genreScores = profile?.genreScores || {};
    const creatorScores = profile?.creatorScores || {};

    return [...playlists].sort((a, b) => {
        const scoreA =
            (a.genres || []).reduce((sum, genre) => sum + (genreScores[genre] || 0), 0) +
            (creatorScores[a.creator] || 0);

        const scoreB =
            (b.genres || []).reduce((sum, genre) => sum + (genreScores[genre] || 0), 0) +
            (creatorScores[b.creator] || 0);

        return scoreB - scoreA;
    });
}