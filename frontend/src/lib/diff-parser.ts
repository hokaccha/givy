export interface DiffHunkHeader {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  section: string;
}

export type DiffLineType = "add" | "remove" | "context";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLine: number | null;
  newLine: number | null;
}

export interface DiffHunk {
  header: DiffHunkHeader;
  lines: DiffLine[];
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
}

/**
 * Parse a unified diff string into structured DiffFile objects.
 */
export function parseDiff(diffText: string): DiffFile[] {
  if (!diffText.trim()) return [];

  const files: DiffFile[] = [];
  const lines = diffText.split("\n");
  let i = 0;

  while (i < lines.length) {
    // Find next "diff --git" line
    if (!lines[i].startsWith("diff --git ")) {
      i++;
      continue;
    }

    // Parse file paths from diff --git a/path b/path
    const diffLine = lines[i];
    const pathMatch = diffLine.match(/^diff --git a\/(.+) b\/(.+)$/);
    let oldPath = pathMatch ? pathMatch[1] : "";
    let newPath = pathMatch ? pathMatch[2] : "";
    i++;

    // Skip index, mode lines; look for --- and +++ or @@ lines
    while (i < lines.length && !lines[i].startsWith("---") && !lines[i].startsWith("@@")) {
      i++;
    }

    // Parse --- and +++ headers if present
    if (i < lines.length && lines[i].startsWith("---")) {
      const oldMatch = lines[i].match(/^--- (?:a\/)?(.+)$/);
      if (oldMatch) oldPath = oldMatch[1];
      i++;
    }
    if (i < lines.length && lines[i].startsWith("+++")) {
      const newMatch = lines[i].match(/^\+\+\+ (?:b\/)?(.+)$/);
      if (newMatch) newPath = newMatch[1];
      i++;
    }

    const hunks: DiffHunk[] = [];

    // Parse hunks
    while (i < lines.length && !lines[i].startsWith("diff --git ")) {
      if (lines[i].startsWith("@@")) {
        const header = parseHunkHeader(lines[i]);
        if (!header) {
          i++;
          continue;
        }
        i++;

        const hunkLines: DiffLine[] = [];
        let oldLine = header.oldStart;
        let newLine = header.newStart;

        while (i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("diff --git ")) {
          const line = lines[i];
          if (line.startsWith("+")) {
            hunkLines.push({
              type: "add",
              content: line.slice(1),
              oldLine: null,
              newLine: newLine++,
            });
          } else if (line.startsWith("-")) {
            hunkLines.push({
              type: "remove",
              content: line.slice(1),
              oldLine: oldLine++,
              newLine: null,
            });
          } else if (line.startsWith(" ") || line === "") {
            hunkLines.push({
              type: "context",
              content: line.startsWith(" ") ? line.slice(1) : line,
              oldLine: oldLine++,
              newLine: newLine++,
            });
          } else if (line.startsWith("\\")) {
            // "\ No newline at end of file" — skip
          } else {
            // Unknown line, treat as context
            hunkLines.push({
              type: "context",
              content: line,
              oldLine: oldLine++,
              newLine: newLine++,
            });
          }
          i++;
        }

        hunks.push({ header, lines: hunkLines });
      } else {
        i++;
      }
    }

    files.push({ oldPath, newPath, hunks });
  }

  return files;
}

/**
 * Parse a hunk header line like "@@ -1,5 +1,7 @@ func main()"
 */
export function parseHunkHeader(line: string): DiffHunkHeader | null {
  const match = line.match(
    /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@\s*(.*)/
  );
  if (!match) return null;
  return {
    oldStart: parseInt(match[1], 10),
    oldCount: match[2] !== undefined ? parseInt(match[2], 10) : 1,
    newStart: parseInt(match[3], 10),
    newCount: match[4] !== undefined ? parseInt(match[4], 10) : 1,
    section: match[5] || "",
  };
}
