package cmd

import (
	"os"
	"path/filepath"
	"testing"
)

func TestIsCommitHash(t *testing.T) {
	tests := []struct {
		input string
		want  bool
	}{
		{"abc1234", true},
		{"ABC1234", true},
		{"0123456789abcdef0123456789abcdef01234567", true},
		{".", false},
		{"abc123", false},   // too short
		{"main", false},     // non-hex
		{"abc1234z", false}, // non-hex character
	}
	for _, tt := range tests {
		if got := isCommitHash(tt.input); got != tt.want {
			t.Errorf("isCommitHash(%q) = %v, want %v", tt.input, got, tt.want)
		}
	}
}

func TestFindRepoRoot(t *testing.T) {
	root := t.TempDir()
	repoDir := filepath.Join(root, "owner", "repo")
	nested := filepath.Join(repoDir, "internal", "pkg")
	if err := os.MkdirAll(filepath.Join(repoDir, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatal(err)
	}

	got, err := findRepoRoot(nested)
	if err != nil {
		t.Fatal(err)
	}
	if got != repoDir {
		t.Errorf("findRepoRoot(%q) = %q, want %q", nested, got, repoDir)
	}

	got, err = findRepoRoot(repoDir)
	if err != nil {
		t.Fatal(err)
	}
	if got != repoDir {
		t.Errorf("findRepoRoot(%q) = %q, want %q", repoDir, got, repoDir)
	}
}

func TestFindRepoRoot_NotARepo(t *testing.T) {
	dir := t.TempDir()
	if _, err := findRepoRoot(dir); err == nil {
		t.Fatal("expected error outside a git repository")
	}
}

func TestDeriveRootDir_FromEnv(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("GIVY_ROOT_DIR", dir)

	got, err := deriveRootDir()
	if err != nil {
		t.Fatal(err)
	}
	if got != dir {
		t.Errorf("deriveRootDir() = %q, want %q", got, dir)
	}
}

func TestDeriveRootDir_FromRepoLayout(t *testing.T) {
	t.Setenv("GIVY_ROOT_DIR", "")
	root := t.TempDir()
	repoDir := filepath.Join(root, "owner", "repo")
	if err := os.MkdirAll(filepath.Join(repoDir, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}
	t.Chdir(repoDir)

	got, err := deriveRootDir()
	if err != nil {
		t.Fatal(err)
	}
	// Resolve symlinks: t.TempDir may be under a symlinked path (e.g. /var on macOS).
	want, err := filepath.EvalSymlinks(root)
	if err != nil {
		t.Fatal(err)
	}
	gotResolved, err := filepath.EvalSymlinks(got)
	if err != nil {
		t.Fatal(err)
	}
	if gotResolved != want {
		t.Errorf("deriveRootDir() = %q, want %q", gotResolved, want)
	}
}
