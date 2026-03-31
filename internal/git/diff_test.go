package git_test

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
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

func TestDiffUnstaged_IncludesUntrackedFiles(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	// Create a new untracked file
	newFile := filepath.Join(repoPath, "newfile.txt")
	if err := os.WriteFile(newFile, []byte("new content\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	// Also modify a tracked file
	readmePath := filepath.Join(repoPath, "README.md")
	if err := os.WriteFile(readmePath, []byte("# Updated\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	result, err := git.DiffUnstaged(repoPath)
	if err != nil {
		t.Fatal(err)
	}

	fileMap := make(map[string]git.DiffStat)
	for _, f := range result.Files {
		fileMap[f.Path] = f
	}

	// Untracked file should appear in diff
	if _, ok := fileMap["newfile.txt"]; !ok {
		t.Error("expected untracked file newfile.txt in unstaged diff")
	}

	// Modified tracked file should also appear
	if _, ok := fileMap["README.md"]; !ok {
		t.Error("expected modified file README.md in unstaged diff")
	}

	// Patch should contain the new file content
	if !strings.Contains(result.Patch, "new content") {
		t.Error("patch should contain new file content")
	}
}

func TestDiffUnstaged_PatchSeparatesFiles(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	// Modify a tracked file
	readmePath := filepath.Join(repoPath, "README.md")
	if err := os.WriteFile(readmePath, []byte("# Updated\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	// Create two untracked files
	if err := os.WriteFile(filepath.Join(repoPath, "new1.txt"), []byte("hello\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(repoPath, "new2.txt"), []byte("world\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	result, err := git.DiffUnstaged(repoPath)
	if err != nil {
		t.Fatal(err)
	}

	// Each "diff --git" line must start at the beginning of a line
	for i, line := range strings.Split(result.Patch, "\n") {
		if strings.Contains(line, "diff --git") && !strings.HasPrefix(line, "diff --git") {
			t.Errorf("line %d: 'diff --git' not at start of line: %q", i, line)
		}
	}

	// Count the number of "diff --git" headers — should be at least 3
	count := strings.Count(result.Patch, "\ndiff --git ")
	// The first "diff --git" may be at the very start (no preceding \n)
	if strings.HasPrefix(result.Patch, "diff --git ") {
		count++
	}
	if count < 3 {
		t.Errorf("expected at least 3 diff headers (README.md + new1.txt + new2.txt), got %d", count)
	}
}

func TestDiffStaged(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	// Modify a file and stage it
	readmePath := filepath.Join(repoPath, "README.md")
	if err := os.WriteFile(readmePath, []byte("# Updated\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	// Stage the change
	cmd := exec.Command("git", "-C", repoPath, "add", "README.md")
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("git add failed: %v\n%s", err, out)
	}

	result, err := git.DiffStaged(repoPath)
	if err != nil {
		t.Fatal(err)
	}

	if len(result.Files) == 0 {
		t.Fatal("expected at least one file in staged diff")
	}

	fileMap := make(map[string]git.DiffStat)
	for _, f := range result.Files {
		fileMap[f.Path] = f
	}

	if _, ok := fileMap["README.md"]; !ok {
		t.Error("expected README.md in staged diff")
	}

	if result.Patch == "" {
		t.Error("patch should not be empty")
	}
	if !strings.Contains(result.Patch, "Updated") {
		t.Error("patch should contain the new content")
	}
}

func TestDiffStaged_NoChanges(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	result, err := git.DiffStaged(repoPath)
	if err != nil {
		t.Fatal(err)
	}

	if len(result.Files) != 0 {
		t.Errorf("expected 0 files, got %d", len(result.Files))
	}
	if result.Patch != "" {
		t.Errorf("expected empty patch, got %q", result.Patch)
	}
}

func TestDiffUnstaged_RestoresIndexState(t *testing.T) {
	root := createTestRepo(t)
	repoPath := filepath.Join(root, "testowner", "testrepo")

	// Create an untracked file
	newFile := filepath.Join(repoPath, "tempfile.txt")
	if err := os.WriteFile(newFile, []byte("temp\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	// Call DiffUnstaged
	if _, err := git.DiffUnstaged(repoPath); err != nil {
		t.Fatal(err)
	}

	// Verify the file is still untracked (not in index)
	out, err := exec.Command("git", "-C", repoPath, "status", "--porcelain").Output()
	if err != nil {
		t.Fatal(err)
	}
	status := string(out)

	for _, line := range strings.Split(strings.TrimSpace(status), "\n") {
		if strings.HasSuffix(line, "tempfile.txt") {
			if !strings.HasPrefix(line, "??") {
				t.Errorf("expected tempfile.txt to be untracked (??), got %q", line)
			}
			return
		}
	}
	t.Error("tempfile.txt not found in git status output")
}
