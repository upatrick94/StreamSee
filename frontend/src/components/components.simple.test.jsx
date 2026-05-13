import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Footer from "./Footer";
import Hero from "./Hero";
import PickupToggle from "./PickupToggle";
import Pagination from "./Pagination";

vi.mock("../assets/turntable.svg", () => ({ default: "turntable.svg" }));
import TurntableHero from "./TurntableHero";

describe("Footer", () => {
    it("renders the powered-by text", () => {
        render(<Footer />);
        expect(screen.getByText(/powered by spotify/i)).toBeInTheDocument();
    });
});

describe("Hero", () => {
    it("renders the app name", () => {
        render(<Hero />);
        expect(screen.getByText("StreamSee")).toBeInTheDocument();
    });

    it("renders the tagline", () => {
        render(<Hero />);
        expect(screen.getByText(/discover music together/i)).toBeInTheDocument();
    });

    it("renders the description paragraph", () => {
        render(<Hero />);
        expect(screen.getByText(/social music platform/i)).toBeInTheDocument();
    });
});

describe("TurntableHero", () => {
    it("renders a turntable image with correct alt text", () => {
        render(<TurntableHero />);
        expect(screen.getByAltText("Turntable")).toBeInTheDocument();
    });
});

describe("PickupToggle", () => {
    it("calls onToggle when clicked", async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        render(<PickupToggle isExpanded={false} onToggle={onToggle} />);

        await user.click(screen.getByRole("button", { name: /toggle playlist section/i }));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("shows the arrow icon when collapsed", () => {
        render(<PickupToggle isExpanded={false} onToggle={vi.fn()} />);
        expect(screen.getByText("⌄")).toBeInTheDocument();
    });

    it("keeps the arrow icon rendered when expanded", () => {
        render(<PickupToggle isExpanded={true} onToggle={vi.fn()} />);
        expect(screen.getByText("⌄")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /toggle playlist section/i })).toHaveClass("expanded");
    });
});

describe("Pagination", () => {
    const setup = (currentPage, totalPages) => {
        const onPageChange = vi.fn();
        render(
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        );
        return { onPageChange };
    };

    it("renders all page buttons", () => {
        setup(1, 3);
        expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    });

    it("calls onPageChange with correct page when a page button is clicked", async () => {
        const user = userEvent.setup();
        const { onPageChange } = setup(1, 3);
        await user.click(screen.getByRole("button", { name: "2" }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("next arrow advances the page", async () => {
        const user = userEvent.setup();
        const { onPageChange } = setup(1, 3);
        await user.click(screen.getByRole("button", { name: ">" }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("prev arrow goes back a page", async () => {
        const user = userEvent.setup();
        const { onPageChange } = setup(2, 3);
        await user.click(screen.getByRole("button", { name: "<" }));
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("prev button is disabled on page 1", () => {
        setup(1, 3);
        expect(screen.getByRole("button", { name: "<" })).toBeDisabled();
    });

    it("next button is disabled on the last page", () => {
        setup(3, 3);
        expect(screen.getByRole("button", { name: ">" })).toBeDisabled();
    });
});
