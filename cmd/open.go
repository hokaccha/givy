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
	openCmd.Flags().IntVar(&openPort, "port", envPort(), "server port (env: GIVY_PORT)")
	openCmd.Flags().StringVar(&openRootDir, "root", envRootDir(), "root directory (env: GIVY_ROOT_DIR)")
	rootCmd.AddCommand(openCmd)
}

var openCmd = &cobra.Command{
	Use:   "open <path | commit-id>",
	Short: "Open a file or commit in the givy viewer",
	Long: `Open a file or commit in the default browser via the givy web interface.

If the argument looks like a commit hash (hex string of 7+ characters),
opens the commit diff view. Otherwise, opens the file/directory viewer.`,
	Args: cobra.ExactArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		arg := args[0]

		// Check if argument looks like a commit hash
		if isCommitHash(arg) {
			return openCommit(arg)
		}

		return openPath(arg)
	},
}

// isCommitHash returns true if the string looks like a git commit hash
// (7-40 hex characters).
func isCommitHash(s string) bool {
	if len(s) < 7 || len(s) > 40 {
		return false
	}
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

func openCommit(commitID string) error {
	cwd, err := filepath.Abs(".")
	if err != nil {
		return fmt.Errorf("get cwd: %w", err)
	}

	rootDir := openRootDir
	if rootDir == "" {
		rootDir, err = inferRootDir(cwd)
		if err != nil {
			return fmt.Errorf("cannot infer root directory, use --root flag: %w", err)
		}
	} else {
		rootDir, err = filepath.Abs(rootDir)
		if err != nil {
			return fmt.Errorf("resolve root: %w", err)
		}
	}

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

	url := fmt.Sprintf("http://localhost:%d/%s/%s/commit/%s", openPort, owner, repo, commitID)
	fmt.Println(url)
	return openBrowser(url)
}

func openPath(target string) error {
	targetPath, err := filepath.Abs(target)
	if err != nil {
		return fmt.Errorf("resolve path: %w", err)
	}

	rootDir := openRootDir
	if rootDir == "" {
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
