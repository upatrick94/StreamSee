import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    createHistoryEntry,
    createInitialHistory,
    buildUpdatedPlaylistWithHistory,
    buildRestoredPlaylistWithHistory,
} from "./playlistHistoryHelpers";

vi.mock("./playlistHelpers", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getTodayLabel: () => "01 Jan 2026",
    };
});

const makeSong = (id, title, artist, durationSeconds) => ({
    id,
    title,
    artist,
    durationSeconds,
});

const makePlaylist = (overrides = {}) => ({
    id: 1,
    name: "Night Drive",
    creator: "Patrick",
    cover: "https://example.com/cover.jpg",
    description: "A chill playlist for late night drives.",
    genres: ["Synthwave", "Chillwave"],
    createdAt: "01 Jan 2026",
    updatedAt: "01 Jan 2026",
    songs: [
        makeSong(11, "Nightcall", "Kavinsky", 257),
        makeSong(12, "Midnight City", "M83", 244),
    ],
    ...overrides,
});

// ─── createHistoryEntry ───────────────────────────────────────────────────────

describe("createHistoryEntry", () => {
    it("returns an entry with the correct shape", () => {
        const snapshot = makePlaylist();
        const entry = createHistoryEntry({
            action: "Created playlist",
            highlight: "Night Drive",
            date: "01 Jan 2026",
            snapshot,
        });

        expect(entry).toMatchObject({
            action: "Created playlist",
            highlight: "Night Drive",
            date: "01 Jan 2026",
        });
        expect(typeof entry.id).toBe("number");
        expect(entry.snapshot).not.toBe(snapshot); // deep clone, not same reference
    });

    it("deep-clones the snapshot so mutations do not affect the entry", () => {
        const snapshot = makePlaylist();
        const entry = createHistoryEntry({
            action: "Test",
            highlight: "x",
            date: "01 Jan 2026",
            snapshot,
        });

        snapshot.name = "MUTATED";
        expect(entry.snapshot.name).toBe("Night Drive");
    });
});

// ─── createInitialHistory ─────────────────────────────────────────────────────

describe("createInitialHistory", () => {
    it("creates one 'Created playlist' entry plus one 'Added song' per song", () => {
        const playlist = makePlaylist();
        const history = createInitialHistory(playlist);

        // 1 create + 2 songs = 3 entries
        expect(history).toHaveLength(3);
        expect(history[0].action).toBe("Created playlist");
        expect(history[0].highlight).toBe("Night Drive");
        expect(history[1].action).toBe("Added song");
        expect(history[1].highlight).toBe("Nightcall");
        expect(history[2].action).toBe("Added song");
        expect(history[2].highlight).toBe("Midnight City");
    });

    it("first entry snapshot has no songs (empty state)", () => {
        const playlist = makePlaylist();
        const history = createInitialHistory(playlist);
        expect(history[0].snapshot.songs).toHaveLength(0);
    });

    it("each 'Added song' snapshot accumulates songs correctly", () => {
        const playlist = makePlaylist();
        const history = createInitialHistory(playlist);
        expect(history[1].snapshot.songs).toHaveLength(1);
        expect(history[2].snapshot.songs).toHaveLength(2);
    });

    it("works for a playlist with no songs", () => {
        const playlist = makePlaylist({ songs: [] });
        const history = createInitialHistory(playlist);
        expect(history).toHaveLength(1);
        expect(history[0].action).toBe("Created playlist");
    });

    it("uses createdAt as the date of the first entry", () => {
        const playlist = makePlaylist({ createdAt: "15 Mar 2026" });
        const history = createInitialHistory(playlist);
        expect(history[0].date).toBe("15 Mar 2026");
    });
});

// ─── buildUpdatedPlaylistWithHistory ─────────────────────────────────────────

