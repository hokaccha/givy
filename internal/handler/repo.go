package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/hokaccha/givy/internal/git"
)

// RegisterRoutes registers all API routes on the router.
func RegisterRoutes(r chi.Router, rootDir string) {
	r.Route("/api", func(r chi.Router) {
		r.Get("/repos", listRepos(rootDir))
		r.Get("/repos/{owner}/{repo}", getRepo(rootDir))
		r.Get("/repos/{owner}/{repo}/branches", listBranches(rootDir))
		r.Get("/repos/{owner}/{repo}/tree", listTree(rootDir))
		r.Get("/repos/{owner}/{repo}/tree/*", listTree(rootDir))
		r.Get("/repos/{owner}/{repo}/blob/*", getBlob(rootDir))
		r.Get("/repos/{owner}/{repo}/compare/{spec}", compareDiff(rootDir))
	})
}

func listRepos(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repos, err := git.DiscoverRepos(rootDir)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, repos)
	}
}

func getRepo(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner := chi.URLParam(r, "owner")
		repo := chi.URLParam(r, "repo")
		repoPath := git.RepoPath(rootDir, owner, repo)

		branches, err := git.ListBranches(repoPath)
		if err != nil {
			writeError(w, http.StatusNotFound, "repository not found")
			return
		}

		defaultBranch := "main"
		for _, b := range branches {
			if b.IsDefault {
				defaultBranch = b.Name
				break
			}
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"owner":         owner,
			"name":          repo,
			"defaultBranch": defaultBranch,
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
