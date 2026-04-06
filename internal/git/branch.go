package git

import (
	"path/filepath"
	"strings"
)

// ListBranches returns all branches in the repository.
func ListBranches(repoPath string) ([]BranchInfo, error) {
	out, err := runGit(repoPath, "branch", "--sort=-creatordate", "--format=%(refname:short) %(objectname:short)")
	if err != nil {
		return nil, err
	}

	if out == "" {
		return []BranchInfo{}, nil
	}

	defaultBranch := detectDefaultBranch(repoPath)
	return parseBranchOutput(out, defaultBranch), nil
}

// detectDefaultBranch tries to determine the default branch of a repository.
func detectDefaultBranch(repoPath string) string {
	out, err := runGit(repoPath, "symbolic-ref", "refs/remotes/origin/HEAD")
	if err == nil {
		if name := filepath.Base(out); name != "" {
			return name
		}
	}
	if _, err := runGit(repoPath, "rev-parse", "--verify", "refs/heads/main"); err == nil {
		return "main"
	}
	if _, err := runGit(repoPath, "rev-parse", "--verify", "refs/heads/master"); err == nil {
		return "master"
	}
	return "main"
}

// parseBranchOutput parses the output of `git branch --format=...`.
func parseBranchOutput(output, defaultBranch string) []BranchInfo {
	var branches []BranchInfo
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, " ", 2)
		name := parts[0]
		lastCommit := ""
		if len(parts) > 1 {
			lastCommit = parts[1]
		}

		branches = append(branches, BranchInfo{
			Name:       name,
			IsDefault:  name == defaultBranch,
			LastCommit: lastCommit,
		})
	}

	return branches
}
