package git

import (
	"fmt"
	"os"
	"path/filepath"
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
// Untracked files are included by reading their content directly.
func DiffUnstaged(repoPath string) (*DiffResult, error) {
	result, err := diffWorkingDir(repoPath, "worktree", "index")
	if err != nil {
		return nil, err
	}

	// Find untracked files and append them
	untracked, err := runGit(repoPath, "ls-files", "--others", "--exclude-standard")
	if err != nil {
		return nil, err
	}
	if untracked == "" {
		return result, nil
	}

	for _, f := range strings.Split(untracked, "\n") {
		if f == "" {
			continue
		}
		content, err := os.ReadFile(filepath.Join(repoPath, f))
		if err != nil {
			continue
		}

		lines := strings.Split(string(content), "\n")
		additions := len(lines)
		if len(lines) > 0 && lines[len(lines)-1] == "" {
			additions--
		}

		result.Files = append(result.Files, DiffStat{
			Path:      f,
			Status:    "added",
			Additions: additions,
		})
		result.Stats.Files++
		result.Stats.Additions += additions

		// Generate unified diff patch for the new file
		result.Patch += generateNewFilePatch(f, lines)
	}

	return result, nil
}

// generateNewFilePatch creates a unified diff patch for a new file.
func generateNewFilePatch(path string, lines []string) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("diff --git a/%s b/%s\n", path, path))
	b.WriteString("new file mode 100644\n")
	b.WriteString(fmt.Sprintf("--- /dev/null\n"))
	b.WriteString(fmt.Sprintf("+++ b/%s\n", path))

	count := len(lines)
	if count > 0 && lines[count-1] == "" {
		lines = lines[:count-1]
		count--
	}
	b.WriteString(fmt.Sprintf("@@ -0,0 +1,%d @@\n", count))
	for _, line := range lines {
		b.WriteString("+" + line + "\n")
	}
	return b.String()
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
