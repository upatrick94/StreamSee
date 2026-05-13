import React from "react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));
vi.mock("../api/playlistsApi", () => ({
    fetchPlaylistByIdApi: vi.fn(),
}));

import { fetchPlaylistByIdApi } from "../api/playlistsApi";
import EditPlaylistPage from "./EditPlaylistPage";

const makePlaylist = (overrides = {}) => ({
    id: 1,
    name: "Night Drive",
    creator: "Patrick",
    cover: "https://example.com/cover.jpg",
    description: "Music for late night drives.",
    genres: ["Synthwave", "Chillwave"],
    songs: [
        { id: 11, title: "Nightcall", artist: "Kavinsky", durationSeconds: 257 },
        { id: 12, title: "Midnight City", artist: "M83", durationSeconds: 244 },
    ],
    ...overrides,
});

describe("EditPlaylistPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchPlaylistByIdApi.mockResolvedValue(makePlaylist());
    });

    const renderEditPage = ({ playlists = [makePlaylist()], onUpdatePlaylist = vi.fn().mockResolvedValue(makePlaylist()) } = {}) => {
        render(
            <MemoryRouter initialEntries={["/playlists/1/edit"]}>
                <Routes>
                    <Route
                        path="/playlists/:playlistId/edit"
                        element={
                            <EditPlaylistPage
                                playlists={playlists}
                                onUpdatePlaylist={onUpdatePlaylist}
                            />
                        }
                    />
                    <Route path="/playlists/:playlistId/history" element={<div>History Page</div>} />
                    <Route path="/playlists" element={<div>Playlists Page</div>} />
                    <Route path="/home" element={<div>Home Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        return { onUpdatePlaylist };
    };

    it("renders the edit form with playlist data", async () => {
        renderEditPage();

        expect(await screen.findByRole("heading", { name: /edit playlist/i })).toBeInTheDocument();
        expect(screen.getByDisplayValue("Night Drive")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Patrick")).toBeInTheDocument();
    });

    it("shows playlist not found for an invalid id", async () => {
        fetchPlaylistByIdApi.mockRejectedValueOnce(new Error("Playlist with id 999 was not found."));

        render(
            <MemoryRouter initialEntries={["/playlists/999/edit"]}>
                <Routes>
                    <Route
                        path="/playlists/:playlistId/edit"
                        element={<EditPlaylistPage playlists={[]} onUpdatePlaylist={vi.fn()} />}
                    />
                    <Route path="/home" element={<div>Home Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByRole("heading", { name: /playlist not found/i })).toBeInTheDocument();
        expect(screen.getByText(/playlist with id 999 was not found/i)).toBeInTheDocument();
    });

    it("deletes a song and submits updated playlist", async () => {
        const user = userEvent.setup();
        const onUpdatePlaylist = vi.fn().mockResolvedValue(
            makePlaylist({
                songs: [{ id: 12, title: "Midnight City", artist: "M83", durationSeconds: 244 }],
            })
        );

        renderEditPage({ onUpdatePlaylist });
        await screen.findByRole("heading", { name: /edit playlist/i });

        await user.click(screen.getAllByRole("button", { name: /delete song/i })[0]);
        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
            expect(onUpdatePlaylist).toHaveBeenCalledTimes(1);
        });

        expect(onUpdatePlaylist).toHaveBeenCalledWith(
            1,
            expect.objectContaining({
                songs: [
                    expect.objectContaining({
                        title: "Midnight City",
                    }),
                ],
            })
        );
        expect(screen.getByText("History Page")).toBeInTheDocument();
    });

    it("submits updated playlist metadata", async () => {
        const user = userEvent.setup();
        const onUpdatePlaylist = vi.fn().mockResolvedValue(makePlaylist({ name: "Renamed Playlist" }));

        renderEditPage({ onUpdatePlaylist });
        await screen.findByRole("heading", { name: /edit playlist/i });

        const nameInput = screen.getByLabelText(/playlist name/i);
        await user.clear(nameInput);
        await user.type(nameInput, "Renamed Playlist");

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
            expect(onUpdatePlaylist).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    name: "Renamed Playlist",
                })
            );
        });

        expect(screen.getByText("History Page")).toBeInTheDocument();
    });

    it("shows empty state after deleting all songs", async () => {
        const user = userEvent.setup();
        renderEditPage();
        await screen.findByRole("heading", { name: /edit playlist/i });

        const deleteButtons = screen.getAllByRole("button", { name: /delete song/i });
        await user.click(deleteButtons[0]);
        await user.click(screen.getAllByRole("button", { name: /delete song/i })[0]);

        expect(screen.getByText(/this playlist has no songs yet/i)).toBeInTheDocument();
    });

    it("shows validation error when saving with no songs left", async () => {
        const user = userEvent.setup();
        const onUpdatePlaylist = vi.fn().mockResolvedValue(makePlaylist());

        renderEditPage({ onUpdatePlaylist });
        await screen.findByRole("heading", { name: /edit playlist/i });

        const deleteButtons = screen.getAllByRole("button", { name: /delete song/i });
        await user.click(deleteButtons[0]);
        await user.click(screen.getAllByRole("button", { name: /delete song/i })[0]);

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        expect(screen.getByText(/add at least one valid song/i)).toBeInTheDocument();
        expect(onUpdatePlaylist).not.toHaveBeenCalled();
    });

    it("navigates to playlists when Cancel is clicked", async () => {
        const user = userEvent.setup();
        renderEditPage();
        await screen.findByRole("heading", { name: /edit playlist/i });

        await user.click(screen.getByRole("button", { name: /cancel/i }));

        expect(screen.getByText("Playlists Page")).toBeInTheDocument();
    });

    it("navigates home from not found state", async () => {
        const user = userEvent.setup();
        fetchPlaylistByIdApi.mockRejectedValueOnce(new Error("Playlist with id 999 was not found."));

        render(
            <MemoryRouter initialEntries={["/playlists/999/edit"]}>
                <Routes>
                    <Route
                        path="/playlists/:playlistId/edit"
                        element={<EditPlaylistPage playlists={[]} onUpdatePlaylist={vi.fn()} />}
                    />
                    <Route path="/home" element={<div>Home Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        await screen.findByRole("heading", { name: /playlist not found/i });
        await user.click(screen.getByRole("button", { name: /back to home/i }));

        expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
});
