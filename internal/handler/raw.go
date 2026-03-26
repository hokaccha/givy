package handler

import (
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/hokaccha/givy/internal/git"
)

func getRaw(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner := chi.URLParam(r, "owner")
		repo := chi.URLParam(r, "repo")
		path := strings.TrimPrefix(chi.URLParam(r, "*"), "/")

		repoPath := git.RepoPath(rootDir, owner, repo)
		fullPath := filepath.Join(repoPath, path)

		data, err := os.ReadFile(fullPath)
		if err != nil {
			http.NotFound(w, r)
			return
		}

		contentType := mime.TypeByExtension(filepath.Ext(path))
		if contentType == "" {
			contentType = http.DetectContentType(data)
		}

		w.Header().Set("Content-Type", contentType)
		w.Write(data)
	}
}
