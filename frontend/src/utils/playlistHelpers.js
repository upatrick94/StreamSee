export function getTodayLabel() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    return `${day} ${month} ${year}`;
}

export function parseSongDuration(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    }

    if (!value || typeof value !== "string") {
        return 0;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return 0;
    }

    if (/^\d+$/.test(trimmed)) {
        return Math.max(0, parseInt(trimmed, 10));
    }

    const parts = trimmed.split(":");

    if (parts.length !== 2) {
        return 0;
    }

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
        return 0;
    }

    if (minutes < 0 || seconds < 0 || seconds > 59) {
        return 0;
    }

    return minutes * 60 + seconds;
}

export function formatSongDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatPlaylistDuration(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

export function buildTopSongs(songs) {
    return songs.slice(0, 5).map((song) => `${song.title} — ${song.artist}`);
}

export function normalizeSongs(songs) {
    return songs
        .map((song, index) => {
            const title = (song.title || "").trim();
            const artist = (song.artist || "").trim();
            const durationSeconds =
                typeof song.durationSeconds === "number"
                    ? song.durationSeconds
                    : parseSongDuration(song.duration);

            return {
                id: song.id ?? Date.now() + index,
                title,
                artist,
                durationSeconds,
            };
        })
        .filter((song) => song.title && song.artist && song.durationSeconds > 0);
}

export function buildPlaylist(playlist) {
    const normalizedSongs = normalizeSongs(playlist.songs || []);
    const totalSeconds = normalizedSongs.reduce(
        (sum, song) => sum + song.durationSeconds,
        0
    );

    return {
        ...playlist,
        songs: normalizedSongs,
        duration: formatPlaylistDuration(totalSeconds),
        topSongs: buildTopSongs(normalizedSongs),
    };
}

export function isValidImageUrl(value) {
    if (!value || !value.trim()) {
        return true;
    }

    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export function validatePlaylistForm({
                                         name,
                                         creator,
                                         cover,
                                         description,
                                         genresText,
                                         songs,
                                     }) {
    const errors = {};
    const songErrors = {};

    if (!name || name.trim().length < 2) {
        errors.name = "Playlist name must have at least 2 characters.";
    }

    if (!creator || creator.trim().length < 2) {
        errors.creator = "Creator name must have at least 2 characters.";
    }

    if (!description || description.trim().length < 10) {
        errors.description = "Description must have at least 10 characters.";
    }

    if (!genresText || genresText.split(",").map((genre) => genre.trim()).filter(Boolean).length === 0) {
        errors.genres = "Add at least one genre.";
    }

    if (!isValidImageUrl(cover)) {
        errors.cover = "Cover image must be a valid http or https URL.";
    }

    const validSongs = [];

    (songs || []).forEach((song) => {
        const title = (song.title || "").trim();
        const artist = (song.artist || "").trim();
        const duration = (song.duration || "").trim();

        const rowIsCompletelyEmpty = !title && !artist && !duration;

        if (rowIsCompletelyEmpty) {
            return;
        }

        const rowErrors = {};

        if (!title) {
            rowErrors.title = "Title is required.";
        }

        if (!artist) {
            rowErrors.artist = "Artist is required.";
        }

        const parsedDuration = parseSongDuration(duration);

        if (!duration) {
            rowErrors.duration = "Duration is required.";
        } else if (parsedDuration <= 0) {
            rowErrors.duration = "Use a valid duration like 3:45.";
        }

        if (Object.keys(rowErrors).length > 0) {
            songErrors[song.id] = rowErrors;
            return;
        }

        validSongs.push(song);
    });

    if (validSongs.length === 0) {
        errors.songs = "Add at least one valid song.";
    }

    return {
        isValid: Object.keys(errors).length === 0 && Object.keys(songErrors).length === 0,
        errors,
        songErrors,
    };
}