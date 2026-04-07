package cmd

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func createTestRepoForReview(t *testing.T) (rootDir, repoDir string) {
	t.Helper()
	rootDir = t.TempDir()
	repoDir = filepath.Join(rootDir, "testowner", "testrepo")
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

	run("init", "-b", "main")
	if err := os.WriteFile(filepath.Join(repoDir, "README.md"), []byte("# Test\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	run("add", "-A")
	run("commit", "-m", "Initial commit")
	run("checkout", "-b", "feature/test-branch")
	if err := os.WriteFile(filepath.Join(repoDir, "new.txt"), []byte("new file\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	run("add", "-A")
	run("commit", "-m", "Add new file")

	return rootDir, repoDir
}

func TestResolveCompareSpec_ExplicitBaseHead(t *testing.T) {
	_, repoDir := createTestRepoForReview(t)

	base, head, err := resolveCompareSpec(repoDir, []string{"main...feature/test-branch"})
	if err != nil {
		t.Fatal(err)
	}
	if base != "main" {
		t.Errorf("expected base 'main', got %q", base)
	}
	if head != "feature/test-branch" {
		t.Errorf("expected head 'feature/test-branch', got %q", head)
	}
}

func TestResolveCompareSpec_SingleBranch(t *testing.T) {
	_, repoDir := createTestRepoForReview(t)

	base, head, err := resolveCompareSpec(repoDir, []string{"feature/test-branch"})
	if err != nil {
		t.Fatal(err)
	}
	if base != "main" {
		t.Errorf("expected base 'main', got %q", base)
	}
	if head != "feature/test-branch" {
		t.Errorf("expected head 'feature/test-branch', got %q", head)
	}
}


func TestResolveCompareSpec_InvalidSpec(t *testing.T) {
	_, repoDir := createTestRepoForReview(t)

	_, _, err := resolveCompareSpec(repoDir, []string{"...head"})
	if err == nil {
		t.Fatal("expected error for invalid spec")
	}
}
