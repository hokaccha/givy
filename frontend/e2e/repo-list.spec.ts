import { test, expect } from "@playwright/test";

test.describe("Repository List", () => {
  test("shows empty state initially with search input focused", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();

    // No repos shown before typing
    await expect(page.getByRole("link", { name: /testowner/ })).not.toBeVisible();
  });

  test("typing in search shows matching repos", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder(/search/i).fill("test");

    // Should list testowner/testrepo
    const repoLink = page.getByRole("link", { name: /testowner\/testrepo/ });
    await expect(repoLink).toBeVisible();
  });

  test("clicking a repo navigates to its tree view", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder(/search/i).fill("test");
    await page.getByRole("link", { name: /testowner\/testrepo/ }).click();

    await expect(page).toHaveURL(/\/testowner\/testrepo$/);
  });

  test("non-matching search shows no results", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder(/search/i).fill("nonexistent-xyz");

    await expect(page.getByText(/no repositories found/i)).toBeVisible();
  });
});
