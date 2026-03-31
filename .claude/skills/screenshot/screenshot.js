#!/usr/bin/env node

// Usage: node scripts/screenshot.js [url-path] [options]
//
// Takes a screenshot of the running dev server.
//
// Examples:
//   node scripts/screenshot.js /hokaccha/givy
//   node scripts/screenshot.js /hokaccha/givy/compare/test...main --split
//   node scripts/screenshot.js /hokaccha/givy --clip 0,100,1280,400
//   node scripts/screenshot.js /hokaccha/givy --full
//   node scripts/screenshot.js /hokaccha/givy --out /tmp/my-screenshot.png

const path = require("path");

// Resolve @playwright/test from frontend/node_modules regardless of script location
const frontendDir = path.resolve(__dirname, "../../../frontend");
const { chromium } = require(
  require.resolve("@playwright/test", { paths: [frontendDir] })
);

const args = process.argv.slice(2);
const urlPath = args.find((a) => !a.startsWith("--")) || "/";
const fullPage = args.includes("--full");
const splitView = args.includes("--split");

const clipArg = args.find((a) => a.startsWith("--clip="));
const clip = clipArg
  ? (() => {
      const [x, y, w, h] = clipArg.replace("--clip=", "").split(",").map(Number);
      return { x, y, width: w, height: h };
    })()
  : null;

const outArg = args.find((a) => a.startsWith("--out="));
const outPath = outArg
  ? outArg.replace("--out=", "")
  : `/tmp/givy-screenshot-${Date.now()}.png`;

const port = process.env.PORT || "5174";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const url = `http://localhost:${port}${urlPath}`;
  console.log(`Navigating to ${url}`);
  await page.goto(url);
  await page.waitForLoadState("networkidle");

  if (splitView) {
    const splitBtn = page.locator('button:text("Split")');
    if ((await splitBtn.count()) > 0) {
      await splitBtn.click();
      await page.waitForTimeout(300);
    }
  }

  const screenshotOpts = { path: outPath };
  if (fullPage) screenshotOpts.fullPage = true;
  if (clip) screenshotOpts.clip = clip;

  await page.screenshot(screenshotOpts);
  console.log(`Screenshot saved to ${outPath}`);

  await browser.close();
})();
