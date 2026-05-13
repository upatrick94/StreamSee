import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../assets/PlayButton.svg", () => ({ default: "play.svg" }));
vi.mock("../assets/ViewButton.svg", () => ({ default: "view.svg" }));
vi.mock("../assets/DeleteButton.svg", () => ({ default: "delete.svg" }));

const navigateMock = vi.fn();
const readAuthSessionMock = vi.fn();
const hasPermissionMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock("../api/authApi", () => ({
    readAuthSession: (...args) => readAuthSessionMock(...args),
    hasPermission: (...args) => hasPermissionMock(...args),
}));

import PlaylistCard from "./PlaylistCard";
import PlaylistDetailsModal from "./PlaylistDetailsModal";
import ExpandedPlaylistCard from "./ExpandedPlaylistCard";

const basePlaylist = {
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
    topSongs: ["Nightcall — Kavinsky", "Midnight City — M83"],
    createdAt: "01 Jan 2026",
    updatedAt: "05 Jan 2026",
    duration: "22m",
};

describe("PlaylistCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the playlist name, song count, and creator", () => {
        render(
            <MemoryRouter>
                <PlaylistCard playlist={basePlaylist} onDelete={vi.fn()} onView={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText("Night Drive")).toBeInTheDocument();
        expect(document.querySelector(".playlist-songs")).toHaveTextContent("2");
        expect(screen.getByText(/Patrick/i)).toBeInTheDocument();
    });


    it("calls onDelete when the delete button is clicked", async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();

        render(
            <MemoryRouter>
                <PlaylistCard playlist={basePlaylist} onDelete={onDelete} onView={vi.fn()} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /delete/i }));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("calls onView when the view button is clicked", async () => {
        const user = userEvent.setup();
        const onView = vi.fn();

        render(
            <MemoryRouter>
                <PlaylistCard playlist={basePlaylist} onDelete={vi.fn()} onView={onView} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /view/i }));
        expect(onView).toHaveBeenCalledTimes(1);
    });

    it("renders the cover image", () => {
        render(
            <MemoryRouter>
                <PlaylistCard playlist={basePlaylist} onDelete={vi.fn()} onView={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByAltText("Night Drive")).toHaveAttribute("src", basePlaylist.cover);
    });
});

describe("PlaylistDetailsModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("displays the playlist name, creator and duration", () => {
        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={vi.fn()} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText("Night Drive")).toBeInTheDocument();
        expect(screen.getByText(/Patrick/i)).toBeInTheDocument();
        expect(screen.getByText(/22m/i)).toBeInTheDocument();
    });

    it("displays genres and description", () => {
        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={vi.fn()} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Synthwave, Chillwave/i)).toBeInTheDocument();
        expect(screen.getByText(/Music for late night drives/i)).toBeInTheDocument();
    });

    it("displays top songs", () => {
        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={vi.fn()} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Nightcall/)).toBeInTheDocument();
        expect(screen.getByText(/Midnight City/)).toBeInTheDocument();
    });

    it("calls onClose when overlay is clicked", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={onClose} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        await user.click(document.querySelector(".playlist-modal-overlay"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onClose when the modal panel itself is clicked", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={onClose} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        await user.click(document.querySelector(".playlist-modal-panel"));
        expect(onClose).not.toHaveBeenCalled();
    });

    it("calls onDelete when delete button is clicked", async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();

        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={vi.fn()} onDelete={onDelete} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /delete/i }));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("navigates to edit page when Edit button is clicked", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={vi.fn()} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /edit/i }));
        expect(navigateMock).toHaveBeenCalledWith("/playlists/1/edit");
    });

    it("navigates to history page when History button is clicked", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <PlaylistDetailsModal playlist={basePlaylist} onClose={vi.fn()} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /history/i }));
        expect(navigateMock).toHaveBeenCalledWith("/playlists/1/history");
    });
});

describe("ExpandedPlaylistCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        readAuthSessionMock.mockReturnValue({
            userId: 1,
            username: "admin",
            permissions: ["PLAYLIST_DELETE"],
        });
        hasPermissionMock.mockImplementation((session, permissionCode) =>
            session?.permissions?.includes(permissionCode)
        );
    });

    it("renders playlist details in normal (non-recommended) mode", () => {
        render(
            <MemoryRouter>
                <ExpandedPlaylistCard playlist={basePlaylist} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText("Night Drive")).toBeInTheDocument();
        expect(screen.getByText(/Patrick/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /delete playlist/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /edit playlist/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /history/i })).toBeInTheDocument();
    });

    it("calls onDelete when delete button is clicked in normal mode", async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();

        render(
            <MemoryRouter>
                <ExpandedPlaylistCard playlist={basePlaylist} onDelete={onDelete} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /delete playlist/i }));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("hides delete button without delete permission", () => {
        readAuthSessionMock.mockReturnValue({
            userId: 2,
            username: "user",
            permissions: [],
        });

        render(
            <MemoryRouter>
                <ExpandedPlaylistCard playlist={basePlaylist} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.queryByRole("button", { name: /delete playlist/i })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /edit playlist/i })).toBeInTheDocument();
    });

    it("shows only an Add button in recommended mode", () => {
        render(
            <MemoryRouter>
                <ExpandedPlaylistCard
                    playlist={basePlaylist}
                    isRecommended={true}
                    onAdd={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(screen.getByRole("button", { name: /add playlist/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /edit playlist/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /history/i })).not.toBeInTheDocument();
    });

    it("calls onAdd when Add button is clicked in recommended mode", async () => {
        const user = userEvent.setup();
        const onAdd = vi.fn();

        render(
            <MemoryRouter>
                <ExpandedPlaylistCard
                    playlist={basePlaylist}
                    isRecommended={true}
                    onAdd={onAdd}
                />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /add playlist/i }));
        expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it("navigates to edit page on Edit click", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <ExpandedPlaylistCard playlist={basePlaylist} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: /edit playlist/i }));
        expect(navigateMock).toHaveBeenCalledWith("/playlists/1/edit");
    });
});
