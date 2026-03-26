import { test, expect } from "@playwright/test";

test.describe("Review Comments", () => {
  const compareUrl =
    "/testowner/testrepo/compare/main...feature/add-tests";

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(compareUrl);
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("givy:")) {
          localStorage.removeItem(key);
        }
      }
    });
    await page.reload();
  });

  test("clicking line gutter opens comment form", async ({ page }) => {
    // Click a line number in the diff gutter
    await page.locator("[data-line='5'][data-side='right']").first().click();

    // Comment form should appear
    await expect(
      page.getByPlaceholder(/add a comment/i)
    ).toBeVisible();
  });

  test("submitting a comment shows it in the diff", async ({ page }) => {
    // Click line to open comment form
    await page.locator("[data-line='5'][data-side='right']").first().click();

    // Type and submit
    await page.getByPlaceholder(/add a comment/i).fill("This needs refactoring");
    await page.getByRole("button", { name: /submit/i }).click();

    // Comment should be visible
    await expect(page.getByText("This needs refactoring")).toBeVisible();
  });

  test("comments persist after page reload", async ({ page }) => {
    // Add a comment
    await page.locator("[data-line='5'][data-side='right']").first().click();
    await page.getByPlaceholder(/add a comment/i).fill("Persistent comment");
    await page.getByRole("button", { name: /submit/i }).click();
    await expect(page.getByText("Persistent comment")).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.getByText("Persistent comment")).toBeVisible();
  });

  test("can edit an existing comment", async ({ page }) => {
    // Add a comment
    await page.locator("[data-line='5'][data-side='right']").first().click();
    await page.getByPlaceholder(/add a comment/i).fill("Original text");
    await page.getByRole("button", { name: /submit/i }).click();

    // Edit the comment
    await page.getByRole("button", { name: /edit/i }).first().click();
    const editInput = page.getByRole("textbox").first();
    await editInput.clear();
    await editInput.fill("Updated text");
    await page.getByRole("button", { name: /save/i }).click();

    // Should show updated text
    await expect(page.getByText("Updated text")).toBeVisible();
    await expect(page.getByText("Original text")).not.toBeVisible();
  });

  test("can delete a comment", async ({ page }) => {
    // Add a comment
    await page.locator("[data-line='5'][data-side='right']").first().click();
    await page.getByPlaceholder(/add a comment/i).fill("To be deleted");
    await page.getByRole("button", { name: /submit/i }).click();
    await expect(page.getByText("To be deleted")).toBeVisible();

    // Delete the comment
    await page.getByRole("button", { name: /delete/i }).first().click();

    // Should be gone
    await expect(page.getByText("To be deleted")).not.toBeVisible();
  });

  test("can select a range of lines with shift+click", async ({ page }) => {
    // Click first line
    await page.locator("[data-line='5'][data-side='right']").first().click();

    // Shift+click last line to select range
    await page
      .locator("[data-line='10'][data-side='right']")
      .first()
      .click({ modifiers: ["Shift"] });

    // Comment form should show range indicator
    await expect(page.getByText(/lines 5-10/i)).toBeVisible();
  });

  test("Copy All Prompt includes all file comments", async ({ page }) => {
    // Add comments on different parts
    await page.locator("[data-line='5'][data-side='right']").first().click();
    await page.getByPlaceholder(/add a comment/i).fill("Comment on file 1");
    await page.getByRole("button", { name: /submit/i }).click();

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    // Click Copy All Prompt
    await page.getByRole("button", { name: /copy all/i }).click();

    // Check clipboard content includes all comments
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain("Comment on file 1");
  });
});
