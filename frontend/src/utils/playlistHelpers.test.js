import {
    buildPlaylist,
    formatPlaylistDuration,
    parseSongDuration,
    validatePlaylistForm,
} from "./playlistHelpers";
import { describe, it, expect} from "vitest";

describe("playlistHelpers", () => {
    it("parses mm:ss song duration correctly", () => {
        expect(parseSongDuration("3:45")).toBe(225);
        expect(parseSongDuration("0:59")).toBe(59);
    });

    it("returns 0 for invalid duration", () => {
        expect(parseSongDuration("3:75")).toBe(0);
        expect(parseSongDuration("abc")).toBe(0);
        expect(parseSongDuration("")).toBe(0);
    });

    it("formats playlist duration", () => {
        expect(formatPlaylistDuration(3900)).toBe("1h 5m");
        expect(formatPlaylistDuration(540)).toBe("9m");
    });

    it("builds playlist song count, duration, and top songs from songs array", () => {
        const playlist = buildPlaylist({
            id: 1,
            name: "Test",
            songs: [
                { id: 1, title: "One", artist: "A", duration: "3:00" },
                { id: 2, title: "Two", artist: "B", duration: "4:00" },
                { id: 3, title: "Three", artist: "C", duration: "2:30" },
            ],
        });

        expect(playlist.songs).toHaveLength(3);
        expect(playlist.duration).toBe("9m");
        expect(playlist.topSongs).toEqual([
            "One — A",
            "Two — B",
            "Three — C",
        ]);
    });

    it("validates an invalid playlist form", () => {
        const result = validatePlaylistForm({
            name: "",
            creator: "A",
            cover: "notaurl",
            description: "short",
            genresText: "",
            songs: [{ id: 1, title: "", artist: "", duration: "" }],
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeTruthy();
        expect(result.errors.creator).toBeTruthy();
        expect(result.errors.cover).toBeTruthy();
        expect(result.errors.description).toBeTruthy();
        expect(result.errors.genres).toBeTruthy();
        expect(result.errors.songs).toBeTruthy();
    });

    it("accepts a valid playlist form", () => {
        const result = validatePlaylistForm({
            name: "Night Drive",
            creator: "Patrick",
            cover: "https://example.com/cover.jpg",
            description: "A long enough description for the validator.",
            genresText: "Synthwave, Chillwave",
            songs: [
                { id: 1, title: "Nightcall", artist: "Kavinsky", duration: "4:17" },
            ],
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
        expect(result.songErrors).toEqual({});
    });
});