#!/bin/bash
# Creates test git repositories for E2E tests.
# Usage: ./setup-repos.sh <output_dir>
#
# Creates:
#   <output_dir>/testowner/testrepo/.git  (main + feature/add-tests branches)
#   <output_dir>/testowner/empty-repo/.git (empty repo for edge cases)
#
# Text files live in content/ alongside this script so they are git-tracked
# and viewable on GitHub. Binary files are generated inline.

set -euo pipefail

OUTPUT_DIR="${1:?Usage: setup-repos.sh <output_dir>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTENT_DIR="$SCRIPT_DIR/content"

# Clean and create output directory
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/testowner/testrepo"
mkdir -p "$OUTPUT_DIR/testowner/empty-repo"

# --- testrepo ---
cd "$OUTPUT_DIR/testowner/testrepo"
git init -b main
git config user.email "test@example.com"
git config user.name "Test User"

# Copy main branch files from content/main/
cp -R "$CONTENT_DIR/main/." .

# Create binary files (not suitable for content/)
mkdir -p assets
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > assets/logo.png
printf '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f' > data.bin

git add -A
git commit -m "Initial commit: add project files"

# Create feature branch with changes
git checkout -b feature/add-tests

cp "$CONTENT_DIR/feature/src/main.go" src/main.go
cp "$CONTENT_DIR/feature/src/main_test.go" src/main_test.go

git add -A
git commit -m "Add tests and improve main function"

# Go back to main
git checkout main

# --- empty-repo ---
cd "$OUTPUT_DIR/testowner/empty-repo"
git init -b main
git config user.email "test@example.com"
git config user.name "Test User"

echo "Done. Test repos created in $OUTPUT_DIR"
