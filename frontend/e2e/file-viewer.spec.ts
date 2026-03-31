import { test, expect } from "@playwright/test";

test.describe("File Viewer", () => {
  test("renders markdown file as formatted HTML", async ({ page }) => {
    await page.goto("/testowner/testrepo/blob/README.md");

    // Should render markdown heading
    await expect(
      page.getByRole("heading", { name: "Test Repository" })
    ).toBeVisible();

    // Should render bold text
    await expect(page.locator("strong", { hasText: "Bold" })).toBeVisible();
  });

  test("renders GFM features (tables, task lists)", async ({ page }) => {
    await page.goto("/testowner/testrepo/blob/README.md");

    // Should render table
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByText("Column A")).toBeVisible();

    // Should render task list checkboxes
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
  });

  test("shows syntax-highlighted code", async ({ page }) => {
    await page.goto("/testowner/testrepo/blob/src/main.go");

    // Should show file content
    await expect(page.getByText('fmt.Println("Hello, World!")')).toBeVisible();

    // Should show line numbers
    await expect(page.locator("[data-line-number]").first()).toBeVisible();
  });

  test("displays image inline", async ({ page }) => {
    await page.goto("/testowner/testrepo/blob/assets/logo.png");

    // Should show the image (not the logo in header)
    await expect(page.getByRole("img", { name: "logo.png" })).toBeVisible();
  });

  test("shows binary file message", async ({ page }) => {
    await page.goto("/testowner/testrepo/blob/data.bin");

    // Should show a message that the file is binary
    await expect(page.getByText(/binary/i)).toBeVisible();
  });
});
