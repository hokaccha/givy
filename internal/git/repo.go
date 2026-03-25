package git

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// DiscoverRepos scans the root directory for git repositories.
// It expects the structure: <root>/<owner>/<repo>/.git
// If query is non-empty, only repos whose "owner/name" contains the query are returned.
func DiscoverRepos(rootDir, query string) ([]RepoInfo, error) {
	var repos []RepoInfo
	queryLower := strings.ToLower(query)

	owners, err := os.ReadDir(rootDir)
	if err != nil {
		return nil, err
	}

	for _, owner := range owners {
		if !owner.IsDir() || owner.Name()[0] == '.' {
			continue
		}

		ownerPath := filepath.Join(rootDir, owner.Name())
		repoEntries, err := os.ReadDir(ownerPath)
		if err != nil {
			continue
		}

		for _, repo := range repoEntries {
			if !repo.IsDir() || repo.Name()[0] == '.' {
				continue
			}

			gitDir := filepath.Join(ownerPath, repo.Name(), ".git")
			if info, err := os.Stat(gitDir); err == nil && info.IsDir() {
				fullName := owner.Name() + "/" + repo.Name()
				if query != "" && !strings.Contains(strings.ToLower(fullName), queryLower) {
					continue
				}
				repos = append(repos, RepoInfo{
					Owner: owner.Name(),
					Name:  repo.Name(),
				})
			}
		}
	}

	sort.Slice(repos, func(i, j int) bool {
		if repos[i].Owner != repos[j].Owner {
			return repos[i].Owner < repos[j].Owner
		}
		return repos[i].Name < repos[j].Name
	})

	return repos, nil
}

// RepoPath returns the filesystem path for a given owner/repo.
func RepoPath(rootDir, owner, repo string) string {
	return filepath.Join(rootDir, owner, repo)
}
