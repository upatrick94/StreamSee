import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 5173,
    },
    preview: {
        host: "0.0.0.0",
        port: 4173,
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
