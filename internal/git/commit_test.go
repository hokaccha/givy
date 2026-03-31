package git_test

import (
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/hokaccha/givy/internal/git"
)

func TestShowCommit(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	// Get the commit hash from feature/add-tests branch
	hash := gitOutput(t, repoPath, "rev-parse", "feature/add-tests")

	result, err := git.ShowCommit(repoPath, hash)
	if err != nil {
		t.Fatal(err)
	}

	if result.Commit.Hash != hash {
		t.Errorf("expected hash %q, got %q", hash, result.Commit.Hash)
	}
	if result.Commit.Subject != "Add tests and improve main" {
		t.Errorf("unexpected subject: %q", result.Commit.Subject)
	}
	if result.Commit.Author != "Test User" {
		t.Errorf("unexpected author: %q", result.Commit.Author)
	}
	if result.Commit.Date == "" {
		t.Error("expected non-empty date")
	}

	// Should have changes in src/main.go and src/main_test.go
	if len(result.Files) < 2 {
		t.Fatalf("expected at least 2 changed files, got %d", len(result.Files))
	}

	fileMap := make(map[string]git.DiffStat)
	for _, f := range result.Files {
		fileMap[f.Path] = f
	}

	if _, ok := fileMap["src/main.go"]; !ok {
		t.Error("expected src/main.go in diff files")
	}
	if _, ok := fileMap["src/main_test.go"]; !ok {
		t.Error("expected src/main_test.go in diff files")
	}

	// Stats should be consistent
	if result.Stats.Files != len(result.Files) {
		t.Errorf("stats.files=%d but len(files)=%d", result.Stats.Files, len(result.Files))
	}
	if result.Stats.Additions == 0 {
		t.Error("expected non-zero additions")
	}

	// Patch should be non-empty
	if result.Patch == "" {
		t.Error("patch should not be empty")
	}
}

func TestListCommits(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	commits, err := git.ListCommits(repoPath, "main", "feature/add-tests")
	if err != nil {
		t.Fatal(err)
	}

	if len(commits) != 1 {
		t.Fatalf("expected 1 commit, got %d", len(commits))
	}

	c := commits[0]
	if c.Subject != "Add tests and improve main" {
		t.Errorf("unexpected subject: %q", c.Subject)
	}
	if c.Author != "Test User" {
		t.Errorf("unexpected author: %q", c.Author)
	}
	if c.Hash == "" {
		t.Error("expected non-empty hash")
	}
	if c.Date == "" {
		t.Error("expected non-empty date")
	}
}

func TestListCommits_EmptyRange(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	// main..main should have no commits
	commits, err := git.ListCommits(repoPath, "main", "main")
	if err != nil {
		t.Fatal(err)
	}

	if commits != nil {
		t.Errorf("expected nil for empty range, got %d commits", len(commits))
	}
}

// gitOutput runs a git command and returns trimmed stdout.
func gitOutput(t *testing.T, repoPath string, args ...string) string {
	t.Helper()
	cmd := exec.Command("git", append([]string{"-C", repoPath}, args...)...)
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("git %v failed: %v", args, err)
	}
	return strings.TrimSpace(string(out))
}
