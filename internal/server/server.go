// Package server sets up and starts the HTTP server.
package server

import (
	"io/fs"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/hokaccha/givy/internal/handler"
)

// Start initializes and starts the HTTP server.
// frontendFS should be the embedded frontend/dist filesystem. Pass nil to skip static serving.
func Start(rootDir, addr string, devMode bool, frontendFS fs.FS) error {
	r := chi.NewRouter()
	if devMode {
		r.Use(middleware.Logger)
	}
	r.Use(middleware.Recoverer)

	// Register API routes
	handler.RegisterRoutes(r, rootDir)

	// Serve embedded frontend for non-API routes
	if frontendFS != nil {
		serveFrontend(r, frontendFS)
	}

	return http.ListenAndServe(addr, r)
}

// serveFrontend serves the embedded SPA with fallback to index.html.
func serveFrontend(r chi.Router, frontendFS fs.FS) {
	// Strip "frontend/dist" prefix from embedded FS
	distFS, err := fs.Sub(frontendFS, "frontend/dist")
	if err != nil {
		log.Printf("Warning: could not create sub-filesystem: %v", err)
		return
	}

	fileServer := http.FileServer(http.FS(distFS))

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Skip API routes
		if strings.HasPrefix(path, "/api/") {
			http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
			return
		}

		// Try to serve the static file
		if path != "/" {
			// Check if file exists in the embedded FS
			cleanPath := strings.TrimPrefix(path, "/")
			if f, err := distFS.Open(cleanPath); err == nil {
				_ = f.Close()
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// Fallback to index.html for SPA routing
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})
}