describe("buildUpdatedPlaylistWithHistory", () => {
    let playlist;
    let initialHistory;

    beforeEach(() => {
        playlist = makePlaylist();
        initialHistory = createInitialHistory(playlist);
    });

    it("renaming adds a 'Renamed playlist' history entry", () => {
        const { updatedPlaylist, historyEntries } = buildUpdatedPlaylistWithHistory(
            playlist,
            { name: "New Name" },
            initialHistory
        );

        expect(updatedPlaylist.name).toBe("New Name");
        const renamed = historyEntries.find((e) => e.action === "Renamed playlist");
        expect(renamed).toBeDefined();
        expect(renamed.highlight).toBe("New Name");
    });

    it("changing creator/description/genres adds an 'Edited playlist' entry", () => {
        const { historyEntries } = buildUpdatedPlaylistWithHistory(
            playlist,
            { creator: "Ana" },
            initialHistory
        );

        const edited = historyEntries.find((e) => e.action === "Edited playlist");
        expect(edited).toBeDefined();
    });

    it("deleting a song adds a 'Deleted song' history entry", () => {
        const { updatedPlaylist, historyEntries } = buildUpdatedPlaylistWithHistory(
            playlist,
            {
                songs: [
                    { id: 12, title: "Midnight City", artist: "M83", duration: "4:04" },
                ],
            },
            initialHistory
        );

        expect(updatedPlaylist.songs).toHaveLength(1);
        const deleted = historyEntries.find((e) => e.action === "Deleted song");
        expect(deleted).toBeDefined();
        expect(deleted.highlight).toBe("Nightcall");
    });

    it("no history entry is added when nothing changes", () => {
        const { historyEntries } = buildUpdatedPlaylistWithHistory(
            playlist,
            {
                name: playlist.name,
                creator: playlist.creator,
                cover: playlist.cover,
                description: playlist.description,
                genres: [...playlist.genres],
                songs: playlist.songs.map((s) => ({
                    id: s.id,
                    title: s.title,
                    artist: s.artist,
                    duration: `${Math.floor(s.durationSeconds / 60)}:${String(s.durationSeconds % 60).padStart(2, "0")}`,
                })),
            },
            initialHistory
        );

        expect(historyEntries).toHaveLength(initialHistory.length);
    });

    it("multiple changes (rename + delete song) both produce history entries", () => {
        const { historyEntries } = buildUpdatedPlaylistWithHistory(
            playlist,
            {
                name: "Renamed",
                songs: [{ id: 12, title: "Midnight City", artist: "M83", duration: "4:04" }],
            },
            initialHistory
        );

        const renamed = historyEntries.filter((e) => e.action === "Renamed playlist");
        const deleted = historyEntries.filter((e) => e.action === "Deleted song");
        expect(renamed).toHaveLength(1);
        expect(deleted).toHaveLength(1);
    });

    it("updatedAt is set to today", () => {
        const { updatedPlaylist } = buildUpdatedPlaylistWithHistory(
            playlist,
            { creator: "New Creator" },
            initialHistory
        );

        expect(updatedPlaylist.updatedAt).toBe("01 Jan 2026");
    });
});

// ─── buildRestoredPlaylistWithHistory ─────────────────────────────────────────

describe("buildRestoredPlaylistWithHistory", () => {
    it("restores the playlist to the snapshot's state", () => {
        const playlist = makePlaylist();
        const history = createInitialHistory(playlist);

        // restore to the very first entry (empty songs snapshot)
        const firstEntry = history[0];
        const { restoredPlaylist } = buildRestoredPlaylistWithHistory(
            playlist,
            firstEntry,
            history
        );

        expect(restoredPlaylist.songs).toHaveLength(0);
    });

    it("preserves the original playlist id and createdAt", () => {
        const playlist = makePlaylist({ id: 42, createdAt: "10 Feb 2026" });
        const history = createInitialHistory(playlist);
        const { restoredPlaylist } = buildRestoredPlaylistWithHistory(
            playlist,
            history[0],
            history
        );

        expect(restoredPlaylist.id).toBe(42);
        expect(restoredPlaylist.createdAt).toBe("10 Feb 2026");
    });

    it("adds a 'Restored snapshot' entry to history", () => {
        const playlist = makePlaylist();
        const history = createInitialHistory(playlist);
        const { historyEntries } = buildRestoredPlaylistWithHistory(
            playlist,
            history[0],
            history
        );

        const restored = historyEntries.find((e) => e.action === "Restored snapshot");
        expect(restored).toBeDefined();
        expect(restored.date).toBe("01 Jan 2026");
    });

    it("sets updatedAt to today on the restored playlist", () => {
        const playlist = makePlaylist();
        const history = createInitialHistory(playlist);
        const { restoredPlaylist } = buildRestoredPlaylistWithHistory(
            playlist,
            history[1],
            history
        );

        expect(restoredPlaylist.updatedAt).toBe("01 Jan 2026");
    });
});
