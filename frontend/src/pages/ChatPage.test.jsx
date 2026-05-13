import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../assets/StreamSeeLogo.svg", () => ({ default: "logo.svg" }));

const readAuthSessionMock = vi.fn();
const clearAuthSessionMock = vi.fn();
const hasPermissionMock = vi.fn(() => true);
const fetchChatMessagesApiMock = vi.fn();
const sendMock = vi.fn();
const disconnectMock = vi.fn();
const connectToChatRoomMock = vi.fn();

vi.mock("../api/authApi", () => ({
    readAuthSession: (...args) => readAuthSessionMock(...args),
    clearAuthSession: (...args) => clearAuthSessionMock(...args),
    hasPermission: (...args) => hasPermissionMock(...args),
}));

vi.mock("../api/chatApi", () => ({
    fetchChatMessagesApi: (...args) => fetchChatMessagesApiMock(...args),
}));

vi.mock("../services/chatLiveUpdates", () => ({
    connectToChatRoom: (...args) => connectToChatRoomMock(...args),
}));

import ChatPage from "./ChatPage";

describe("ChatPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        readAuthSessionMock.mockReturnValue({
            userId: 7,
            username: "user",
            displayName: "Normal User",
            roles: ["USER"],
            permissions: ["CHAT_USE"],
        });

        fetchChatMessagesApiMock.mockResolvedValue([
            {
                id: "m1",
                room: "global",
                userId: 2,
                username: "admin",
                content: "welcome",
                sentAt: "2026-05-04T10:00:00Z",
            },
        ]);

        connectToChatRoomMock.mockImplementation(({ onConnectionChange }) => {
            onConnectionChange?.(true);

            return {
                send: sendMock,
                disconnect: disconnectMock,
            };
        });
    });

    const renderPage = () => {
        render(
            <MemoryRouter>
                <ChatPage />
            </MemoryRouter>
        );
    };

    it("loads recent chat messages", async () => {
        renderPage();

        expect(fetchChatMessagesApiMock).toHaveBeenCalledWith("global");
        expect(await screen.findByText("welcome")).toBeInTheDocument();
        expect(screen.getByText(/logged in as/i)).toBeInTheDocument();
    });

    it("connects to the selected room", async () => {
        renderPage();

        await waitFor(() => {
            expect(connectToChatRoomMock).toHaveBeenCalled();
        });

        const firstCall = connectToChatRoomMock.mock.calls[0][0];
        expect(firstCall.room).toBe("global");
    });

    it("sends a websocket chat message", async () => {
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByPlaceholderText(/send a message/i), "hello room");
        await user.click(screen.getByRole("button", { name: /send/i }));

        expect(sendMock).toHaveBeenCalledWith({
            userId: 7,
            room: "global",
            content: "hello room",
        });
    });

    it("changes room and reloads messages", async () => {
        const user = userEvent.setup();
        renderPage();

        await user.selectOptions(screen.getByRole("combobox"), "music");

        await waitFor(() => {
            expect(fetchChatMessagesApiMock).toHaveBeenLastCalledWith("music");
        });
    });

    it("shows socket send errors", async () => {
        const user = userEvent.setup();
        sendMock.mockImplementation(() => {
            throw new Error("Chat connection is not ready yet.");
        });

        renderPage();

        await user.type(screen.getByPlaceholderText(/send a message/i), "test");
        await user.click(screen.getByRole("button", { name: /send/i }));

        expect(await screen.findByText(/chat connection is not ready yet/i)).toBeInTheDocument();
    });
});
