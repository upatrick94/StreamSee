import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));
vi.mock("../assets/turntable.svg", () => ({ default: "turntable.svg" }));
vi.mock("../assets/vinyl.svg", () => ({ default: "vinyl.svg" }));
vi.mock("../assets/PlayButton.svg", () => ({ default: "play.svg" }));
vi.mock("../assets/ViewButton.svg", () => ({ default: "view.svg" }));
vi.mock("../assets/DeleteButton.svg", () => ({ default: "delete.svg" }));

import Home from "./Home";

const makePlaylists = () => [
    {
        id: 1,
        name: "Night Drive",
        creator: "Patrick",
        cover: "https://example.com/cover.jpg",
        duration: "22m",
        description: "Music for late night drives.",
        genres: ["Synthwave"],
        songs: [{ id: 11, title: "Nightcall", artist: "Kavinsky", durationSeconds: 257 }],
        topSongs: ["Nightcall — Kavinsky"],
        createdAt: "01 Jan 2026",
        updatedAt: "05 Jan 2026",
    },
    {
        id: 2,
        name: "Workout Mix",
        creator: "Ana",
        cover: "https://example.com/cover2.jpg",
        duration: "30m",
        description: "Gym session playlist.",
        genres: ["Hip-Hop"],
        songs: [{ id: 21, title: "Power", artist: "Kanye", durationSeconds: 292 }],
        topSongs: ["Power — Kanye"],
        createdAt: "02 Jan 2026",
        updatedAt: "06 Jan 2026",
    },
];

const renderHome = (playlists, onDeletePlaylist = vi.fn()) => {
    const view = render(
        <MemoryRouter>
            <Home playlists={playlists} onDeletePlaylist={onDeletePlaylist} />
        </MemoryRouter>
    );
    return view;
};

describe("Home page", () => {
    it("renders the turntable hero", () => {
        renderHome(makePlaylists());
        expect(screen.getByAltText("Turntable")).toBeInTheDocument();
    });

    it("starts with the playlist section collapsed", () => {
        const { container } = renderHome(makePlaylists());
        expect(container.querySelector(".playlist-section-shell")).toHaveClass("collapsed");
    });

    it("shows playlist section after toggle is clicked", async () => {
        const user = userEvent.setup();
        const { container } = renderHome(makePlaylists());

        await user.click(screen.getByRole("button", { name: /toggle playlist section/i }));

        expect(container.querySelector(".playlist-section-shell")).toHaveClass("expanded");
        expect(screen.getByText("Night Drive")).toBeInTheDocument();
    });

    it("collapses the playlist section after toggling twice", async () => {
        const user = userEvent.setup();
        const { container } = renderHome(makePlaylists());

        const toggle = screen.getByRole("button", { name: /toggle playlist section/i });
        await user.click(toggle);
        await user.click(toggle);

        expect(container.querySelector(".playlist-section-shell")).toHaveClass("collapsed");
    });

    it("opens playlist modal when View button is clicked", async () => {
        const user = userEvent.setup();
        renderHome(makePlaylists());
        await user.click(screen.getByRole("button", { name: /toggle playlist section/i }));
        await user.click(screen.getAllByRole("button", { name: /view playlist/i })[0]);

        expect(screen.getAllByText("Night Drive").length).toBeGreaterThan(0);
        expect(screen.getByText(/Music for late night drives/i)).toBeInTheDocument();
    });

    it("closes modal when overlay is clicked", async () => {
        const user = userEvent.setup();
        renderHome(makePlaylists());
        await user.click(screen.getByRole("button", { name: /toggle playlist section/i }));
        await user.click(screen.getAllByRole("button", { name: /view playlist/i })[0]);

        const overlay = document.querySelector(".playlist-modal-overlay");
        await user.click(overlay);
        expect(screen.queryByText(/Music for late night drives/i)).not.toBeInTheDocument();
    });

    it("calls onDeletePlaylist and closes modal when delete is clicked inside modal", async () => {
        const user = userEvent.setup();
        const onDeletePlaylist = vi.fn();
        renderHome(makePlaylists(), onDeletePlaylist);

        await user.click(screen.getByRole("button", { name: /toggle playlist section/i }));
        await user.click(screen.getAllByRole("button", { name: /view playlist/i })[0]);

        const deleteButtons = screen.getAllByRole("button", { name: /delete playlist/i });
        await user.click(deleteButtons[0]);

        expect(onDeletePlaylist).toHaveBeenCalledWith(1);
        expect(screen.queryByText(/Music for late night drives/i)).not.toBeInTheDocument();
    });

    it("calls onDeletePlaylist when delete is clicked directly on a card", async () => {
        const user = userEvent.setup();
        const onDeletePlaylist = vi.fn();
        renderHome(makePlaylists(), onDeletePlaylist);

        await user.click(screen.getByRole("button", { name: /toggle playlist section/i }));
        const deleteButtons = screen.getAllByRole("button", { name: /delete playlist/i });
        await user.click(deleteButtons[0]);

        expect(onDeletePlaylist).toHaveBeenCalledWith(1);
    });
});
