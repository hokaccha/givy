package main

import (
	"fmt"
	"os"

	"github.com/hokaccha/givy/cmd"
)

func init() {
	cmd.FrontendFS = FrontendDist
}

func main() {
	if err := cmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
