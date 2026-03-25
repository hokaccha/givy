# E2E Test Patterns with Playwright

## Setup

Tests use Playwright Test framework with automatic server management.
The `playwright.config.ts` `webServer` option starts givy before tests run.

```typescript
// playwright.config.ts
export default defineConfig({
  webServer: {
    command: 'cd .. && go run . serve ./frontend/e2e/fixtures/repos',
    port: 6271,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Fixture Lifecycle

1. `setup-repos.sh` runs as a global setup, creating test git repos in a temp dir
2. givy server starts, pointing at the fixture directory
3. Tests run against `http://localhost:6271`
4. Server stops, fixtures cleaned up

## Page Object Pattern

Each page has a helper object for common interactions:

```typescript
// e2e/helpers/repo-list.ts
export class RepoListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async getRepoLinks() {
    return this.page.getByRole('link', { name: /\// }).all();
  }

  async clickRepo(owner: string, name: string) {
    await this.page.getByRole('link', { name: `${owner}/${name}` }).click();
  }
}
```

## Assertions

Use Playwright's built-in assertions for auto-waiting:

```typescript
// Wait for element to appear and check text
await expect(page.getByRole('heading')).toHaveText('testrepo');

// Check URL after navigation
await expect(page).toHaveURL(/\/testowner\/testrepo\/tree\/main/);

// Check localStorage
const comments = await page.evaluate(() =>
  localStorage.getItem('givy:comments:testowner/testrepo:main...feature/add-tests:src/main.go')
);
expect(JSON.parse(comments!)).toHaveLength(1);
```

## Comment Testing

Testing the comment system requires interacting with diff line gutters:

```typescript
// Click a line number to open comment form
await page.locator('[data-line="10"][data-side="right"]').click();

// Type and submit
await page.getByPlaceholder('Add a comment...').fill('Fix this logic');
await page.getByRole('button', { name: 'Submit' }).click();

// Verify comment appears
await expect(page.getByText('Fix this logic')).toBeVisible();
```

## Range Selection

```typescript
// Select lines 10-15
await page.locator('[data-line="10"][data-side="right"]').click();
await page.locator('[data-line="15"][data-side="right"]').click({ modifiers: ['Shift'] });
```

## Copy Prompt Testing

```typescript
// Click "Copy Prompt" and check clipboard
await page.getByRole('button', { name: 'Copy Prompt' }).click();
const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
expect(clipboardText).toContain('src/main.go');
expect(clipboardText).toContain('Fix this logic');
```

## Screenshot Testing (Optional)

For visual regression of diff rendering:

```typescript
await expect(page.locator('.diff-viewer')).toHaveScreenshot('split-diff.png');
```

## Debugging Failed Tests

Use the playwright-cli skill for interactive debugging:

```bash
# Take a snapshot of the current page state
playwright-cli snapshot

# Take a screenshot
playwright-cli screenshot

# Start a trace for detailed debugging
playwright-cli trace start
# ... reproduce the issue ...
playwright-cli trace stop --output trace.zip
```
