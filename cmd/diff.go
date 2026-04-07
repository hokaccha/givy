package cmd

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

var diffPort int

func init() {
	diffCmd.Flags().IntVar(&diffPort, "port", envPort(), "server port (env: GIVY_PORT)")
	rootCmd.AddCommand(diffCmd)
}

var diffCmd = &cobra.Command{
	Use:   "diff [base...head | branch | @staged | @unstaged]",
	Short: "Open the diff view in the browser",
	Long: `Open the givy diff view in the default browser.

Usage:
  givy diff                          # Show unstaged changes (same as @unstaged)
  givy diff @unstaged                # Show unstaged changes
  givy diff @staged                  # Show staged changes
  givy diff feature/branch           # Compare feature/branch against default branch
  givy diff main...feature/branch    # Compare specific base and head`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		// Get current directory's repo info
		cwd, err := filepath.Abs(".")
		if err != nil {
			return fmt.Errorf("get cwd: %w", err)
		}

		rootDir, err := fetchRootDirFromServer(diffPort)
		if err != nil {
			return err
		}

		// Determine owner/repo from cwd
		relPath, err := filepath.Rel(rootDir, cwd)
		if err != nil {
			return fmt.Errorf("compute relative path: %w", err)
		}
		parts := strings.SplitN(relPath, string(filepath.Separator), 3)
		if len(parts) < 2 {
			return fmt.Errorf("must be inside a repo directory (<root>/<owner>/<repo>/...)")
		}
		owner := parts[0]
		repo := parts[1]
		repoDir := filepath.Join(rootDir, owner, repo)

		// No args: default to @unstaged
		if len(args) == 0 {
			args = []string{"@unstaged"}
		}

		// Handle @unstaged / @staged shortcuts
		if args[0] == "@unstaged" || args[0] == "@staged" {
			url := fmt.Sprintf("http://localhost:%d/%s/%s/changes/%s", diffPort, owner, repo, args[0])
			fmt.Println(url)
			return openBrowser(url)
		}

		base, head, err := resolveCompareSpec(repoDir, args)
		if err != nil {
			return err
		}

		url := fmt.Sprintf("http://localhost:%d/%s/%s/changes/%s...%s", diffPort, owner, repo, base, head)
		fmt.Println(url)
		return openBrowser(url)
	},
}

// resolveCompareSpec determines the base and head refs from the arguments.
func resolveCompareSpec(repoDir string, args []string) (base, head string, err error) {
	arg := args[0]
	if strings.Contains(arg, "...") {
		// Explicit base...head
		parts := strings.SplitN(arg, "...", 2)
		if parts[0] == "" || parts[1] == "" {
			return "", "", fmt.Errorf("invalid compare spec: %q", arg)
		}
		return parts[0], parts[1], nil
	}
	// Single branch: compare default...branch
	defaultBranch := detectDefaultBranch(repoDir)
	return defaultBranch, arg, nil
}

// detectDefaultBranch determines the default branch for a repository.
func detectDefaultBranch(repoDir string) string {
	cmd := exec.Command("git", "-C", repoDir, "symbolic-ref", "refs/remotes/origin/HEAD")
	out, err := cmd.Output()
	if err == nil {
		name := filepath.Base(strings.TrimSpace(string(out)))
		if name != "" {
			return name
		}
	}
	cmd = exec.Command("git", "-C", repoDir, "rev-parse", "--verify", "refs/heads/main")
	if err := cmd.Run(); err == nil {
		return "main"
	}
	cmd = exec.Command("git", "-C", repoDir, "rev-parse", "--verify", "refs/heads/master")
	if err := cmd.Run(); err == nil {
		return "master"
	}
	return "main"
}
