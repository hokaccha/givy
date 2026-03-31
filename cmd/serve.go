package cmd

import (
	"fmt"
	"io/fs"
	"path/filepath"

	"github.com/hokaccha/givy/internal/server"
	"github.com/spf13/cobra"
)

var (
	servePort int
	serveDev  bool
)

// FrontendFS is set by main.go to the embedded frontend filesystem.
var FrontendFS fs.FS

func init() {
	serveCmd.Flags().IntVar(&servePort, "port", envPort(), "port to listen on (env: GIVY_PORT)")
	serveCmd.Flags().BoolVar(&serveDev, "dev", false, "enable dev mode (proxy frontend to Vite)")
	rootCmd.AddCommand(serveCmd)
}

var serveCmd = &cobra.Command{
	Use:   "serve [directory]",
	Short: "Start the web server",
	Long:  "Start the givy web server, serving repositories from the specified directory.\nDefaults to GIVY_ROOT_DIR if set.",
	Args:  cobra.MaximumNArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		var dir string
		if len(args) == 1 {
			dir = args[0]
		} else {
			dir = envRootDir()
			if dir == "" {
				return fmt.Errorf("no directory specified and GIVY_ROOT_DIR is not set")
			}
		}
		rootDir, err := filepath.Abs(dir)
		if err != nil {
			return fmt.Errorf("resolving root directory: %w", err)
		}
		addr := fmt.Sprintf(":%d", servePort)

		fmt.Println()
		fmt.Printf("  \033[1;36mgivy\033[0m server started\n")
		fmt.Println()
		fmt.Printf("  \033[1mURL:\033[0m   \033[4;34mhttp://localhost:%d\033[0m\n", servePort)
		fmt.Printf("  \033[1mRoot:\033[0m  %s\n", rootDir)
		fmt.Println()

		var frontendFS fs.FS
		if !serveDev {
			frontendFS = FrontendFS
		}
		return server.Start(rootDir, addr, serveDev, frontendFS)
	},
}
