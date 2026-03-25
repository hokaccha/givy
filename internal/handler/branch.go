package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/hokaccha/givy/internal/git"
)

func listBranches(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner := chi.URLParam(r, "owner")
		repo := chi.URLParam(r, "repo")

		repoPath := git.RepoPath(rootDir, owner, repo)
		branches, err := git.ListBranches(repoPath)
		if err != nil {
			writeError(w, http.StatusNotFound, "repository not found")
			return
		}

		writeJSON(w, http.StatusOK, branches)
	}
}
