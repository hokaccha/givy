package git

import (
	"os"
	"path/filepath"
	"sort"
)

// DiscoverRepos scans the root directory for git repositories.
// It expects the structure: <root>/<owner>/<repo>/.git
func DiscoverRepos(rootDir string) ([]RepoInfo, error) {
	var repos []RepoInfo

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
				repoPath := filepath.Join(ownerPath, repo.Name())
				defaultBranch := detectDefaultBranch(repoPath)
				repos = append(repos, RepoInfo{
					Owner:         owner.Name(),
					Name:          repo.Name(),
					DefaultBranch: defaultBranch,
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

// detectDefaultBranch tries to determine the default branch of a repository.
func detectDefaultBranch(repoPath string) string {
	// Try symbolic-ref first
	out, err := runGit(repoPath, "symbolic-ref", "refs/remotes/origin/HEAD")
	if err == nil {
		// Output: refs/remotes/origin/main
		parts := filepath.Base(out)
		if parts != "" {
			return parts
		}
	}

	// Check if "main" branch exists
	if _, err := runGit(repoPath, "rev-parse", "--verify", "refs/heads/main"); err == nil {
		return "main"
	}

	// Check if "master" branch exists
	if _, err := runGit(repoPath, "rev-parse", "--verify", "refs/heads/master"); err == nil {
		return "master"
	}

	return "main"
}

// RepoPath returns the filesystem path for a given owner/repo.
func RepoPath(rootDir, owner, repo string) string {
	return filepath.Join(rootDir, owner, repo)
}
