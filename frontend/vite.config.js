import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const certPath = fileURLToPath(new URL("./localhost+3.pem", import.meta.url));
const keyPath = fileURLToPath(new URL("./localhost+3-key.pem", import.meta.url));
const httpsConfig =
    fs.existsSync(certPath) && fs.existsSync(keyPath)
        ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        }
        : undefined;

export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 5173,
        https: httpsConfig,
    },
    preview: {
        host: "0.0.0.0",
        port: 4173,
        https: httpsConfig,
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/test/setup.js",
        css: true,
        include: ["src/**/*.{test,spec}.{js,jsx}"],
        exclude: ["tests/**", "node_modules/**"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
        },
    },
});
