import { beforeEach, describe, expect, it } from "vitest";
import {
    clearAuthSession,
    hasPermission,
    isSessionExpired,
    readAuthSession,
    writeAuthSession,
} from "./authApi";

describe("authApi session helpers", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("writes and reads the auth session", () => {
        const session = {
            userId: 1,
            username: "admin",
            permissions: ["AUDIT_VIEW"],
            token: "abc",
            inactivityTimeoutSeconds: 900,
        };

        writeAuthSession(session);

        expect(readAuthSession()).toMatchObject(session);
    });

    it("clears the auth session", () => {
        writeAuthSession({ userId: 1, username: "admin", token: "abc", inactivityTimeoutSeconds: 900 });
        clearAuthSession();
        expect(readAuthSession()).toBeNull();
    });

    it("checks permissions safely", () => {
        expect(hasPermission({ permissions: ["CHAT_USE"] }, "CHAT_USE")).toBe(true);
        expect(hasPermission({ permissions: ["CHAT_USE"] }, "AUDIT_VIEW")).toBe(false);
        expect(hasPermission(null, "CHAT_USE")).toBe(false);
    });

    it("detects expired sessions", () => {
        expect(
            isSessionExpired({
                lastActivityAt: Date.now() - 10_000,
                inactivityTimeoutSeconds: 1,
            })
        ).toBe(true);
    });
});