import { test, expect } from "@playwright/test";

test.describe("Diff View", () => {
  const compareUrl =
    "/testowner/testrepo/compare/main...feature/add-tests";

  test("shows list of changed files", async ({ page }) => {
    await page.goto(compareUrl);

    // Should show changed files in the file list
    const fileList = page.locator("[data-testid='file-list']");
    await expect(fileList.getByText("src/main.go")).toBeVisible();
    await expect(fileList.getByText("src/main_test.go")).toBeVisible();
  });

  test("shows addition and deletion stats", async ({ page }) => {
    await page.goto(compareUrl);

    // Should show stats (additions/deletions indicators)
    const statsArea = page.locator("[data-testid='diff-stats']");
    await expect(statsArea).toBeVisible();
  });

  test("renders unified diff by default", async ({ page }) => {
    await page.goto(compareUrl);

    // Should have a unified diff layout by default
    await expect(
      page.locator("[data-testid='diff-unified']").first()
    ).toBeVisible();
  });

  test("can toggle to split diff", async ({ page }) => {
    await page.goto(compareUrl);

    // Click split view toggle
    await page.getByRole("button", { name: /split/i }).click();

    // Should show split diff layout
    await expect(
      page.locator("[data-testid='diff-split']").first()
    ).toBeVisible();
  });

  test("shows correct line numbers in diff", async ({ page }) => {
    await page.goto(compareUrl);

    // Diff should have line number elements
    await expect(page.locator("[data-line]").first()).toBeVisible();
  });

  test("highlights added lines in green and removed in red", async ({
    page,
  }) => {
    await page.goto(compareUrl);

    // Added lines should have addition styling
    const addedLine = page.locator(".diff-line-add").first();
    await expect(addedLine).toBeVisible();

    // Removed lines should have deletion styling
    const removedLine = page.locator(".diff-line-remove").first();
    await expect(removedLine).toBeVisible();
  });

  test("clicking a file in the list jumps to its diff", async ({ page }) => {
    await page.goto(compareUrl);

    // Click on a file name in the file list
    await page
      .locator("[data-testid='file-list']")
      .getByText("src/main.go")
      .click();

    // The diff for that file should be visible/scrolled to
    await expect(
      page.locator("[data-testid='diff-file-src/main.go']")
    ).toBeInViewport();
  });
});
