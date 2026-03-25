package git_test

import (
	"path/filepath"
	"testing"

	"github.com/hokaccha/givy/internal/git"
)

func TestListTree_Root(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	entries, err := git.ListTree(repoPath, "main", "")
	if err != nil {
		t.Fatal(err)
	}

	// Should have: README.md, data.bin, docs/, src/
	if len(entries) < 4 {
		t.Fatalf("expected at least 4 entries, got %d", len(entries))
	}

	// Check that we have both files and directories
	hasBlob := false
	hasTree := false
	for _, e := range entries {
		if e.Type == "blob" {
			hasBlob = true
		}
		if e.Type == "tree" {
			hasTree = true
		}
	}
	if !hasBlob {
		t.Error("expected at least one blob entry")
	}
	if !hasTree {
		t.Error("expected at least one tree entry")
	}
}

func TestListTree_Subdirectory(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	entries, err := git.ListTree(repoPath, "main", "src")
	if err != nil {
		t.Fatal(err)
	}

	// src/ should have main.go and utils.go
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries in src/, got %d", len(entries))
	}

	names := make(map[string]bool)
	for _, e := range entries {
		names[e.Name] = true
	}
	if !names["src/main.go"] && !names["main.go"] {
		t.Error("expected main.go in src/")
	}
}

func TestListTree_FeatureBranch(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	entries, err := git.ListTree(repoPath, "feature/add-tests", "src")
	if err != nil {
		t.Fatal(err)
	}

	// Feature branch should have main.go, utils.go, and main_test.go
	if len(entries) != 3 {
		t.Fatalf("expected 3 entries in src/ on feature branch, got %d", len(entries))
	}
}

func TestReadBlob_TextFile(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	blob, err := git.ReadBlob(repoPath, "main", "README.md")
	if err != nil {
		t.Fatal(err)
	}

	if blob.IsBinary {
		t.Error("README.md should not be binary")
	}
	if blob.Encoding != "" {
		t.Errorf("text file should have empty encoding, got %q", blob.Encoding)
	}
	if blob.Content == "" {
		t.Error("content should not be empty")
	}
	if blob.Size == 0 {
		t.Error("size should not be 0")
	}
}

func TestReadBlob_BinaryFile(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	blob, err := git.ReadBlob(repoPath, "main", "data.bin")
	if err != nil {
		t.Fatal(err)
	}

	if !blob.IsBinary {
		t.Error("data.bin should be binary")
	}
	if blob.Encoding != "base64" {
		t.Errorf("binary file should have base64 encoding, got %q", blob.Encoding)
	}
}
