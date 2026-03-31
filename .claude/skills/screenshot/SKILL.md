---
name: screenshot
description: Take a screenshot of the running dev server to visually verify UI changes. Use when you need to check layout, colors, or visual regressions.
allowed-tools: Bash(node *), Read
argument-hint: "<url-path> [--split] [--full] [--clip=x,y,w,h] [--out=path]"
---

# Screenshot Skill

Take screenshots of the givy dev server using Playwright.

## Prerequisites

The dev server must be running. Start it with `make dev` or manually:
- Backend: `./givy serve --dev <root-dir>`
- Frontend: `cd frontend && pnpm dev`

The frontend Vite server typically runs on port 5174 (or 5173).

## Usage

Run the screenshot script from the project root:

```bash
node /Users/hokaccha/local/src/github.com/hokaccha/givy/.claude/skills/screenshot/screenshot.js $ARGUMENTS
```

## Arguments

- First non-flag argument: URL path (e.g. `/hokaccha/givy/compare/base...head`)
- `--split`: Click the "Split" button before taking the screenshot (for diff views)
- `--full`: Capture full page
- `--clip=x,y,w,h`: Capture a specific region
- `--out=path`: Output file path (default: `/tmp/givy-screenshot-<timestamp>.png`)

## Examples

```bash
# Screenshot repo root
node .claude/skills/screenshot/screenshot.js /hokaccha/givy

# Screenshot diff in split view
node .claude/skills/screenshot/screenshot.js /hokaccha/givy/compare/test...main --split

# Screenshot with clipping
node .claude/skills/screenshot/screenshot.js /hokaccha/givy --clip=0,100,1280,400
```

## After taking the screenshot

Always read the output PNG file with the Read tool to visually inspect it.
