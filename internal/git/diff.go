package git

import (
	"strconv"
	"strings"
)

// Compare generates a diff between two refs.
func Compare(repoPath, base, head string) (*DiffResult, error) {
	// Get the unified diff
	patch, err := runGit(repoPath, "diff", base+"..."+head)
	if err != nil {
		return nil, err
	}

	// Get numstat for file-level stats
	numstat, err := runGit(repoPath, "diff", "--numstat", base+"..."+head)
	if err != nil {
		return nil, err
	}

	files := parseNumstat(numstat)

	var totalAdditions, totalDeletions int
	for _, f := range files {
		totalAdditions += f.Additions
		totalDeletions += f.Deletions
	}

	result := &DiffResult{
		Base:  base,
		Head:  head,
		Files: files,
		Patch: patch,
	}
	result.Stats.Files = len(files)
	result.Stats.Additions = totalAdditions
	result.Stats.Deletions = totalDeletions

	return result, nil
}

// DiffUnstaged generates a diff of unstaged changes (working tree vs index).
// It temporarily marks untracked files with intent-to-add so they appear in the diff.
func DiffUnstaged(repoPath string) (*DiffResult, error) {
	// Find untracked files
	untracked, err := runGit(repoPath, "ls-files", "--others", "--exclude-standard")
	if err != nil {
		return nil, err
	}

	// Mark untracked files as intent-to-add so git diff includes them
	var addedFiles []string
	if untracked != "" {
		for _, f := range strings.Split(strings.TrimSpace(untracked), "\n") {
			if f != "" {
				addedFiles = append(addedFiles, f)
			}
		}
	}
	if len(addedFiles) > 0 {
		args := append([]string{"add", "-N", "--"}, addedFiles...)
		if _, err := runGit(repoPath, args...); err != nil {
			return nil, err
		}
		defer func() {
			// Remove intent-to-add entries to restore original index state
			resetArgs := append([]string{"reset", "--"}, addedFiles...)
			_, _ = runGit(repoPath, resetArgs...)
		}()
	}

	return diffWorkingDir(repoPath, "worktree", "index")
}

// DiffStaged generates a diff of staged changes (index vs HEAD).
func DiffStaged(repoPath string) (*DiffResult, error) {
	return diffWorkingDir(repoPath, "staged", "index", "--cached")
}

func diffWorkingDir(repoPath, label, base string, extraArgs ...string) (*DiffResult, error) {
	args := append([]string{"diff"}, extraArgs...)
	patch, err := runGit(repoPath, args...)
	if err != nil {
		return nil, err
	}

	numstatArgs := append([]string{"diff", "--numstat"}, extraArgs...)
	numstat, err := runGit(repoPath, numstatArgs...)
	if err != nil {
		return nil, err
	}

	files := parseNumstat(numstat)

	var totalAdditions, totalDeletions int
	for _, f := range files {
		totalAdditions += f.Additions
		totalDeletions += f.Deletions
	}

	result := &DiffResult{
		Base:  base,
		Head:  label,
		Files: files,
		Patch: patch,
	}
	result.Stats.Files = len(files)
	result.Stats.Additions = totalAdditions
	result.Stats.Deletions = totalDeletions

	return result, nil
}

// parseNumstat parses the output of `git diff --numstat`.
// Format: <additions>\t<deletions>\t<path>
func parseNumstat(output string) []DiffStat {
	if output == "" {
		return nil
	}

	var stats []DiffStat
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, "\t", 3)
		if len(parts) != 3 {
			continue
		}

		// Binary files show "-" for additions/deletions
		additions, _ := strconv.Atoi(parts[0])
		deletions, _ := strconv.Atoi(parts[1])
		path := parts[2]

		status := "modified"
		if additions > 0 && deletions == 0 {
			status = "added"
		}

		stats = append(stats, DiffStat{
			Path:      path,
			Status:    status,
			Additions: additions,
			Deletions: deletions,
		})
	}

	return stats
}
