package git

import (
	"fmt"
	"strings"
)

// ShowCommit returns the diff for a single commit.
func ShowCommit(repoPath, commitID string) (*CommitDiffResult, error) {
	// Get commit metadata
	format := "%H%n%s%n%an%n%aI"
	meta, err := runGit(repoPath, "log", "-1", "--format="+format, commitID)
	if err != nil {
		return nil, fmt.Errorf("get commit info: %w", err)
	}

	lines := strings.SplitN(meta, "\n", 4)
	if len(lines) < 4 {
		return nil, fmt.Errorf("unexpected commit log output: %s", meta)
	}

	commit := CommitInfo{
		Hash:    lines[0],
		Subject: lines[1],
		Author:  lines[2],
		Date:    lines[3],
	}

	// Get the unified diff for this commit
	patch, err := runGit(repoPath, "diff-tree", "-p", commitID)
	if err != nil {
		return nil, fmt.Errorf("get commit diff: %w", err)
	}

	// Get numstat
	numstat, err := runGit(repoPath, "diff-tree", "--numstat", "-r", commitID)
	if err != nil {
		return nil, fmt.Errorf("get commit numstat: %w", err)
	}

	files := parseNumstat(numstat)

	var totalAdditions, totalDeletions int
	for _, f := range files {
		totalAdditions += f.Additions
		totalDeletions += f.Deletions
	}

	result := &CommitDiffResult{
		Commit: commit,
		Files:  files,
		Patch:  patch,
	}
	result.Stats.Files = len(files)
	result.Stats.Additions = totalAdditions
	result.Stats.Deletions = totalDeletions

	return result, nil
}

// ListCommits returns commits between two refs (base..head order, newest first).
func ListCommits(repoPath, base, head string) ([]CommitInfo, error) {
	format := "%H%x00%s%x00%an%x00%aI"
	out, err := runGit(repoPath, "log", "--format="+format, base+".."+head)
	if err != nil {
		return nil, err
	}

	if out == "" {
		return nil, nil
	}

	var commits []CommitInfo
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "\x00", 4)
		if len(parts) != 4 {
			continue
		}
		commits = append(commits, CommitInfo{
			Hash:    parts[0],
			Subject: parts[1],
			Author:  parts[2],
			Date:    parts[3],
		})
	}

	return commits, nil
}
