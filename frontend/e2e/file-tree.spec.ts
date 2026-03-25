import { test, expect } from "@playwright/test";

test.describe("File Tree", () => {
  test("shows files and directories at repo root", async ({ page }) => {
    await page.goto("/testowner/testrepo/tree/main");

    // Should show directories
    await expect(page.getByRole("link", { name: "src" })).toBeVisible();
    await expect(page.getByRole("link", { name: "docs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "assets" })).toBeVisible();

    // Should show files
    await expect(page.getByRole("link", { name: "README.md" })).toBeVisible();
    await expect(page.getByRole("link", { name: "data.bin" })).toBeVisible();
  });

  test("clicking a directory shows its contents", async ({ page }) => {
    await page.goto("/testowner/testrepo/tree/main");

    await page.getByRole("link", { name: "src" }).click();

    await expect(page).toHaveURL(/\/testowner\/testrepo\/tree\/main\/src/);
    await expect(page.getByRole("link", { name: "main.go" })).toBeVisible();
    await expect(page.getByRole("link", { name: "utils.go" })).toBeVisible();
  });

  test("breadcrumb navigation works", async ({ page }) => {
    await page.goto("/testowner/testrepo/tree/main/src");

    // Breadcrumb should show repo name as a link
    const repoLink = page.getByRole("link", { name: "testrepo" });
    await expect(repoLink).toBeVisible();

    // Click repo name to go back to root
    await repoLink.click();
    await expect(page).toHaveURL(/\/testowner\/testrepo\/tree\/main$/);
  });

  test("branch selector lists available branches", async ({ page }) => {
    await page.goto("/testowner/testrepo/tree/main");

    // Open branch selector
    const branchSelector = page.getByRole("button", { name: /main/ });
    await expect(branchSelector).toBeVisible();
    await branchSelector.click();

    // Should show feature branch
    await expect(
      page.getByRole("option", { name: /feature\/add-tests/ })
    ).toBeVisible();
  });

  test("switching branch updates file tree", async ({ page }) => {
    await page.goto("/testowner/testrepo/tree/main/src");

    // Switch to feature branch
    const branchSelector = page.getByRole("button", { name: /main/ });
    await branchSelector.click();
    await page
      .getByRole("option", { name: /feature\/add-tests/ })
      .click();

    // Feature branch should have main_test.go
    await expect(page).toHaveURL(
      /\/testowner\/testrepo\/tree\/feature\/add-tests/
    );
    await expect(
      page.getByRole("link", { name: "main_test.go" })
    ).toBeVisible();
  });
});
