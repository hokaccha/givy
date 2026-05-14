export interface FileTreeFileNode {
  type: "file";
  name: string;
  path: string;
}

export interface FileTreeDirNode {
  type: "dir";
  name: string;
  path: string;
  children: FileTreeNode[];
}

export type FileTreeNode = FileTreeFileNode | FileTreeDirNode;

interface RawDir {
  children: Map<string, RawDir>;
  files: string[];
}

/**
 * Build a file tree from a flat list of paths.
 *
 * Chains of directories with a single sub-directory and no files are compressed
 * into one node — `a/b/c.go` and `a/b/d.go` yield a single `a/b` dir node
 * containing `c.go` and `d.go`, matching GitHub's diff sidebar behavior.
 */
export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: RawDir = { children: new Map(), files: [] };

  for (const path of paths) {
    const segments = path.split("/");
    let cur = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      let next = cur.children.get(seg);
      if (!next) {
        next = { children: new Map(), files: [] };
        cur.children.set(seg, next);
      }
      cur = next;
    }
    cur.files.push(segments[segments.length - 1]);
  }

  return convertChildren(root, "");
}

function convertChildren(dir: RawDir, parentPath: string): FileTreeNode[] {
  const result: FileTreeNode[] = [];

  const dirEntries = [...dir.children.entries()].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
  );
  for (const [name, sub] of dirEntries) {
    result.push(buildDirNode(sub, parentPath, name));
  }

  const fileNames = [...dir.files].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const fileName of fileNames) {
    result.push({
      type: "file",
      name: fileName,
      path: parentPath ? `${parentPath}/${fileName}` : fileName,
    });
  }

  return result;
}

function buildDirNode(
  dir: RawDir,
  parentPath: string,
  dirName: string
): FileTreeDirNode {
  let cur = dir;
  let name = dirName;
  let path = parentPath ? `${parentPath}/${dirName}` : dirName;

  while (cur.files.length === 0 && cur.children.size === 1) {
    const [childName, childDir] = [...cur.children.entries()][0];
    name = `${name}/${childName}`;
    path = `${path}/${childName}`;
    cur = childDir;
  }

  return {
    type: "dir",
    name,
    path,
    children: convertChildren(cur, path),
  };
}

/**
 * Collect every directory path in the tree (used to expand all by default).
 */
export function collectDirPaths(nodes: FileTreeNode[]): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    if (node.type === "dir") {
      out.push(node.path);
      out.push(...collectDirPaths(node.children));
    }
  }
  return out;
}
