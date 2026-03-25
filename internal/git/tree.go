package git

import (
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
)

// ListTree returns the entries in a directory at the given ref and path.
func ListTree(repoPath, ref, path string) ([]TreeEntry, error) {
	args := []string{"ls-tree", "-l", ref}
	if path != "" {
		// Append "/" to list contents of a directory, not the directory entry itself
		if !strings.HasSuffix(path, "/") {
			path = path + "/"
		}
		args = append(args, "--", path)
	}

	out, err := runGit(repoPath, args...)
	if err != nil {
		return nil, err
	}

	if out == "" {
		return []TreeEntry{}, nil
	}

	return parseTreeOutput(out)
}

// parseTreeOutput parses the output of `git ls-tree -l`.
// Format: <mode> <type> <hash> <size>\t<name>
func parseTreeOutput(output string) ([]TreeEntry, error) {
	var entries []TreeEntry
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		if line == "" {
			continue
		}

		// Split on tab to separate metadata from name
		parts := strings.SplitN(line, "\t", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("unexpected ls-tree line: %q", line)
		}

		name := parts[1]
		fields := strings.Fields(parts[0])
		if len(fields) != 4 {
			return nil, fmt.Errorf("unexpected ls-tree metadata: %q", parts[0])
		}

		var size int64
		if fields[3] != "-" {
			s, err := strconv.ParseInt(strings.TrimSpace(fields[3]), 10, 64)
			if err != nil {
				return nil, fmt.Errorf("parse size %q: %w", fields[3], err)
			}
			size = s
		}

		entries = append(entries, TreeEntry{
			Mode: fields[0],
			Type: fields[1],
			Hash: fields[2],
			Size: size,
			Name: name,
		})
	}

	return entries, nil
}

// ReadBlob reads the content of a file at the given ref and path.
func ReadBlob(repoPath, ref, path string) (*BlobContent, error) {
	raw, err := runGitRaw(repoPath, "show", fmt.Sprintf("%s:%s", ref, path))
	if err != nil {
		return nil, err
	}

	isBinary := isBinaryContent(raw)
	size := int64(len(raw))

	if isBinary {
		return &BlobContent{
			Content:  base64.StdEncoding.EncodeToString(raw),
			Size:     size,
			IsBinary: true,
			Encoding: "base64",
		}, nil
	}

	return &BlobContent{
		Content:  string(raw),
		Size:     size,
		IsBinary: false,
	}, nil
}

// isBinaryContent checks if the content appears to be binary.
func isBinaryContent(data []byte) bool {
	// Check for null bytes in the first 8000 bytes (same heuristic as git)
	limit := len(data)
	if limit > 8000 {
		limit = 8000
	}
	for _, b := range data[:limit] {
		if b == 0 {
			return true
		}
	}
	return false
}
