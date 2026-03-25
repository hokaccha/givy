package git

// RepoInfo represents a discovered git repository.
type RepoInfo struct {
	Owner        string `json:"owner"`
	Name         string `json:"name"`
	DefaultBranch string `json:"defaultBranch"`
}

// TreeEntry represents a single entry in a git tree (file or directory).
type TreeEntry struct {
	Name string `json:"name"`
	Type string `json:"type"` // "blob" or "tree"
	Mode string `json:"mode"`
	Size int64  `json:"size"`
	Hash string `json:"-"`
}

// BranchInfo represents a git branch.
type BranchInfo struct {
	Name       string `json:"name"`
	IsDefault  bool   `json:"isDefault"`
	LastCommit string `json:"lastCommit"`
}

// BlobContent represents the content of a file.
type BlobContent struct {
	Content  string `json:"content"`
	Size     int64  `json:"size"`
	IsBinary bool   `json:"isBinary"`
	Encoding string `json:"encoding,omitempty"` // "base64" for binary
}

// DiffStat represents the stats of a diff for one file.
type DiffStat struct {
	Path      string `json:"path"`
	Status    string `json:"status"` // "modified", "added", "deleted", "renamed"
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
}

// DiffResult represents the result of comparing two refs.
type DiffResult struct {
	Base  string     `json:"base"`
	Head  string     `json:"head"`
	Files []DiffStat `json:"files"`
	Patch string     `json:"patch"` // Full unified diff
	Stats struct {
		Files     int `json:"files"`
		Additions int `json:"additions"`
		Deletions int `json:"deletions"`
	} `json:"stats"`
}
