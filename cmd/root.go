package cmd

import (
	"os"
	"strconv"

	"github.com/spf13/cobra"
)

const defaultPort = 6271

var rootCmd = &cobra.Command{
	Use:   "givy",
	Short: "A local GitHub-like git viewer",
	Long:  "Givy is a local git repository viewer with a GitHub-like web interface.",
}

// Execute runs the root command.
func Execute() error {
	return rootCmd.Execute()
}

// envPort returns the port from GIVY_PORT env var, or defaultPort.
func envPort() int {
	if s := os.Getenv("GIVY_PORT"); s != "" {
		if p, err := strconv.Atoi(s); err == nil && p > 0 {
			return p
		}
	}
	return defaultPort
}

// envRootDir returns the root directory from GIVY_ROOT_DIR env var, or "".
func envRootDir() string {
	return os.Getenv("GIVY_ROOT_DIR")
}
