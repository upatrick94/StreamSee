import { test, expect } from "@playwright/test";

test.describe("StreamSee end-to-end flows", () => {
    test("user can create a playlist and gets redirected to edit page", async ({ page }) => {
        await page.goto("/home");

        await page.getByRole("button", { name: "Toggle playlist section" }).click();
        await page.getByRole("button", { name: "Create Playlist" }).click();

        await expect(page.getByRole("heading", { name: "Create Playlist" })).toBeVisible();

        await page.getByLabel("Playlist name").fill("Playwright Playlist");
        await page.getByLabel("Created by").fill("E2E Tester");
        await page.getByLabel("Description").fill("Playlist created by Playwright.");
        await page.getByLabel("Genres (comma separated)").fill("Pop, EDM");

        const songTitleInputs = page.getByPlaceholder("Song title");
        const artistInputs = page.getByPlaceholder("Artist");
        const durationInputs = page.getByPlaceholder("Duration (mm:ss)");

        await songTitleInputs.nth(0).fill("First Song");
        await artistInputs.nth(0).fill("Artist One");
        await durationInputs.nth(0).fill("03:10");

        await songTitleInputs.nth(1).fill("Second Song");
        await artistInputs.nth(1).fill("Artist Two");
        await durationInputs.nth(1).fill("02:45");

        await songTitleInputs.nth(2).fill("Third Song");
        await artistInputs.nth(2).fill("Artist Three");
        await durationInputs.nth(2).fill("04:00");

        await page.getByRole("button", { name: "Create playlist" }).click();

        await expect(page).toHaveURL(/\/playlists\/\d+\/edit$/);
        await expect(page.getByRole("heading", { name: "Edit Playlist" })).toBeVisible();
        await expect(page.getByLabel("Playlist name")).toHaveValue("Playwright Playlist");
        await expect(page.getByLabel("Created by")).toHaveValue("E2E Tester");
    });

    test("user can add a recommended playlist into their own playlists", async ({ page }) => {
        await page.goto("/recommended");

        await expect(
            page.getByRole("heading", { name: "Recommended playlists for you" })
        ).toBeVisible();

        const firstCard = page.locator(".expanded-playlist-card").first();
        const addedPlaylistName = (await firstCard.locator(".expanded-playlist-title").textContent())?.trim();

        await expect(firstCard).toBeVisible();
        await firstCard.getByRole("button", { name: "Add playlist" }).click();

        if (addedPlaylistName) {
            await expect(page.getByText(addedPlaylistName)).not.toBeVisible();
        }

        await page.getByRole("link", { name: "Home" }).click();
        await expect(page).toHaveURL(/\/home$/);

        await page.getByRole("button", { name: "Toggle playlist section" }).click();

        const paginationButtons = page.locator(".pagination-page");
        const paginationCount = await paginationButtons.count();

        if (paginationCount > 0) {
            await paginationButtons.last().click();
        }

        if (addedPlaylistName) {
            await expect(page.getByText(addedPlaylistName)).toBeVisible();
        }
    });

    test("user can use stats split view and simulation updates the numbers", async ({ page }) => {
        await page.goto("/stats");

        await expect(page.getByRole("heading", { name: "Playlist Statistics" })).toBeVisible();

        await page.getByRole("button", { name: "Split View" }).click();
        await expect(page.getByRole("button", { name: "Start Simulation" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Stop Simulation" })).toBeVisible();

        const statsSummary = page.getByText(/You have listened to \d+ minutes of music/).first();
        const beforeText = await statsSummary.textContent();

        await page.getByRole("button", { name: "Start Simulation" }).click();
        await page.waitForTimeout(1500);

        const afterText = await statsSummary.textContent();
        expect(afterText).not.toBe(beforeText);

        await page.getByRole("button", { name: "Table View" }).last().click();
        await expect(page.getByRole("heading", { name: "Most listened playlists" }).first()).toBeVisible();

        await page.getByRole("button", { name: "Chart View" }).last().click();
        await expect(page.locator(".stats-pie")).toBeVisible();

        await page.getByRole("button", { name: "Stop Simulation" }).click();
    });
});