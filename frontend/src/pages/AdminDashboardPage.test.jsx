import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));

const readAuthSessionMock = vi.fn();
const clearAuthSessionMock = vi.fn();
const hasPermissionMock = vi.fn(() => true);
const fetchAuditLogsApiMock = vi.fn();
const fetchObservationListApiMock = vi.fn();

vi.mock("../api/authApi", () => ({
    readAuthSession: (...args) => readAuthSessionMock(...args),
    clearAuthSession: (...args) => clearAuthSessionMock(...args),
    hasPermission: (...args) => hasPermissionMock(...args),
}));

vi.mock("../api/adminApi", () => ({
    fetchAuditLogsApi: (...args) => fetchAuditLogsApiMock(...args),
    fetchObservationListApi: (...args) => fetchObservationListApiMock(...args),
}));

import AdminDashboardPage from "./AdminDashboardPage";

describe("AdminDashboardPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        readAuthSessionMock.mockReturnValue({
            userId: 1,
            username: "admin",
            displayName: "Administrator",
            roles: ["ADMIN"],
            permissions: ["AUDIT_VIEW", "OBSERVATION_VIEW"],
        });

        fetchAuditLogsApiMock.mockResolvedValue([
            {
                id: 10,
                userId: 1,
                username: "admin",
                groupName: "ADMIN",
                actionInformation: "DELETE_PLAYLIST id=2",
                timestamp: "2026-05-04T10:15:00Z",
                suspicious: true,
            },
        ]);

        fetchObservationListApiMock.mockResolvedValue([
            {
                userId: 1,
                username: "admin",
                reason: "Repeated DELETE_PLAYLIST",
                evidenceCount: 3,
                firstDetectedAt: "2026-05-04T10:00:00Z",
                lastDetectedAt: "2026-05-04T10:15:00Z",
            },
        ]);
    });

    it("renders audit logs and observation entries", async () => {
        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        expect(await screen.findByRole("heading", { name: /admin dashboard/i })).toBeInTheDocument();
        expect(screen.getByText(/repeated delete_playlist/i)).toBeInTheDocument();
        expect(screen.getByText(/delete_playlist id=2/i)).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "Suspicious" })).toBeInTheDocument();
    });

    it("shows an error when admin data fails to load", async () => {
        fetchAuditLogsApiMock.mockRejectedValueOnce(new Error("Could not load admin dashboard."));

        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        expect(await screen.findByText(/could not load admin dashboard/i)).toBeInTheDocument();
    });

    it("shows empty observation state", async () => {
        fetchObservationListApiMock.mockResolvedValueOnce([]);

        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        expect(await screen.findByText(/no suspicious users detected/i)).toBeInTheDocument();
    });
});
