import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));

const navigateMock = vi.fn();
const readAuthSessionMock = vi.fn();
const clearAuthSessionMock = vi.fn();
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
    clearAuthSession: (...args) => clearAuthSessionMock(...args),
    hasPermission: (...args) => hasPermissionMock(...args),
}));

import Navbar from "./Navbar";

describe("Navbar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        readAuthSessionMock.mockReturnValue(null);
        hasPermissionMock.mockReturnValue(false);
    });

    it("renders public navbar links for logged out users", () => {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.getByRole("link", { name: /about us/i })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /^home$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /admin/i })).not.toBeInTheDocument();
    });

    it("renders full navigation for logged in users", () => {
        readAuthSessionMock.mockReturnValue({
            userId: 1,
            username: "admin",
            displayName: "Administrator",
            permissions: ["AUDIT_VIEW"],
        });
        hasPermissionMock.mockImplementation((session, permissionCode) =>
            session?.permissions?.includes(permissionCode)
        );

        render(
            <MemoryRouter>
                <Navbar activePage="home" />
            </MemoryRouter>
        );

        expect(screen.getByRole("link", { name: /^home$/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /playlists/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /recommended/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /stats/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /chat/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
    });

    it("applies 'active' class to the current page link", () => {
        readAuthSessionMock.mockReturnValue({
            userId: 1,
            username: "admin",
            displayName: "Administrator",
            permissions: ["AUDIT_VIEW"],
        });
        hasPermissionMock.mockImplementation((session, permissionCode) =>
            session?.permissions?.includes(permissionCode)
        );

        render(
            <MemoryRouter>
                <Navbar activePage="home" />
            </MemoryRouter>
        );

        expect(screen.getByRole("link", { name: /^home$/i })).toHaveClass("active");
    });

    it("does not show dropdown initially", () => {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.queryByRole("button", { name: /log in/i })).not.toBeInTheDocument();
    });

    it("shows dropdown with Log In and Accounts when logo is clicked for logged out users", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        await user.click(screen.getByAltText(/logo/i));

        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /accounts/i })).toBeInTheDocument();
    });

    it("shows dropdown with display name and Log Out when logged in", async () => {
        const user = userEvent.setup();

        readAuthSessionMock.mockReturnValue({
            userId: 1,
            username: "admin",
            displayName: "Administrator",
            permissions: ["AUDIT_VIEW"],
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        await user.click(screen.getByAltText(/logo/i));

        expect(screen.getByRole("button", { name: /administrator/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    });

    it("hides dropdown when logo is clicked a second time", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        await user.click(screen.getByAltText(/logo/i));
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();

        await user.click(screen.getByAltText(/logo/i));
        expect(screen.queryByRole("button", { name: /log in/i })).not.toBeInTheDocument();
    });

    it("hides dropdown when clicking outside", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <div>
                    <Navbar />
                    <button type="button">Outside</button>
                </div>
            </MemoryRouter>
        );

        await user.click(screen.getByAltText(/logo/i));
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /outside/i }));
        expect(screen.queryByRole("button", { name: /log in/i })).not.toBeInTheDocument();
    });

    it("navigates to /login when Log In is clicked", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        await user.click(screen.getByAltText(/logo/i));
        await user.click(screen.getByRole("button", { name: /log in/i }));

        expect(navigateMock).toHaveBeenCalledWith("/login");
    });

    it("navigates to /register when Accounts is clicked", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        await user.click(screen.getByAltText(/logo/i));
        await user.click(screen.getByRole("button", { name: /accounts/i }));

        expect(navigateMock).toHaveBeenCalledWith("/register");
    });

    it("logs out when Log Out is clicked", async () => {
        const user = userEvent.setup();
        const originalLocation = window.location;

        delete window.location;
        window.location = {
            ...originalLocation,
            assign: vi.fn(),
        };

        readAuthSessionMock.mockReturnValue({
            userId: 1,
            username: "admin",
            displayName: "Administrator",
            permissions: ["AUDIT_VIEW"],
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        await user.click(screen.getByAltText(/logo/i));
        await user.click(screen.getByRole("button", { name: /log out/i }));

        expect(clearAuthSessionMock).toHaveBeenCalledTimes(1);
        expect(window.location.assign).toHaveBeenCalledWith("/login");
    });
});
