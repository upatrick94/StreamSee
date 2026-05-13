import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    retries: 0,
    use: {
        baseURL: "http://127.0.0.1:4173",
        trace: "on-first-retry",
    },
    webServer: [
        {
            command: "mvn spring-boot:run",
            cwd: "../backend",
            url: "http://127.0.0.1:8080/api/playlists",
            reuseExistingServer: true,
            timeout: 120000,
        },
        {
            command: "npm run dev -- --host 127.0.0.1 --port 4173",
            cwd: ".",
            url: "http://127.0.0.1:4173",
            reuseExistingServer: true,
            timeout: 120000,
        },
    ],
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
