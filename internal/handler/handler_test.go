package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/hokaccha/givy/internal/handler"
)

// createTestRepo creates a temporary git repository for handler integration tests.
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

	run("init", "-b", "main")
	writeFile("README.md", "# Test\n")
	writeFile("src/main.go", "package main\n")
	run("add", "-A")
	run("commit", "-m", "Initial commit")

	return root
}

func setupRouter(rootDir string) *chi.Mux {
	r := chi.NewRouter()
	handler.RegisterRoutes(r, rootDir)
	return r
}

func TestListRepos(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var repos []map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &repos); err != nil {
		t.Fatal(err)
	}
	if len(repos) != 1 {
		t.Fatalf("expected 1 repo, got %d", len(repos))
	}
	if repos[0]["owner"] != "testowner" {
		t.Errorf("expected owner 'testowner', got %v", repos[0]["owner"])
	}
}

func TestGetRepo(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var repo map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &repo); err != nil {
		t.Fatal(err)
	}
	if repo["defaultBranch"] != "main" {
		t.Errorf("expected defaultBranch 'main', got %v", repo["defaultBranch"])
	}
}

func TestListTree_Root(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/tree", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	entries, ok := result["entries"].([]interface{})
	if !ok {
		t.Fatal("expected entries array in response")
	}
	if len(entries) == 0 {
		t.Error("expected non-empty entries for root tree")
	}
}

func TestListTree_WithSubpath(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/tree/src", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	entries, ok := result["entries"].([]interface{})
	if !ok {
		t.Fatal("expected entries array in response")
	}
	if len(entries) == 0 {
		t.Error("expected non-empty entries for src/")
	}
}

func TestListTree_NotFound(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/tree/nonexistent-path", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetBlob(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/blob/README.md", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result["isBinary"] != false {
		t.Error("README.md should not be binary")
	}
}

func TestListBranches(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/branches", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var branches []map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &branches); err != nil {
		t.Fatal(err)
	}
	if len(branches) == 0 {
		t.Error("expected at least one branch")
	}
}

func TestGetRepo_NotFound(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/nonexistent/repo", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
