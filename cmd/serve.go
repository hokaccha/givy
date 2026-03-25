package cmd

import (
	"fmt"
	"io/fs"
	"log"

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
	serveCmd.Flags().IntVar(&servePort, "port", 6271, "port to listen on")
	serveCmd.Flags().BoolVar(&serveDev, "dev", false, "enable dev mode (proxy frontend to Vite)")
	rootCmd.AddCommand(serveCmd)
}

var serveCmd = &cobra.Command{
	Use:   "serve <directory>",
	Short: "Start the web server",
	Long:  "Start the givy web server, serving repositories from the specified directory.",
	Args:  cobra.ExactArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		rootDir := args[0]
		addr := fmt.Sprintf(":%d", servePort)
		log.Printf("Starting givy server on http://localhost:%d (root: %s)", servePort, rootDir)

		var frontendFS fs.FS
		if !serveDev {
			frontendFS = FrontendFS
		}
		return server.Start(rootDir, addr, serveDev, frontendFS)
	},
}
