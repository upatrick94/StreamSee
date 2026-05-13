import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));
vi.mock("../assets/vinyl.svg", () => ({ default: "vinyl.svg" }));
vi.mock("../assets/DeleteButton.svg", () => ({ default: "delete.svg" }));

import StatsPage from "./StatsPage";

const makePlaylists = () => [
    {
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
        description: "Gym playlist.",
        genres: ["Hip-Hop"],
        songs: [
            { id: 21, title: "Power", artist: "Kanye", durationSeconds: 292 },
            { id: 22, title: "HUMBLE.", artist: "Kendrick", durationSeconds: 177 },
        ],
        topSongs: ["Power — Kanye"],
        createdAt: "02 Jan 2026",
        updatedAt: "06 Jan 2026",
    },
];

const renderStats = (overrides = {}) => {
    const onDeletePlaylist = vi.fn();
    const onStartGenerator = vi.fn().mockResolvedValue(undefined);
    const onStopGenerator = vi.fn().mockResolvedValue(undefined);

    render(
        <MemoryRouter>
            <StatsPage
                playlists={makePlaylists()}
                onDeletePlaylist={onDeletePlaylist}
                onStartGenerator={onStartGenerator}
                onStopGenerator={onStopGenerator}
                {...overrides}
            />
        </MemoryRouter>
    );

    return { onDeletePlaylist, onStartGenerator, onStopGenerator };
};

describe("StatsPage", () => {
    it("renders playlist names in the default table view", () => {
        renderStats();
        expect(screen.getAllByText("Night Drive").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Workout Mix").length).toBeGreaterThan(0);
    });

    it("shows the table view toggle button", () => {
        renderStats();
        expect(screen.getByRole("button", { name: /table view/i })).toBeInTheDocument();
    });

    it("shows the chart view toggle button", () => {
        renderStats();
        expect(screen.getAllByRole("button", { name: /chart view/i }).length).toBeGreaterThan(0);
    });

    it("shows the split view toggle button", () => {
        renderStats();
        expect(screen.getByRole("button", { name: /split view/i })).toBeInTheDocument();
    });

    it("switches to chart view when the Chart button is clicked", async () => {
        const user = userEvent.setup();
        renderStats();

        await user.click(screen.getAllByRole("button", { name: /chart view/i })[0]);

        expect(document.querySelector(".stats-pie")).toBeInTheDocument();
        expect(screen.getByText(/listening distribution/i)).toBeInTheDocument();
    });

    it("switches back to table view when Table button is clicked after going to chart", async () => {
        const user = userEvent.setup();
        renderStats();

        await user.click(screen.getAllByRole("button", { name: /chart view/i })[0]);
        await user.click(screen.getByRole("button", { name: /table view/i }));

        expect(screen.getByText(/most listened playlists/i)).toBeInTheDocument();
    });

    it("renders stats rows without calling delete in the default view", () => {
        const { onDeletePlaylist } = renderStats();
        expect(screen.getAllByText("Night Drive").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Workout Mix").length).toBeGreaterThan(0);
        expect(onDeletePlaylist).not.toHaveBeenCalled();
    });

    it("switches to split view and shows generator controls", async () => {
        const user = userEvent.setup();
        renderStats();

        await user.click(screen.getByRole("button", { name: /split view/i }));

        expect(screen.getByRole("button", { name: /start generator/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /stop generator/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /stats view/i })).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /chart view/i }).length).toBeGreaterThan(1);
    });

    it("calls onDeletePlaylist when a delete item is clicked", async () => {
        const user = userEvent.setup();
        const { onDeletePlaylist } = renderStats();

        await user.click(screen.getByRole("button", { name: /^night drive$/i }));

        expect(onDeletePlaylist).toHaveBeenCalledWith(1);
    });

    it("switches the right panel in split view from chart to stats", async () => {
        const user = userEvent.setup();
        renderStats({
            statistics: {
                totalPlaylists: 2,
                totalSongs: 4,
                totalDurationSeconds: 970,
                averageSongsPerPlaylist: 2,
                averageDurationSecondsPerPlaylist: 485,
                topGenres: [{ genre: "Synthwave", count: 1 }],
                longestPlaylist: {
                    name: "Workout Mix",
                    creator: "Ana",
                    songsCount: 2,
                    totalDurationSeconds: 469,
                },
            },
        });

        await user.click(screen.getByRole("button", { name: /split view/i }));
        await user.click(screen.getByRole("button", { name: /stats view/i }));

        expect(screen.getByText(/server statistics/i)).toBeInTheDocument();
    });

    it("calls onStartGenerator with numeric inputs", async () => {
        const user = userEvent.setup();
        const { onStartGenerator } = renderStats();

        await user.clear(screen.getByRole("spinbutton", { name: /batch size/i }));
        await user.type(screen.getByRole("spinbutton", { name: /batch size/i }), "7");
        await user.clear(screen.getByRole("spinbutton", { name: /interval \(seconds\)/i }));
        await user.type(screen.getByRole("spinbutton", { name: /interval \(seconds\)/i }), "9");
        await user.click(screen.getByRole("button", { name: /start generator/i }));

        expect(onStartGenerator).toHaveBeenCalledWith(7, 9);
    });

    it("calls onStopGenerator", async () => {
        const user = userEvent.setup();
        const { onStopGenerator } = renderStats();

        await user.click(screen.getByRole("button", { name: /stop generator/i }));

        expect(onStopGenerator).toHaveBeenCalledTimes(1);
    });

    it("renders chart legend percentages in chart view", async () => {
        const user = userEvent.setup();
        renderStats();

        await user.click(screen.getAllByRole("button", { name: /chart view/i })[0]);

        expect(document.querySelector(".stats-pie")).toBeInTheDocument();
        expect(screen.getAllByText(/\d+%/).length).toBeGreaterThan(0);
    });

    it("renders with an empty playlist array without crashing", () => {
        render(
            <MemoryRouter>
                <StatsPage
                    playlists={[]}
                    onDeletePlaylist={vi.fn()}
                    onStartGenerator={vi.fn().mockResolvedValue(undefined)}
                    onStopGenerator={vi.fn().mockResolvedValue(undefined)}
                />
            </MemoryRouter>
        );

        expect(document.body).toBeInTheDocument();
    });
});
