package git_test

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/hokaccha/givy/internal/git"
)

func TestDiscoverRepos(t *testing.T) {
	root := createTestRepo(t)

	repos, err := git.DiscoverRepos(root, "")
	if err != nil {
		t.Fatal(err)
	}

	if len(repos) != 1 {
		t.Fatalf("expected 1 repo, got %d", len(repos))
	}

	repo := repos[0]
	if repo.Owner != "testowner" {
		t.Errorf("expected owner 'testowner', got %q", repo.Owner)
	}
	if repo.Name != "testrepo" {
		t.Errorf("expected name 'testrepo', got %q", repo.Name)
	}
}

func TestDiscoverRepos_IgnoresNonGitDirs(t *testing.T) {
	root := t.TempDir()

	// Create a directory without .git
	if err := os.MkdirAll(filepath.Join(root, "owner", "notarepo"), 0o755); err != nil {
		t.Fatal(err)
	}

	repos, err := git.DiscoverRepos(root, "")
	if err != nil {
		t.Fatal(err)
	}

	if len(repos) != 0 {
		t.Fatalf("expected 0 repos, got %d", len(repos))
	}
}

func TestDiscoverRepos_IgnoresDotDirs(t *testing.T) {
	root := t.TempDir()

	// Create a hidden owner directory
	if err := os.MkdirAll(filepath.Join(root, ".hidden", "repo", ".git"), 0o755); err != nil {
		t.Fatal(err)
	}

	repos, err := git.DiscoverRepos(root, "")
	if err != nil {
		t.Fatal(err)
	}

	if len(repos) != 0 {
		t.Fatalf("expected 0 repos, got %d", len(repos))
	}
}

func TestDiscoverRepos_MultipleRepos(t *testing.T) {
	root := createTestRepo(t)

	// Create a second repo
	secondRepo := filepath.Join(root, "anotherowner", "anotherrepo")
	if err := os.MkdirAll(secondRepo, 0o755); err != nil {
		t.Fatal(err)
	}

	// Initialize it as a git repo
	run := func(args ...string) {
		t.Helper()
		cmd := exec.Command("git", append([]string{"-C", secondRepo}, args...)...)
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("git %v: %v\n%s", args, err, out)
		}
	}
	run("init", "-b", "main")
	run("config", "user.email", "test@example.com")
	run("config", "user.name", "Test User")

	repos, err := git.DiscoverRepos(root, "")
	if err != nil {
		t.Fatal(err)
	}

	if len(repos) != 2 {
		t.Fatalf("expected 2 repos, got %d", len(repos))
	}

	// Should be sorted: anotherowner/anotherrepo before testowner/testrepo
	if repos[0].Owner != "anotherowner" {
		t.Errorf("expected first repo owner 'anotherowner', got %q", repos[0].Owner)
	}
}

func TestRepoPath(t *testing.T) {
	path := git.RepoPath("/root", "owner", "repo")
	if path != "/root/owner/repo" {
		t.Errorf("expected '/root/owner/repo', got %q", path)
	}
}
