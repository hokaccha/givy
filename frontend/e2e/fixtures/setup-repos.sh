#!/bin/bash
# Creates test git repositories for E2E tests.
# Usage: ./setup-repos.sh <output_dir>
#
# Creates:
#   <output_dir>/testowner/testrepo/.git  (main + feature/add-tests branches)
#   <output_dir>/testowner/empty-repo/.git (empty repo for edge cases)

set -euo pipefail

OUTPUT_DIR="${1:?Usage: setup-repos.sh <output_dir>}"

# Clean and create output directory
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/testowner/testrepo"
mkdir -p "$OUTPUT_DIR/testowner/empty-repo"

# --- testrepo ---
cd "$OUTPUT_DIR/testowner/testrepo"
git init -b main
git config user.email "test@example.com"
git config user.name "Test User"

# Create initial files on main branch
cat > README.md << 'READMEEOF'
# Test Repository

This is a test repository for givy E2E tests.

## Features

- Markdown rendering
- Code viewing
- **Bold** and *italic* text

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |

- [x] Task 1
- [ ] Task 2

```go
fmt.Println("hello")
```
READMEEOF

mkdir -p src docs assets

cat > src/main.go << 'GOEOF'
package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}

func add(a, b int) int {
	return a + b
}
GOEOF

cat > src/utils.go << 'GOEOF'
package main

// Max returns the larger of two integers.
func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
GOEOF

cat > docs/guide.md << 'MDEOF'
# User Guide

## Getting Started

Follow these steps to get started with the project.

1. Clone the repository
2. Run `make dev`
3. Open http://localhost:6271
MDEOF

# Create a small PNG (1x1 pixel, red)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > assets/logo.png

# Create a binary file
printf '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f' > data.bin

git add -A
git commit -m "Initial commit: add project files"

# Create feature branch with changes
git checkout -b feature/add-tests

cat > src/main_test.go << 'GOEOF'
package main

import "testing"

func TestAdd(t *testing.T) {
	got := add(2, 3)
	if got != 5 {
		t.Errorf("add(2, 3) = %d, want 5", got)
	}
}
GOEOF

# Modify main.go on feature branch
cat > src/main.go << 'GOEOF'
package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) > 1 {
		fmt.Printf("Hello, %s!\n", os.Args[1])
	} else {
		fmt.Println("Hello, World!")
	}
}

func add(a, b int) int {
	return a + b
}
GOEOF

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
