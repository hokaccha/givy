package main

import "embed"

// FrontendDist contains the built frontend assets.
//
//go:embed all:frontend/dist
var FrontendDist embed.FS
