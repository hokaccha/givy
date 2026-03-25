package git_test

import (
	"path/filepath"
	"testing"

	"github.com/hokaccha/givy/internal/git"
)

func TestListBranches(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	branches, err := git.ListBranches(repoPath)
	if err != nil {
		t.Fatal(err)
	}

	if len(branches) != 2 {
		t.Fatalf("expected 2 branches, got %d", len(branches))
	}

	branchMap := make(map[string]git.BranchInfo)
	for _, b := range branches {
		branchMap[b.Name] = b
	}

	mainBranch, ok := branchMap["main"]
	if !ok {
		t.Fatal("expected 'main' branch")
	}
	if !mainBranch.IsDefault {
		t.Error("main should be the default branch")
	}
	if mainBranch.LastCommit == "" {
		t.Error("lastCommit should not be empty")
	}

	featureBranch, ok := branchMap["feature/add-tests"]
	if !ok {
		t.Fatal("expected 'feature/add-tests' branch")
	}
	if featureBranch.IsDefault {
		t.Error("feature/add-tests should not be the default branch")
	}
}
