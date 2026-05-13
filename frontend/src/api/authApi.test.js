import { beforeEach, describe, expect, it } from "vitest";
import {
    clearAuthSession,
    hasPermission,
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
        };

        writeAuthSession(session);

        expect(readAuthSession()).toEqual(session);
    });

    it("clears the auth session", () => {
        writeAuthSession({ userId: 1, username: "admin" });
        clearAuthSession();
        expect(readAuthSession()).toBeNull();
    });

    it("checks permissions safely", () => {
        expect(hasPermission({ permissions: ["CHAT_USE"] }, "CHAT_USE")).toBe(true);
        expect(hasPermission({ permissions: ["CHAT_USE"] }, "AUDIT_VIEW")).toBe(false);
        expect(hasPermission(null, "CHAT_USE")).toBe(false);
    });
});
