import { test, expect } from "@playwright/test";

test.describe("Commit View", () => {
  const commitsUrl =
    "/testowner/testrepo/commits/main...feature/add-tests";

  test("shows list of commits between two refs", async ({ page }) => {
    await page.goto(commitsUrl);

    // Should show the commit subject
    await expect(
      page.getByText("Add tests and improve main function")
    ).toBeVisible();
  });

  test("shows commit metadata", async ({ page }) => {
    await page.goto(commitsUrl);

    // Should show author
    await expect(page.getByText("Test User")).toBeVisible();
  });

  test("shows no commits message for empty range", async ({ page }) => {
    await page.goto("/testowner/testrepo/commits/main...main");

    await expect(page.getByText("No commits found.")).toBeVisible();
  });

  test("clicking commit navigates to commit detail", async ({ page }) => {
    await page.goto(commitsUrl);

    // Click the commit subject link
    await page
      .getByText("Add tests and improve main function")
      .first()
      .click();

    // Should navigate to the commit detail page
    await expect(page).toHaveURL(/\/testowner\/testrepo\/commit\/[a-f0-9]+/);
  });

  test("commit detail shows diff", async ({ page }) => {
    await page.goto(commitsUrl);

    // Navigate to commit detail
    await page
      .getByText("Add tests and improve main function")
      .first()
      .click();

    // Should show the commit subject
    await expect(
      page.getByText("Add tests and improve main function")
    ).toBeVisible();

    // Should show changed files in the diff
    await expect(
      page.getByRole("link", { name: "src/main.go" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "src/main_test.go" })
    ).toBeVisible();

    // Should show diff stats
    await expect(page.locator("[data-testid='diff-stats']")).toBeVisible();
  });

  test("commit detail shows added and removed lines", async ({ page }) => {
    await page.goto(commitsUrl);

    // Navigate to commit detail
    await page
      .getByText("Add tests and improve main function")
      .first()
      .click();

    // Should have diff content with added/removed lines
    await expect(page.locator(".diff-line-add").first()).toBeVisible();
  });
});
