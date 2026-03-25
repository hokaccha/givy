package git

import (
	"strings"
)

// ListBranches returns all branches in the repository.
func ListBranches(repoPath string) ([]BranchInfo, error) {
	out, err := runGit(repoPath, "branch", "--format=%(refname:short) %(objectname:short)")
	if err != nil {
		return nil, err
	}

	if out == "" {
		return []BranchInfo{}, nil
	}

	defaultBranch := detectDefaultBranch(repoPath)
	return parseBranchOutput(out, defaultBranch), nil
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
