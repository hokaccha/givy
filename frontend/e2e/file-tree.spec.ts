import { test, expect } from "@playwright/test";

test.describe("File Tree", () => {
  test("shows files and directories at repo root", async ({ page }) => {
    await page.goto("/testowner/testrepo");

    // Should show directories
    await expect(page.getByRole("link", { name: "src" })).toBeVisible();
    await expect(page.getByRole("link", { name: "docs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "assets" })).toBeVisible();

    // Should show files
    await expect(page.getByRole("link", { name: "README.md" })).toBeVisible();
    await expect(page.getByRole("link", { name: "data.bin" })).toBeVisible();
  });

  test("clicking a directory shows its contents", async ({ page }) => {
    await page.goto("/testowner/testrepo");

    await page.getByRole("link", { name: "src" }).click();

    await expect(page).toHaveURL(/\/testowner\/testrepo\/tree\/src/);
    await expect(page.getByRole("link", { name: "main.go" })).toBeVisible();
    await expect(page.getByRole("link", { name: "utils.go" })).toBeVisible();
  });

  test("breadcrumb navigation works", async ({ page }) => {
    await page.goto("/testowner/testrepo/tree/src");

    // Breadcrumb should show repo name as a link
    const repoLink = page.getByRole("link", { name: "testrepo" });
    await expect(repoLink).toBeVisible();

    // Click repo name to go back to root
    await repoLink.click();
    await expect(page).toHaveURL(/\/testowner\/testrepo$/);
  });

  test("directories are listed before files", async ({ page }) => {
    await page.goto("/testowner/testrepo");

    // Get all row links in the file tree table
    const rows = page.locator("table tbody tr");
    const allText = await rows.allTextContents();

    // Find positions of a known directory and file
    const srcIdx = allText.findIndex((t) => t.includes("src"));
    const readmeIdx = allText.findIndex((t) => t.includes("README.md"));

    expect(srcIdx).toBeGreaterThanOrEqual(0);
    expect(readmeIdx).toBeGreaterThanOrEqual(0);
    expect(srcIdx).toBeLessThan(readmeIdx);
  });
});
