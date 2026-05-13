import { buildPlaylist, getTodayLabel, normalizeSongs } from "./playlistHelpers";

const MONTHS = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function cloneSnapshot(snapshot) {
    return JSON.parse(JSON.stringify(snapshot));
}

function parseDisplayDate(label) {
    if (!label || typeof label !== "string") {
        return new Date();
    }

    const parts = label.split(" ");
    if (parts.length !== 3) {
        return new Date();
    }

    const day = Number(parts[0]);
    const month = MONTHS[parts[1]];
    const year = Number(parts[2]);

    if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) {
        return new Date();
    }

    return new Date(year, month, day);
}

function formatDisplayDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function addDaysToLabel(label, daysToAdd) {
    const date = parseDisplayDate(label);
    date.setDate(date.getDate() + daysToAdd);
    return formatDisplayDate(date);
}

export function createHistoryEntry({ action, highlight, date, snapshot }) {
    return {
        id: Date.now() + Math.floor(Math.random() * 100000),
        action,
        highlight,
        date,
        snapshot: cloneSnapshot(snapshot),
    };
}

export function createInitialHistory(playlist) {
    const createdDate = playlist.createdAt || getTodayLabel();
    const entries = [];

    const emptySnapshot = buildPlaylist({
        ...cloneSnapshot(playlist),
        songs: [],
        topSongs: [],
    });

    entries.push(
        createHistoryEntry({
            action: "Created playlist",
            highlight: playlist.name,
            date: createdDate,
            snapshot: emptySnapshot,
        })
    );

    let currentSongs = [];

    playlist.songs.forEach((song, index) => {
        currentSongs = [...currentSongs, cloneSnapshot(song)];

        const snapshot = buildPlaylist({
            ...cloneSnapshot(playlist),
            songs: currentSongs,
        });

        entries.push(
            createHistoryEntry({
                action: "Added song",
                highlight: song.title,
                date: addDaysToLabel(createdDate, index + 1),
                snapshot,
            })
        );
    });

    return entries;
}

export function buildUpdatedPlaylistWithHistory(currentPlaylist, updatedData, currentHistory) {
    const dateLabel = getTodayLabel();
    const historyEntries = [...currentHistory];

    const nextName = updatedData.name?.trim() ?? currentPlaylist.name;
    const nextCreator = updatedData.creator?.trim() ?? currentPlaylist.creator;
    const nextCover = updatedData.cover?.trim() || currentPlaylist.cover;
    const nextDescription = updatedData.description?.trim() ?? currentPlaylist.description;
    const nextGenres = updatedData.genres ?? currentPlaylist.genres;
    const normalizedNewSongs = normalizeSongs(updatedData.songs ?? currentPlaylist.songs);

    let workingPlaylist = cloneSnapshot(currentPlaylist);
    let createdAnyHistoryEntry = false;

    if (nextName !== currentPlaylist.name) {
        workingPlaylist = buildPlaylist({
            ...workingPlaylist,
            name: nextName,
        });

        historyEntries.push(
            createHistoryEntry({
                action: "Renamed playlist",
                highlight: nextName,
                date: dateLabel,
                snapshot: workingPlaylist,
            })
        );

        createdAnyHistoryEntry = true;
    }

    const detailsChanged =
        nextCreator !== currentPlaylist.creator ||
        nextCover !== currentPlaylist.cover ||
        nextDescription !== currentPlaylist.description ||
        JSON.stringify(nextGenres) !== JSON.stringify(currentPlaylist.genres);

    if (detailsChanged) {
        workingPlaylist = buildPlaylist({
            ...workingPlaylist,
            creator: nextCreator,
            cover: nextCover,
            description: nextDescription,
            genres: nextGenres,
        });

        historyEntries.push(
            createHistoryEntry({
                action: "Edited playlist",
                highlight: workingPlaylist.name,
                date: dateLabel,
                snapshot: workingPlaylist,
            })
        );

        createdAnyHistoryEntry = true;
    }

    const removedSongs = workingPlaylist.songs.filter(
        (song) => !normalizedNewSongs.some((updatedSong) => updatedSong.id === song.id)
    );

    removedSongs.forEach((song) => {
        workingPlaylist = buildPlaylist({
            ...workingPlaylist,
            songs: workingPlaylist.songs.filter((item) => item.id !== song.id),
        });

        historyEntries.push(
            createHistoryEntry({
                action: "Deleted song",
                highlight: song.title,
                date: dateLabel,
                snapshot: workingPlaylist,
            })
        );

        createdAnyHistoryEntry = true;
    });

    const updatedPlaylist = buildPlaylist({
        ...workingPlaylist,
        name: nextName,
        creator: nextCreator,
        cover: nextCover,
        description: nextDescription,
        genres: nextGenres,
        songs: normalizedNewSongs,
        updatedAt: dateLabel,
    });

    const sameAsCurrent =
        JSON.stringify(updatedPlaylist) ===
        JSON.stringify(buildPlaylist({ ...currentPlaylist }));

    if (!createdAnyHistoryEntry && !sameAsCurrent) {
        historyEntries.push(
            createHistoryEntry({
                action: "Edited playlist",
                highlight: updatedPlaylist.name,
                date: dateLabel,
                snapshot: updatedPlaylist,
            })
        );
    }

    return {
        updatedPlaylist,
        historyEntries,
    };
}

export function buildRestoredPlaylistWithHistory(currentPlaylist, selectedEntry, currentHistory) {
    const restoredPlaylist = buildPlaylist({
        ...cloneSnapshot(selectedEntry.snapshot),
        id: currentPlaylist.id,
        cover: selectedEntry.snapshot.cover || currentPlaylist.cover,
        createdAt: currentPlaylist.createdAt,
        updatedAt: getTodayLabel(),
    });

    const historyEntries = [
        ...currentHistory,
        createHistoryEntry({
            action: "Restored snapshot",
            highlight: selectedEntry.highlight,
            date: getTodayLabel(),
            snapshot: restoredPlaylist,
        }),
    ];

    return {
        restoredPlaylist,
        historyEntries,
    };
}