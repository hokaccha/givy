import { describe, it, expect } from "vitest";
import { parseDiff, parseHunkHeader } from "../lib/diff-parser";

describe("parseHunkHeader", () => {
  it("parses a standard hunk header", () => {
    const result = parseHunkHeader("@@ -1,5 +1,7 @@ func main()");
    expect(result).toEqual({
      oldStart: 1,
      oldCount: 5,
      newStart: 1,
      newCount: 7,
      section: "func main()",
    });
  });

  it("parses header without count (single line)", () => {
    const result = parseHunkHeader("@@ -1 +1 @@");
    expect(result).toEqual({
      oldStart: 1,
      oldCount: 1,
      newStart: 1,
      newCount: 1,
      section: "",
    });
  });

  it("parses header with only new count", () => {
    const result = parseHunkHeader("@@ -0,0 +1,3 @@");
    expect(result).toEqual({
      oldStart: 0,
      oldCount: 0,
      newStart: 1,
      newCount: 3,
      section: "",
    });
  });

  it("returns null for invalid input", () => {
    expect(parseHunkHeader("not a hunk header")).toBeNull();
    expect(parseHunkHeader("")).toBeNull();
  });
});

describe("parseDiff", () => {
  it("parses a simple diff with one file", () => {
    const diff = `diff --git a/src/main.go b/src/main.go
index abc1234..def5678 100644
--- a/src/main.go
+++ b/src/main.go
@@ -1,5 +1,7 @@
 package main

-import "fmt"
+import (
+\t"fmt"
+\t"os"
+)

 func main() {`;

    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].oldPath).toBe("src/main.go");
    expect(result[0].newPath).toBe("src/main.go");
    expect(result[0].hunks).toHaveLength(1);

    const hunk = result[0].hunks[0];
    expect(hunk.header.oldStart).toBe(1);
    expect(hunk.header.oldCount).toBe(5);
    expect(hunk.header.newStart).toBe(1);
    expect(hunk.header.newCount).toBe(7);

    // Check line types
    const lineTypes = hunk.lines.map((l) => l.type);
    expect(lineTypes).toContain("context");
    expect(lineTypes).toContain("remove");
    expect(lineTypes).toContain("add");
  });

  it("parses a diff with a new file", () => {
    const diff = `diff --git a/src/main_test.go b/src/main_test.go
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/main_test.go
@@ -0,0 +1,10 @@
+package main
+
+import "testing"
+
+func TestAdd(t *testing.T) {
+\tgot := add(2, 3)
+\tif got != 5 {
+\t\tt.Errorf("add(2, 3) = %d, want 5", got)
+\t}
+}`;

    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].oldPath).toBe("/dev/null");
    expect(result[0].newPath).toBe("src/main_test.go");

    const lines = result[0].hunks[0].lines;
    expect(lines.every((l) => l.type === "add")).toBe(true);
    expect(lines).toHaveLength(10);
  });

  it("parses a diff with multiple files", () => {
    const diff = `diff --git a/file1.txt b/file1.txt
index abc..def 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
 line1
-line2
+line2modified
 line3
diff --git a/file2.txt b/file2.txt
index abc..def 100644
--- a/file2.txt
+++ b/file2.txt
@@ -1,2 +1,3 @@
 hello
+world
 end`;

    const result = parseDiff(diff);
    expect(result).toHaveLength(2);
    expect(result[0].oldPath).toBe("file1.txt");
    expect(result[1].oldPath).toBe("file2.txt");
  });

  it("assigns correct line numbers", () => {
    const diff = `diff --git a/test.txt b/test.txt
index abc..def 100644
--- a/test.txt
+++ b/test.txt
@@ -3,4 +3,5 @@
 context line
-removed line
+added line 1
+added line 2
 more context`;

    const result = parseDiff(diff);
    const lines = result[0].hunks[0].lines;

    // Context line at old:3, new:3
    expect(lines[0]).toMatchObject({
      type: "context",
      oldLine: 3,
      newLine: 3,
    });

    // Removed line at old:4, new:null
    expect(lines[1]).toMatchObject({
      type: "remove",
      oldLine: 4,
      newLine: null,
    });

    // Added lines at old:null, new:4 and new:5
    expect(lines[2]).toMatchObject({
      type: "add",
      oldLine: null,
      newLine: 4,
    });
    expect(lines[3]).toMatchObject({
      type: "add",
      oldLine: null,
      newLine: 5,
    });

    // Context at old:5, new:6
    expect(lines[4]).toMatchObject({
      type: "context",
      oldLine: 5,
      newLine: 6,
    });
  });

  it("returns empty array for empty input", () => {
    expect(parseDiff("")).toEqual([]);
  });

  it("parses diff with multiple hunks in one file", () => {
    const diff = `diff --git a/test.txt b/test.txt
index abc..def 100644
--- a/test.txt
+++ b/test.txt
@@ -1,3 +1,3 @@
 line1
-old2
+new2
 line3
@@ -10,3 +10,3 @@
 line10
-old11
+new11
 line12`;

    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].hunks).toHaveLength(2);
    expect(result[0].hunks[0].header.oldStart).toBe(1);
    expect(result[0].hunks[1].header.oldStart).toBe(10);
  });
});
