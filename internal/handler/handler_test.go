package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
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

	// Create feature branch with changes
	run("checkout", "-b", "feature/add-tests")
	writeFile("src/main.go", "package main\n\nimport \"fmt\"\n\nfunc main() { fmt.Println(\"hello\") }\n")
	writeFile("src/main_test.go", "package main\n")
	run("add", "-A")
	run("commit", "-m", "Add tests")
	run("checkout", "main")

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

	var result struct {
		Repos      []map[string]interface{} `json:"repos"`
		TotalCount int                      `json:"totalCount"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Repos) != 1 {
		t.Fatalf("expected 1 repo, got %d", len(result.Repos))
	}
	if result.Repos[0]["owner"] != "testowner" {
		t.Errorf("expected owner 'testowner', got %v", result.Repos[0]["owner"])
	}
	if result.TotalCount != 1 {
		t.Errorf("expected totalCount 1, got %d", result.TotalCount)
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

func TestGetBlob_ETag(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	// First request should return ETag header
	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/blob/README.md", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	etag := w.Header().Get("ETag")
	if etag == "" {
		t.Fatal("expected ETag header to be set")
	}

	// Second request with matching If-None-Match should return 304
	req = httptest.NewRequest("GET", "/api/repos/testowner/testrepo/blob/README.md", nil)
	req.Header.Set("If-None-Match", etag)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotModified {
		t.Fatalf("expected 304, got %d: %s", w.Code, w.Body.String())
	}
	if w.Body.Len() != 0 {
		t.Error("expected empty body for 304 response")
	}

	// Request with non-matching If-None-Match should return 200
	req = httptest.NewRequest("GET", "/api/repos/testowner/testrepo/blob/README.md", nil)
	req.Header.Set("If-None-Match", `"non-matching-etag"`)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetBlob_ETagChangesOnFileUpdate(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)
	repoDir := filepath.Join(root, "testowner", "testrepo")

	// Get initial ETag
	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/blob/README.md", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	etag1 := w.Header().Get("ETag")

	// Update the file on disk
	if err := os.WriteFile(filepath.Join(repoDir, "README.md"), []byte("# Updated\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	// ETag should be different now
	req = httptest.NewRequest("GET", "/api/repos/testowner/testrepo/blob/README.md", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	etag2 := w.Header().Get("ETag")
	if etag1 == etag2 {
		t.Error("expected ETag to change after file update")
	}

	// Old ETag should no longer match (200, not 304)
	req = httptest.NewRequest("GET", "/api/repos/testowner/testrepo/blob/README.md", nil)
	req.Header.Set("If-None-Match", etag1)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 with stale ETag, got %d", w.Code)
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

func TestListRepos_SearchFilter(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	// Matching query
	req := httptest.NewRequest("GET", "/api/repos?q=testowner", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var result struct {
		Repos      []map[string]interface{} `json:"repos"`
		TotalCount int                      `json:"totalCount"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Repos) != 1 {
		t.Fatalf("expected 1 repo, got %d", len(result.Repos))
	}

	// Non-matching query
	req = httptest.NewRequest("GET", "/api/repos?q=nonexistent", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var empty struct {
		Repos      []map[string]interface{} `json:"repos"`
		TotalCount int                      `json:"totalCount"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &empty); err != nil {
		t.Fatal(err)
	}
	if len(empty.Repos) != 0 {
		t.Fatalf("expected 0 repos, got %d", len(empty.Repos))
	}
}

func TestCompareDiff(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/compare/main...feature/add-tests", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result["base"] != "main" {
		t.Errorf("expected base 'main', got %v", result["base"])
	}
	if result["head"] != "feature/add-tests" {
		t.Errorf("expected head 'feature/add-tests', got %v", result["head"])
	}
	patch, _ := result["patch"].(string)
	if patch == "" {
		t.Error("expected non-empty patch")
	}
}

func TestCompareDiff_InvalidSpec(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/compare/invalid-spec", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestShowCommitHandler(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)
	repoDir := filepath.Join(root, "testowner", "testrepo")

	// Get the commit hash
	cmd := exec.Command("git", "-C", repoDir, "rev-parse", "feature/add-tests")
	out, err := cmd.Output()
	if err != nil {
		t.Fatal(err)
	}
	hash := strings.TrimSpace(string(out))

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/commits/"+hash, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	commit, ok := result["commit"].(map[string]any)
	if !ok {
		t.Fatal("expected commit object in response")
	}
	if commit["subject"] != "Add tests" {
		t.Errorf("unexpected subject: %v", commit["subject"])
	}
}

func TestListCommitsHandler(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/compare-commits/main...feature/add-tests", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	commits, ok := result["commits"].([]any)
	if !ok {
		t.Fatal("expected commits array in response")
	}
	if len(commits) == 0 {
		t.Error("expected at least one commit")
	}
}

func TestGetRaw(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/raw/README.md", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	body := w.Body.String()
	if body != "# Test\n" {
		t.Errorf("unexpected body: %q", body)
	}

	contentType := w.Header().Get("Content-Type")
	if !strings.HasPrefix(contentType, "text/") {
		t.Errorf("expected text/* content type, got %q", contentType)
	}
}

func TestGetRaw_NotFound(t *testing.T) {
	root := createTestRepo(t)
	r := setupRouter(root)

	req := httptest.NewRequest("GET", "/api/repos/testowner/testrepo/raw/nonexistent.txt", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
