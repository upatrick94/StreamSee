import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));

import CreatePlaylistPage from "./CreatePlaylistPage";

describe("CreatePlaylistPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    const renderCreatePage = (onCreatePlaylist = vi.fn(() => 1)) => {
        render(
            <MemoryRouter initialEntries={["/playlists/new"]}>
                <Routes>
                    <Route
                        path="/playlists/new"
                        element={<CreatePlaylistPage onCreatePlaylist={onCreatePlaylist} />}
                    />
                    <Route path="/playlists/:playlistId/edit" element={<div>Edit Page</div>} />
                    <Route path="/home" element={<div>Home Page</div>} />
                </Routes>
            </MemoryRouter>
        );
        return { onCreatePlaylist };
    };

    it("renders the create playlist form", () => {
        renderCreatePage();
        expect(screen.getByRole("heading", { name: /create playlist/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/playlist name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/created by/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/cover image url/i)).toBeInTheDocument();
    });

    it("shows validation errors on empty submit", async () => {
        const user = userEvent.setup();
        renderCreatePage();

        await user.click(screen.getByRole("button", { name: /create playlist/i }));

        expect(screen.getByText(/playlist name must have at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/creator name must have at least 2 characters/i)).toBeInTheDocument();
    });

    it("adds a new song row when Add song row is clicked", async () => {
        const user = userEvent.setup();
        renderCreatePage();

        expect(screen.getAllByPlaceholderText(/song title/i)).toHaveLength(3);
        await user.click(screen.getByRole("button", { name: /add song row/i }));
        expect(screen.getAllByPlaceholderText(/song title/i)).toHaveLength(4);
    });

    it("removes a song row when Remove is clicked", async () => {
        const user = userEvent.setup();
        renderCreatePage();

        expect(screen.getAllByPlaceholderText(/song title/i)).toHaveLength(3);
        await user.click(screen.getAllByRole("button", { name: /remove/i })[0]);
        expect(screen.getAllByPlaceholderText(/song title/i)).toHaveLength(2);
    });

    it("shows an error for invalid cover url", async () => {
        const user = userEvent.setup();
        renderCreatePage();

        await user.type(screen.getByLabelText(/playlist name/i), "Test Playlist");
        await user.type(screen.getByLabelText(/created by/i), "Patrick");
        await user.type(screen.getByLabelText(/cover image url/i), "notaurl");
        await user.type(screen.getByLabelText(/description/i), "A valid enough description");
        await user.type(screen.getByLabelText(/genres/i), "Pop");
        await user.type(screen.getAllByPlaceholderText(/song title/i)[0], "Song A");
        await user.type(screen.getAllByPlaceholderText(/artist/i)[0], "Artist A");
        await user.type(screen.getAllByPlaceholderText(/duration \(mm:ss\)/i)[0], "3:20");

        await user.click(screen.getByRole("button", { name: /create playlist/i }));

        expect(screen.getByText(/cover image must be a valid http or https url/i)).toBeInTheDocument();
    });

    it("shows an error for invalid song duration", async () => {
        const user = userEvent.setup();
        renderCreatePage();

        await user.type(screen.getByLabelText(/playlist name/i), "Test Playlist");
        await user.type(screen.getByLabelText(/created by/i), "Patrick");
        await user.type(screen.getByLabelText(/description/i), "A valid enough description");
        await user.type(screen.getByLabelText(/genres/i), "Pop");
        await user.type(screen.getAllByPlaceholderText(/song title/i)[0], "Song A");
        await user.type(screen.getAllByPlaceholderText(/artist/i)[0], "Artist A");
        await user.type(screen.getAllByPlaceholderText(/duration \(mm:ss\)/i)[0], "3:99");

        await user.click(screen.getByRole("button", { name: /create playlist/i }));

        expect(screen.getByText(/use a valid duration like 3:45/i)).toBeInTheDocument();
    });

    it("ignores completely empty song rows if at least one valid song exists", async () => {
        const user = userEvent.setup();
        const onCreatePlaylist = vi.fn(() => 7);
        renderCreatePage(onCreatePlaylist);

        await user.type(screen.getByLabelText(/playlist name/i), "Test Playlist");
        await user.type(screen.getByLabelText(/created by/i), "Patrick");
        await user.type(screen.getByLabelText(/description/i), "A valid enough description");
        await user.type(screen.getByLabelText(/genres/i), "Pop");

        await user.type(screen.getAllByPlaceholderText(/song title/i)[0], "Song A");
        await user.type(screen.getAllByPlaceholderText(/artist/i)[0], "Artist A");
        await user.type(screen.getAllByPlaceholderText(/duration \(mm:ss\)/i)[0], "3:20");

        await user.click(screen.getByRole("button", { name: /create playlist/i }));

        expect(onCreatePlaylist).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Edit Page")).toBeInTheDocument();
    });

    it("submits valid form data", async () => {
        const user = userEvent.setup();
        const onCreatePlaylist = vi.fn(() => 1);
        renderCreatePage(onCreatePlaylist);

        await user.type(screen.getByLabelText(/playlist name/i), "Night Drive");
        await user.type(screen.getByLabelText(/created by/i), "Patrick");
        await user.type(screen.getByLabelText(/cover image url/i), "https://example.com/cover.jpg");
        await user.type(screen.getByLabelText(/description/i), "Music for late night drives");
        await user.type(screen.getByLabelText(/genres/i), "Synthwave, Chillwave");

        await user.type(screen.getAllByPlaceholderText(/song title/i)[0], "Nightcall");
        await user.type(screen.getAllByPlaceholderText(/artist/i)[0], "Kavinsky");
        await user.type(screen.getAllByPlaceholderText(/duration \(mm:ss\)/i)[0], "4:17");

        await user.click(screen.getByRole("button", { name: /create playlist/i }));

        expect(onCreatePlaylist).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Edit Page")).toBeInTheDocument();
    });

    it("navigates home when Cancel is clicked", async () => {
        const user = userEvent.setup();
        renderCreatePage();

        await user.click(screen.getByRole("button", { name: /cancel/i }));

        expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
});