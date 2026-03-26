package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/hokaccha/givy/internal/git"
)

func showCommit(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner := chi.URLParam(r, "owner")
		repo := chi.URLParam(r, "repo")
		commitID := chi.URLParam(r, "commitId")

		repoPath := git.RepoPath(rootDir, owner, repo)
		result, err := git.ShowCommit(repoPath, commitID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, result)
	}
}

func listCommits(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner := chi.URLParam(r, "owner")
		repo := chi.URLParam(r, "repo")
		spec := chi.URLParam(r, "*")

		parts := strings.SplitN(spec, "...", 2)
		if len(parts) != 2 {
			writeError(w, http.StatusBadRequest, "invalid compare spec, expected base...head")
			return
		}
		base, head := parts[0], parts[1]

		repoPath := git.RepoPath(rootDir, owner, repo)
		commits, err := git.ListCommits(repoPath, base, head)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"commits": commits,
		})
	}
}
