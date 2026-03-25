package handler

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/hokaccha/givy/internal/git"
)

func getBlob(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner := chi.URLParam(r, "owner")
		repo := chi.URLParam(r, "repo")
		path := strings.TrimPrefix(chi.URLParam(r, "*"), "/")

		repoPath := git.RepoPath(rootDir, owner, repo)
		blob, err := git.ReadFile(repoPath, path)
		if err != nil {
			writeError(w, http.StatusNotFound, "file not found")
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"path":     path,
			"name":     filepath.Base(path),
			"content":  blob.Content,
			"size":     blob.Size,
			"isBinary": blob.IsBinary,
			"encoding": blob.Encoding,
		})
	}
}
