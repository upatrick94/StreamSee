import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));
vi.mock("../assets/vinyl.svg", () => ({ default: "vinyl.svg" }));
vi.mock("../assets/PlayButton.svg", () => ({ default: "play.svg" }));
vi.mock("../assets/ViewButton.svg", () => ({ default: "view.svg" }));
vi.mock("../assets/DeleteButton.svg", () => ({ default: "delete.svg" }));

vi.mock("../api/playlistsApi", () => ({
    fetchPlaylistHistoryApi: vi.fn(),
    fetchPlaylists: vi.fn(),
    prefetchPlaylistsPage: vi.fn(),
}));

vi.mock("../api/authApi", () => ({
    readAuthSession: vi.fn(() => ({
        userId: 1,
        username: "admin",
        displayName: "Administrator",
        roles: ["ADMIN"],
        permissions: ["PLAYLIST_RESTORE", "PLAYLIST_DELETE", "AUDIT_VIEW"],
    })),
    clearAuthSession: vi.fn(),
    hasPermission: vi.fn((session, permissionCode) => session?.permissions?.includes(permissionCode)),
}));

import {
    fetchPlaylistHistoryApi,
    fetchPlaylists,
    prefetchPlaylistsPage,
} from "../api/playlistsApi";
import PlaylistHistoryPage from "./PlaylistHistoryPage";
import About from "./About";
import PlaylistGridPage from "./PlaylistGridPage";
import RecommendedPage from "./RecommendedPage";

const makePlaylist = (overrides = {}) => ({
    id: 1,
    name: "Night Drive",
    creator: "Patrick",
    cover: "https://example.com/cover.jpg",
    duration: "22m",
    description: "Music for late night drives.",
    genres: ["Synthwave"],
    songs: [
        { id: 11, title: "Nightcall", artist: "Kavinsky", durationSeconds: 257 },
        { id: 12, title: "Midnight City", artist: "M83", durationSeconds: 244 },
    ],
    topSongs: ["Nightcall — Kavinsky", "Midnight City — M83"],
    createdAt: "01 Jan 2026",
    updatedAt: "05 Jan 2026",
    ...overrides,
});

const makeHistory = () => [
    {
        id: 1001,
        action: "CREATED",
        highlight: "Night Drive",
        date: "01 Jan 2026",
        snapshot: makePlaylist({ songs: [] }),
    },
    {
        id: 1002,
        action: "UPDATED",
        highlight: "Nightcall",
        date: "02 Jan 2026",
        snapshot: makePlaylist({
            songs: [{ id: 11, title: "Nightcall", artist: "Kavinsky", durationSeconds: 257 }],
        }),
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    fetchPlaylistHistoryApi.mockResolvedValue({
        content: makeHistory(),
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
    });
    fetchPlaylists.mockResolvedValue({
        content: [makePlaylist()],
        page: 0,
        size: 12,
        totalElements: 1,
        totalPages: 1,
    });
    prefetchPlaylistsPage.mockResolvedValue(undefined);
});

