import { test, expect } from "@playwright/test";

test.describe("Repository List", () => {
  test("displays all repositories", async ({ page }) => {
    await page.goto("/");

    // Should show the repo list page
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Should list testowner/testrepo
    const repoLink = page.getByRole("link", { name: /testowner\/testrepo/ });
    await expect(repoLink).toBeVisible();
  });

  test("clicking a repo navigates to its tree view", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /testowner\/testrepo/ }).click();

    // Should navigate to the repo root (TreeView)
    await expect(page).toHaveURL(/\/testowner\/testrepo$/);
  });

  test("shows repo owner and name separately", async ({ page }) => {
    await page.goto("/");

    // Should display owner/repo format
    await expect(page.getByText("testowner/testrepo")).toBeVisible();
  });
});
