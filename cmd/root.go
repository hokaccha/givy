package cmd

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "givy",
	Short: "A local GitHub-like git viewer",
	Long:  "Givy is a local git repository viewer with a GitHub-like web interface.",
}

// Execute runs the root command.
func Execute() error {
	return rootCmd.Execute()
}
