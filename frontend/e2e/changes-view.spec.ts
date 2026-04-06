import { test, expect } from "@playwright/test";

test.describe("Changes View", () => {
  const changesUrl = "/testowner/testrepo/changes";
  const branchCompareUrl =
    "/testowner/testrepo/changes/main...feature/add-tests";

  test("shows Unstaged and Staged tabs", async ({ page }) => {
    await page.goto(changesUrl);

    await expect(
      page.getByRole("button", { name: "Unstaged", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Staged", exact: true })
    ).toBeVisible();
  });

  test("Unstaged tab is active by default", async ({ page }) => {
    await page.goto(changesUrl);

    const unstagedBtn = page.getByRole("button", {
      name: "Unstaged",
      exact: true,
    });
    // Active tab has blue background
    await expect(unstagedBtn).toHaveCSS(
      "background-color",
      "rgb(9, 105, 218)"
    );
  });

  test("can switch to Staged tab", async ({ page }) => {
    await page.goto(changesUrl);

    await page
      .getByRole("button", { name: "Staged", exact: true })
      .click();

    await expect(page).toHaveURL(/\/@staged/);
    const stagedBtn = page.getByRole("button", {
      name: "Staged",
      exact: true,
    });
    await expect(stagedBtn).toHaveCSS("background-color", "rgb(9, 105, 218)");
  });

  test("shows no changes message for clean working directory", async ({
    page,
  }) => {
    await page.goto(changesUrl);

    await expect(page.getByText("No changes.")).toBeVisible();
  });

  test("branch compare shows diff", async ({ page }) => {
    await page.goto(branchCompareUrl);

    // Should show changed files in file list
    await expect(
      page.getByTestId("file-list").getByRole("link", { name: "src/main.go" })
    ).toBeVisible();
    await expect(
      page
        .getByTestId("file-list")
        .getByRole("link", { name: "src/main_test.go" })
    ).toBeVisible();

    // Should show diff content
    await expect(page.locator(".diff-line-add").first()).toBeVisible();
  });

  test("branch compare shows View commits link", async ({ page }) => {
    await page.goto(branchCompareUrl);

    const link = page.getByText("View commits");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      "/testowner/testrepo/commits/main...feature/add-tests"
    );
  });

  test("branch selector shows branches", async ({ page }) => {
    await page.goto(changesUrl);

    // Click the base branch selector (first branch button with "main" text)
    const branchButtons = page.locator("button", {
      has: page.locator("svg"),
      hasText: "main",
    });
    await branchButtons.first().click();

    // Should show the dropdown with branch list
    await expect(page.getByText("Switch branches")).toBeVisible();
    await expect(page.getByText("feature/add-tests")).toBeVisible();
  });

  test("can select branches and compare", async ({ page }) => {
    await page.goto(changesUrl);

    // Open the compare (head) branch selector
    await page.getByText("select branch").click();

    // Select feature/add-tests branch
    await page.getByText("feature/add-tests").click();

    // Click Compare button
    await page.getByRole("button", { name: "Compare" }).click();

    // Should navigate to the branch compare URL
    await expect(page).toHaveURL(
      /\/testowner\/testrepo\/changes\/main\.\.\.feature\/add-tests/
    );

    // Should show diff content
    await expect(page.locator(".diff-line-add").first()).toBeVisible();
  });
});
