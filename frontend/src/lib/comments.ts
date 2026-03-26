export interface Comment {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  side: "left" | "right";
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentStore {
  getComments(key: string): Comment[];
  addComment(key: string, comment: Omit<Comment, "id" | "createdAt" | "updatedAt">): Comment;
  updateComment(key: string, id: string, body: string): Comment | null;
  deleteComment(key: string, id: string): boolean;
  clearAll(key: string): void;
}

const STORAGE_PREFIX = "givy:comments:";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Build a storage key from repo and diff identifiers.
 */
export function buildCommentKey(
  owner: string,
  repo: string,
  base: string,
  head: string
): string {
  return `${owner}/${repo}:${base}...${head}`;
}

/**
 * Create a comment store backed by localStorage.
 */
export function createCommentStore(storage: Storage = localStorage): CommentStore {
  function storageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  function getComments(key: string): Comment[] {
    const raw = storage.getItem(storageKey(key));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Comment[];
    } catch {
      return [];
    }
  }

  function saveComments(key: string, comments: Comment[]): void {
    storage.setItem(storageKey(key), JSON.stringify(comments));
  }

  function addComment(
    key: string,
    input: Omit<Comment, "id" | "createdAt" | "updatedAt">
  ): Comment {
    const comments = getComments(key);
    const now = new Date().toISOString();
    const comment: Comment = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    comments.push(comment);
    saveComments(key, comments);
    return comment;
  }

  function updateComment(key: string, id: string, body: string): Comment | null {
    const comments = getComments(key);
    const index = comments.findIndex((c) => c.id === id);
    if (index === -1) return null;
    comments[index] = {
      ...comments[index],
      body,
      updatedAt: new Date().toISOString(),
    };
    saveComments(key, comments);
    return comments[index];
  }

  function deleteComment(key: string, id: string): boolean {
    const comments = getComments(key);
    const filtered = comments.filter((c) => c.id !== id);
    if (filtered.length === comments.length) return false;
    saveComments(key, filtered);
    return true;
  }

  function clearAll(key: string): void {
    storage.removeItem(storageKey(key));
  }

  return { getComments, addComment, updateComment, deleteComment, clearAll };
}

/**
 * Format a single file's comments as a prompt for AI agents.
 */
export function formatPrompt(filePath: string, comments: Comment[], diffContext?: string): string {
  const lines = [`## ${filePath}`];
  if (diffContext) {
    lines.push("", "```diff", diffContext, "```");
  }
  lines.push("");
  for (const comment of comments) {
    const lineRange =
      comment.startLine === comment.endLine
        ? `Line ${comment.startLine}`
        : `Lines ${comment.startLine}-${comment.endLine}`;
    lines.push(`- **${lineRange}** (${comment.side}): ${comment.body}`);
  }
  return lines.join("\n");
}

/**
 * Format all comments across files as a prompt.
 */
export function formatAllPrompts(
  fileComments: Array<{ filePath: string; comments: Comment[]; diffContext?: string }>
): string {
  const sections = fileComments
    .filter((fc) => fc.comments.length > 0)
    .map((fc) => formatPrompt(fc.filePath, fc.comments, fc.diffContext));
  return sections.join("\n\n---\n\n");
}
