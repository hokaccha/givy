import { describe, it, expect } from "vitest";
import { buildFileTree, collectDirPaths } from "../lib/file-tree";

describe("buildFileTree", () => {
  it("returns empty array for no paths", () => {
    expect(buildFileTree([])).toEqual([]);
  });

  it("treats top-level files as leaves at the root", () => {
    const tree = buildFileTree(["README.md", "LICENSE"]);
    expect(tree).toEqual([
      { type: "file", name: "LICENSE", path: "LICENSE" },
      { type: "file", name: "README.md", path: "README.md" },
    ]);
  });

  it("groups files under their directory", () => {
    const tree = buildFileTree(["src/main.go", "src/main_test.go"]);
    expect(tree).toEqual([
      {
        type: "dir",
        name: "src",
        path: "src",
        children: [
          { type: "file", name: "main.go", path: "src/main.go" },
          { type: "file", name: "main_test.go", path: "src/main_test.go" },
        ],
      },
    ]);
  });

  it("sorts directories before files at the same level", () => {
    const tree = buildFileTree(["a.txt", "b/c.txt"]);
    expect(tree.map((n) => n.name)).toEqual(["b", "a.txt"]);
  });

  it("sorts entries alphabetically within each level", () => {
    const tree = buildFileTree(["b/x.txt", "a/y.txt", "a/x.txt"]);
    expect(tree.map((n) => n.name)).toEqual(["a", "b"]);
    const aDir = tree[0];
    if (aDir.type !== "dir") throw new Error("expected dir");
    expect(aDir.children.map((c) => c.name)).toEqual(["x.txt", "y.txt"]);
  });

  it("compresses chains of single-child directories", () => {
    const tree = buildFileTree(["terraform/gl/ubie-svc/dev/shared_vpc.tf"]);
    expect(tree).toEqual([
      {
        type: "dir",
        name: "terraform/gl/ubie-svc/dev",
        path: "terraform/gl/ubie-svc/dev",
        children: [
          {
            type: "file",
            name: "shared_vpc.tf",
            path: "terraform/gl/ubie-svc/dev/shared_vpc.tf",
          },
        ],
      },
    ]);
  });

  it("stops compression at a directory that has multiple children", () => {
    const tree = buildFileTree([
      "terraform/gl/dev/a.tf",
      "terraform/jp/dev/b.tf",
    ]);
    expect(tree.length).toBe(1);
    const top = tree[0];
    if (top.type !== "dir") throw new Error("expected dir");
    expect(top.name).toBe("terraform");
    expect(top.children.map((c) => c.name)).toEqual(["gl/dev", "jp/dev"]);
  });

  it("stops compression when a directory also contains a file", () => {
    const tree = buildFileTree(["a/b.txt", "a/c/d.txt"]);
    const top = tree[0];
    if (top.type !== "dir") throw new Error("expected dir");
    expect(top.name).toBe("a");
    expect(top.children.map((c) => c.name)).toEqual(["c", "b.txt"]);
  });
});

describe("collectDirPaths", () => {
  it("returns every directory path in the tree", () => {
    const tree = buildFileTree([
      "a/b/c.txt",
      "a/d.txt",
      "e/f.txt",
    ]);
    expect(collectDirPaths(tree).sort()).toEqual(["a", "a/b", "e"]);
  });
});
