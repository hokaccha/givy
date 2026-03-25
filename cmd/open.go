package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/spf13/cobra"
)

var (
	openPort    int
	openRootDir string
)

func init() {
	openCmd.Flags().IntVar(&openPort, "port", 6271, "server port")
	openCmd.Flags().StringVar(&openRootDir, "root", "", "root directory (same as serve argument)")
	rootCmd.AddCommand(openCmd)
}

var openCmd = &cobra.Command{
	Use:   "open <path>",
	Short: "Open a file in the givy viewer",
	Long:  "Open a file in the default browser via the givy web interface.",
	Args:  cobra.ExactArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		targetPath, err := filepath.Abs(args[0])
		if err != nil {
			return fmt.Errorf("resolve path: %w", err)
		}

		rootDir := openRootDir
		if rootDir == "" {
			// Try to infer root dir from the path structure
			// Walk up from the target looking for the owner/repo/.git pattern
			rootDir, err = inferRootDir(targetPath)
			if err != nil {
				return fmt.Errorf("cannot infer root directory, use --root flag: %w", err)
			}
		} else {
			rootDir, err = filepath.Abs(rootDir)
			if err != nil {
				return fmt.Errorf("resolve root: %w", err)
			}
		}

		// The path relative to root should be owner/repo/...rest
		relPath, err := filepath.Rel(rootDir, targetPath)
		if err != nil {
			return fmt.Errorf("compute relative path: %w", err)
		}

		parts := strings.SplitN(relPath, string(filepath.Separator), 3)
		if len(parts) < 2 {
			return fmt.Errorf("path must be under <root>/<owner>/<repo>/..., got: %s", relPath)
		}

		owner := parts[0]
		repo := parts[1]
		filePath := ""
		if len(parts) == 3 {
			filePath = parts[2]
		}

		var url string
		if filePath == "" {
			url = fmt.Sprintf("http://localhost:%d/%s/%s", openPort, owner, repo)
		} else {
			// Determine if it's a file or directory
			info, err := os.Stat(targetPath)
			if err != nil {
				return fmt.Errorf("stat %s: %w", targetPath, err)
			}
			routeType := "blob"
			if info.IsDir() {
				routeType = "tree"
			}
			url = fmt.Sprintf("http://localhost:%d/%s/%s/%s/%s", openPort, owner, repo, routeType, filePath)
		}

		fmt.Println(url)
		return openBrowser(url)
	},
}

// inferRootDir walks up the directory tree to find the root repos directory.
// It looks for the pattern: <root>/<owner>/<repo>/.git
func inferRootDir(path string) (string, error) {
	dir := path
	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		dir = filepath.Dir(path)
	}

	// Walk up looking for .git directory
	for {
		gitDir := filepath.Join(dir, ".git")
		if info, err := os.Stat(gitDir); err == nil && info.IsDir() {
			// Found .git, the root should be two levels up (owner/repo/.git)
			repoDir := dir
			ownerDir := filepath.Dir(repoDir)
			rootDir := filepath.Dir(ownerDir)
			return rootDir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no .git directory found in ancestors of %s", path)
		}
		dir = parent
	}
}

func detectBranch(repoDir string) string {
	cmd := exec.Command("git", "-C", repoDir, "branch", "--show-current")
	out, err := cmd.Output()
	if err != nil {
		return "main"
	}
	branch := strings.TrimSpace(string(out))
	if branch == "" {
		return "main"
	}
	return branch
}

func openBrowser(url string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", url).Start()
	case "linux":
		return exec.Command("xdg-open", url).Start()
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}
