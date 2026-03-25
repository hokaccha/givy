package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/hokaccha/givy/internal/git"
)

func listTree(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner := chi.URLParam(r, "owner")
		repo := chi.URLParam(r, "repo")
		ref := chi.URLParam(r, "ref")
		path := strings.TrimPrefix(chi.URLParam(r, "*"), "/")

		repoPath := git.RepoPath(rootDir, owner, repo)
		entries, err := git.ListTree(repoPath, ref, path)
		if err != nil {
			writeError(w, http.StatusNotFound, "tree not found")
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ref":     ref,
			"path":    path,
			"entries": entries,
		})
	}
}