describe("PlaylistHistoryPage", () => {
    const renderHistoryPage = (playlistId = "1", overrides = {}) => {
        const onRestorePlaylistSnapshot = vi.fn().mockResolvedValue(makePlaylist());

        render(
            <MemoryRouter initialEntries={[`/playlists/${playlistId}/history`]}>
                <Routes>
                    <Route
                        path="/playlists/:playlistId/history"
                        element={
                            <PlaylistHistoryPage
                                playlists={[makePlaylist()]}
                                onRestorePlaylistSnapshot={onRestorePlaylistSnapshot}
                                {...overrides}
                            />
                        }
                    />
                    <Route path="/playlists" element={<div>Playlists Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        return { onRestorePlaylistSnapshot };
    };

    it("renders the playlist name and history entries", async () => {
        renderHistoryPage();

        expect(screen.getByText("Playlist History")).toBeInTheDocument();
        expect(screen.getAllByText("Night Drive").length).toBeGreaterThan(0);
        expect(await screen.findByText("CREATED")).toBeInTheDocument();
        expect(screen.getByText("UPDATED")).toBeInTheDocument();
    });

    it("shows 'Playlist not found' for an unknown playlist id", async () => {
        fetchPlaylistHistoryApi.mockRejectedValueOnce(new Error("Playlist with id 999 was not found."));

        render(
            <MemoryRouter initialEntries={["/playlists/999/history"]}>
                <Routes>
                    <Route
                        path="/playlists/:playlistId/history"
                        element={<PlaylistHistoryPage playlists={[]} />}
                    />
                    <Route path="/playlists" element={<div>Playlists Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText(/playlist not found/i)).toBeInTheDocument();
    });

    it("calls onRestorePlaylistSnapshot when Confirm restore is clicked", async () => {
        const user = userEvent.setup();
        const { onRestorePlaylistSnapshot } = renderHistoryPage();

        await screen.findByText("CREATED");
        await user.click(screen.getByRole("button", { name: /confirm restore/i }));

        await waitFor(() => {
            expect(onRestorePlaylistSnapshot).toHaveBeenCalledTimes(1);
            expect(onRestorePlaylistSnapshot).toHaveBeenCalledWith(1, expect.any(Number));
        });
    });

    it("shows success message after restoring", async () => {
        const user = userEvent.setup();
        renderHistoryPage();

        await screen.findByText("CREATED");
        await user.click(screen.getByRole("button", { name: /confirm restore/i }));

        expect(await screen.findByText(/snapshot restored successfully/i)).toBeInTheDocument();
    });

    it("allows selecting a history entry by clicking an event card", async () => {
        const user = userEvent.setup();
        renderHistoryPage();

        await screen.findByText("CREATED");

        const cards = document.querySelectorAll(".history-event-card");
        expect(cards.length).toBeGreaterThan(0);

        await user.click(cards[0]);
        expect(screen.getByRole("button", { name: /confirm restore/i })).not.toBeDisabled();
    });

    it("allows selecting a snapshot by clicking the dot", async () => {
        const user = userEvent.setup();
        renderHistoryPage();

        await screen.findByText("CREATED");

        const dots = document.querySelectorAll(".history-dot");
        expect(dots.length).toBeGreaterThan(0);

        await user.click(dots[0]);
        expect(screen.getByRole("button", { name: /confirm restore/i })).not.toBeDisabled();
    });

    it("clears the restore message when another snapshot is selected", async () => {
        const user = userEvent.setup();
        renderHistoryPage();

        await screen.findByText("CREATED");
        await user.click(screen.getByRole("button", { name: /confirm restore/i }));
        expect(await screen.findByText(/snapshot restored successfully/i)).toBeInTheDocument();

        const dots = document.querySelectorAll(".history-dot");
        await user.click(dots[0]);

        await waitFor(() => {
            expect(screen.queryByText(/snapshot restored successfully/i)).not.toBeInTheDocument();
        });
    });

    it("navigates back to /playlists when Back is clicked", async () => {
        const user = userEvent.setup();
        renderHistoryPage();

        await user.click(screen.getByRole("button", { name: /back/i }));
        expect(screen.getByText("Playlists Page")).toBeInTheDocument();
    });

    it("displays the star rating for the playlist", () => {
        renderHistoryPage();
        expect(screen.getByText("★★")).toBeInTheDocument();
    });
});

describe("About page", () => {
    it("renders the hero with app name", () => {
        render(
            <MemoryRouter>
                <About />
            </MemoryRouter>
        );
        expect(screen.getByText("StreamSee")).toBeInTheDocument();
    });

    it("renders the footer", () => {
        render(
            <MemoryRouter>
                <About />
            </MemoryRouter>
        );
        expect(screen.getByText(/powered by spotify/i)).toBeInTheDocument();
    });
});

describe("PlaylistGridPage", () => {
    it("renders all playlists as expanded cards", async () => {
        fetchPlaylists.mockResolvedValueOnce({
            content: [makePlaylist(), makePlaylist({ id: 2, name: "Workout Mix" })],
            page: 0,
            size: 12,
            totalElements: 2,
            totalPages: 1,
        });

        render(
            <MemoryRouter>
                <PlaylistGridPage onDeletePlaylist={vi.fn()} />
            </MemoryRouter>
        );

        expect(await screen.findByText("Night Drive")).toBeInTheDocument();
        expect(screen.getByText("Workout Mix")).toBeInTheDocument();
    });

    it("calls onDeletePlaylist when delete is clicked", async () => {
        const user = userEvent.setup();
        const onDeletePlaylist = vi.fn().mockResolvedValue(true);

        fetchPlaylists.mockResolvedValueOnce({
            content: [makePlaylist()],
            page: 0,
            size: 12,
            totalElements: 1,
            totalPages: 1,
        });

        render(
            <MemoryRouter>
                <PlaylistGridPage onDeletePlaylist={onDeletePlaylist} />
            </MemoryRouter>
        );

        await screen.findByText("Night Drive");
        await user.click(screen.getByRole("button", { name: /delete playlist/i }));

        await waitFor(() => {
            expect(onDeletePlaylist).toHaveBeenCalledWith(1);
        });
    });
});

describe("RecommendedPage", () => {
    it("renders recommended playlists", () => {
        render(
            <MemoryRouter>
                <RecommendedPage playlists={[makePlaylist()]} onAddPlaylist={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText(/recommended playlists for you/i)).toBeInTheDocument();
        expect(screen.getByText("Night Drive")).toBeInTheDocument();
    });
});
