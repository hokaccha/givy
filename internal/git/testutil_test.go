package git_test

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// createTestRepo creates a temporary git repository with known content for testing.
// It returns the path to the root directory containing owner/repo structure.
// The repo is at <root>/testowner/testrepo.
func createTestRepo(t *testing.T) string {
	t.Helper()

	root := t.TempDir()
	repoDir := filepath.Join(root, "testowner", "testrepo")
	if err := os.MkdirAll(repoDir, 0o755); err != nil {
		t.Fatal(err)
	}

	run := func(args ...string) {
		t.Helper()
		cmd := exec.Command("git", append([]string{"-C", repoDir}, args...)...)
		cmd.Env = append(os.Environ(),
			"GIT_AUTHOR_NAME=Test User",
			"GIT_AUTHOR_EMAIL=test@example.com",
			"GIT_COMMITTER_NAME=Test User",
			"GIT_COMMITTER_EMAIL=test@example.com",
		)
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("git %v failed: %v\n%s", args, err, out)
		}
	}

	writeFile := func(relPath, content string) {
		t.Helper()
		absPath := filepath.Join(repoDir, relPath)
		if err := os.MkdirAll(filepath.Dir(absPath), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(absPath, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	writeBinary := func(relPath string, data []byte) {
		t.Helper()
		absPath := filepath.Join(repoDir, relPath)
		if err := os.MkdirAll(filepath.Dir(absPath), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(absPath, data, 0o644); err != nil {
			t.Fatal(err)
		}
	}

	// Initialize repo
	run("init", "-b", "main")

	// Create files on main branch
	writeFile("README.md", "# Test Repository\n\nHello world.\n")
	writeFile("src/main.go", `package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}

func add(a, b int) int {
	return a + b
}
`)
	writeFile("src/utils.go", `package main

func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
`)
	writeFile("docs/guide.md", "# Guide\n\nGetting started.\n")

	// Write a binary file
	writeBinary("data.bin", []byte{0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE})

	run("add", "-A")
	run("commit", "-m", "Initial commit")

	// Create feature branch
	run("checkout", "-b", "feature/add-tests")

	writeFile("src/main_test.go", `package main

import "testing"

func TestAdd(t *testing.T) {
	got := add(2, 3)
	if got != 5 {
		t.Errorf("add(2, 3) = %d, want 5", got)
	}
}
`)
	writeFile("src/main.go", `package main

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
`)

	run("add", "-A")
	run("commit", "-m", "Add tests and improve main")

	// Go back to main
	run("checkout", "main")

	return root
}
