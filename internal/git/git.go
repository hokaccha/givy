// Package git provides functions for executing git commands and parsing their output.
package git

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

const defaultTimeout = 30 * time.Second

// runGit executes a git command in the given repository directory and returns its output.
func runGit(repoPath string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), defaultTimeout)
	defer cancel()

	return runGitContext(ctx, repoPath, args...)
}

// runGitContext executes a git command with a context.
func runGitContext(ctx context.Context, repoPath string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", append([]string{"-C", repoPath}, args...)...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s: %w\n%s", strings.Join(args, " "), err, string(out))
	}
	return strings.TrimRight(string(out), "\n"), nil
}

// runGitRaw executes a git command and returns raw bytes (for binary content).
func runGitRaw(repoPath string, args ...string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(context.Background(), defaultTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "git", append([]string{"-C", repoPath}, args...)...)
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("git %s: %w", strings.Join(args, " "), err)
	}
	return out, nil
}
