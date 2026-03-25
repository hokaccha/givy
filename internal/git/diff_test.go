package git_test

import (
	"path/filepath"
	"testing"

	"github.com/hokaccha/givy/internal/git"
)

func TestCompare(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	result, err := git.Compare(repoPath, "main", "feature/add-tests")
	if err != nil {
		t.Fatal(err)
	}

	if result.Base != "main" {
		t.Errorf("expected base 'main', got %q", result.Base)
	}
	if result.Head != "feature/add-tests" {
		t.Errorf("expected head 'feature/add-tests', got %q", result.Head)
	}

	// Should have changes in src/main.go and src/main_test.go
	if len(result.Files) < 2 {
		t.Fatalf("expected at least 2 changed files, got %d", len(result.Files))
	}

	fileMap := make(map[string]git.DiffStat)
	for _, f := range result.Files {
		fileMap[f.Path] = f
	}

	mainGo, ok := fileMap["src/main.go"]
	if !ok {
		t.Fatal("expected src/main.go in diff")
	}
	if mainGo.Additions == 0 {
		t.Error("src/main.go should have additions")
	}

	testGo, ok := fileMap["src/main_test.go"]
	if !ok {
		t.Fatal("expected src/main_test.go in diff")
	}
	if testGo.Additions == 0 {
		t.Error("src/main_test.go should have additions")
	}

	// Stats should be consistent
	if result.Stats.Files != len(result.Files) {
		t.Errorf("stats.files=%d but len(files)=%d", result.Stats.Files, len(result.Files))
	}

	// Patch should be non-empty
	if result.Patch == "" {
		t.Error("patch should not be empty")
	}
}
