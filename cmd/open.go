package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var openPort int

func init() {
	openCmd.Flags().IntVar(&openPort, "port", envPort(), "server port (env: GIVY_PORT)")
	rootCmd.AddCommand(openCmd)
}

var openCmd = &cobra.Command{
	Use:   "open [path | commit-id]",
	Short: "Open a file or commit in the givy viewer",
	Long: `Open a file or commit in the default browser via the givy web interface.

If the argument looks like a commit hash (hex string of 7+ characters),
opens the commit diff view. Otherwise, opens the file/directory viewer.
With no argument, opens the current directory.

If no givy server is running on the target port, one is started
automatically in the background.`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		arg := "."
		if len(args) == 1 {
			arg = args[0]
		}

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
		if (c < '0' || c > '9') && (c < 'a' || c > 'f') && (c < 'A' || c > 'F') {
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

	rootDir, err := ensureServer(openPort)
	if err != nil {
		return err
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

	rootDir, err := ensureServer(openPort)
	if err != nil {
		return err
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

// ensureServer returns the root directory of the givy server on the given
// port, starting one in the background if none is running.
func ensureServer(port int) (string, error) {
	if rootDir, err := fetchRootDirFromServer(port); err == nil {
		return rootDir, nil
	}

	rootDir, err := deriveRootDir()
	if err != nil {
		return "", fmt.Errorf("no givy server on port %d and cannot determine root directory: %w", port, err)
	}
	if err := startServerInBackground(rootDir, port); err != nil {
		return "", err
	}
	return waitForServer(port, 5*time.Second)
}

// deriveRootDir determines the server root directory without a running
// server: GIVY_ROOT_DIR if set, otherwise two levels above the enclosing
// git repository, assuming the <root>/<owner>/<repo> layout.
func deriveRootDir() (string, error) {
	if dir := envRootDir(); dir != "" {
		return filepath.Abs(dir)
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("get cwd: %w", err)
	}
	repoRoot, err := findRepoRoot(cwd)
	if err != nil {
		return "", err
	}
	return filepath.Dir(filepath.Dir(repoRoot)), nil
}

// findRepoRoot walks up from dir to the nearest directory containing .git.
func findRepoRoot(dir string) (string, error) {
	for {
		if _, err := os.Stat(filepath.Join(dir, ".git")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("not inside a git repository (set GIVY_ROOT_DIR or run givy serve)")
		}
		dir = parent
	}
}

// startServerInBackground spawns `givy serve` as a detached process so it
// keeps running after this command exits.
func startServerInBackground(rootDir string, port int) error {
	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("locate givy binary: %w", err)
	}
	cmd := exec.Command(exe, "serve", rootDir, "--port", strconv.Itoa(port))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("start givy server: %w", err)
	}
	return cmd.Process.Release()
}

// waitForServer polls the server until it responds or the timeout elapses,
// returning its root directory.
func waitForServer(port int, timeout time.Duration) (string, error) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if rootDir, err := fetchRootDirFromServer(port); err == nil {
			return rootDir, nil
		}
		time.Sleep(100 * time.Millisecond)
	}
	return "", fmt.Errorf("givy server did not start on port %d within %s", port, timeout)
}

// fetchRootDirFromServer retrieves the root directory from the running givy
// server's /api/info endpoint.
func fetchRootDirFromServer(port int) (string, error) {
	resp, err := http.Get(fmt.Sprintf("http://localhost:%d/api/info", port))
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()

	var info struct {
		RootDir string `json:"rootDir"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return "", fmt.Errorf("decode server info: %w", err)
	}
	if info.RootDir == "" {
		return "", fmt.Errorf("server returned empty rootDir")
	}
	return info.RootDir, nil
}

func openBrowser(url string) error {
	if browser := os.Getenv("BROWSER"); browser != "" {
		return exec.Command(browser, url).Start()
	}
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", url).Start()
	case "linux":
		return exec.Command("xdg-open", url).Start()
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}
