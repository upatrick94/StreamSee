import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));

const loginApiMock = vi.fn();
const readAuthSessionMock = vi.fn(() => null);
const clearAuthSessionMock = vi.fn();
const hasPermissionMock = vi.fn(() => false);

vi.mock("../api/authApi", () => ({
    loginApi: (...args) => loginApiMock(...args),
    readAuthSession: (...args) => readAuthSessionMock(...args),
    clearAuthSession: (...args) => clearAuthSessionMock(...args),
    hasPermission: (...args) => hasPermissionMock(...args),
}));

import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

describe("LoginPage", () => {
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        readAuthSessionMock.mockReturnValue(null);

        delete window.location;
        window.location = {
            ...originalLocation,
            assign: vi.fn(),
        };
    });

    const renderLogin = () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );
    };

    it("renders the login form and demo credentials hint", () => {
        renderLogin();

        expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByText(/admin \/ admin123/i)).toBeInTheDocument();
        expect(screen.getByText(/user \/ user123/i)).toBeInTheDocument();
    });

    it("shows error when submitted with empty fields", async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.click(screen.getByRole("button", { name: /^log in$/i }));

        expect(screen.getByText(/please enter your username/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();
    });

    it("calls loginApi and redirects on successful submission", async () => {
        const user = userEvent.setup();
        loginApiMock.mockResolvedValue({
            userId: 1,
            username: "admin",
            displayName: "Administrator",
            roles: ["ADMIN"],
            permissions: ["AUDIT_VIEW"],
        });

        renderLogin();

        await user.type(screen.getByLabelText(/^username$/i), "admin");
        await user.type(screen.getByLabelText(/^password$/i), "admin123");
        await user.click(screen.getByRole("button", { name: /^log in$/i }));

        await waitFor(() => {
            expect(loginApiMock).toHaveBeenCalledWith("admin", "admin123");
        });

        expect(await screen.findByText(/logged in successfully/i)).toBeInTheDocument();
        expect(window.location.assign).toHaveBeenCalledWith("/home");
    });

    it("shows backend login error", async () => {
        const user = userEvent.setup();
        loginApiMock.mockRejectedValue(new Error("Invalid username or password."));

        renderLogin();

        await user.type(screen.getByLabelText(/^username$/i), "admin");
        await user.type(screen.getByLabelText(/^password$/i), "wrong");
        await user.click(screen.getByRole("button", { name: /^log in$/i }));

        expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
    });

    it("toggles password visibility", async () => {
        const user = userEvent.setup();
        renderLogin();

        const passwordInput = screen.getByLabelText(/^password$/i);
        expect(passwordInput).toHaveAttribute("type", "password");

        await user.click(screen.getByRole("button", { name: /show/i }));
        expect(passwordInput).toHaveAttribute("type", "text");

        await user.click(screen.getByRole("button", { name: /hide/i }));
        expect(passwordInput).toHaveAttribute("type", "password");
    });
});

describe("RegisterPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        readAuthSessionMock.mockReturnValue(null);
    });

    const renderRegister = () => {
        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );
    };

    it("renders seeded account information", () => {
        renderRegister();

        expect(screen.getByRole("heading", { name: /accounts/i })).toBeInTheDocument();
        expect(screen.getByText(/seeded persisted accounts/i)).toBeInTheDocument();
        expect(screen.getByText(/admin123/i)).toBeInTheDocument();
        expect(screen.getByText(/user123/i)).toBeInTheDocument();
    });

    it("shows guidance for two-user chat testing", () => {
        renderRegister();
        expect(screen.getByText(/two separate browsers or devices/i)).toBeInTheDocument();
    });
});
