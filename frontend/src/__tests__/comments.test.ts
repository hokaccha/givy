import { describe, it, expect, beforeEach } from "vitest";
import {
  createCommentStore,
  buildCommentKey,
  formatPrompt,
  formatAllPrompts,
} from "../lib/comments";
import type { Comment } from "../lib/comments";

// Simple in-memory Storage implementation for testing
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("buildCommentKey", () => {
  it("builds a key from repo and diff identifiers", () => {
    const key = buildCommentKey("owner", "repo", "main", "feature/test");
    expect(key).toBe("owner/repo:main...feature/test");
  });
});

describe("CommentStore", () => {
  let storage: MemoryStorage;
  let store: ReturnType<typeof createCommentStore>;
  const key = "owner/repo:main...feature";

  beforeEach(() => {
    storage = new MemoryStorage();
    store = createCommentStore(storage);
  });

  it("returns empty array when no comments exist", () => {
    expect(store.getComments(key)).toEqual([]);
  });

  it("adds a comment and retrieves it", () => {
    const comment = store.addComment(key, {
      filePath: "src/main.go",
      startLine: 5,
      endLine: 5,
      side: "right",
      body: "Fix this",
    });

    expect(comment.id).toBeTruthy();
    expect(comment.body).toBe("Fix this");
    expect(comment.createdAt).toBeTruthy();

    const comments = store.getComments(key);
    expect(comments).toHaveLength(1);
    expect(comments[0].body).toBe("Fix this");
  });

  it("stores comments in the provided storage", () => {
    store.addComment(key, {
      filePath: "src/main.go",
      startLine: 1,
      endLine: 1,
      side: "right",
      body: "Test",
    });

    const raw = storage.getItem(`givy:comments:${key}`);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
  });

  it("updates a comment", async () => {
    const comment = store.addComment(key, {
      filePath: "src/main.go",
      startLine: 5,
      endLine: 5,
      side: "right",
      body: "Original",
    });

    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 5));

    const updated = store.updateComment(key, comment.id, "Updated");
    expect(updated).not.toBeNull();
    expect(updated!.body).toBe("Updated");

    const comments = store.getComments(key);
    expect(comments[0].body).toBe("Updated");
  });

  it("returns null when updating non-existent comment", () => {
    const result = store.updateComment(key, "non-existent", "text");
    expect(result).toBeNull();
  });

  it("deletes a comment", () => {
    const comment = store.addComment(key, {
      filePath: "src/main.go",
      startLine: 5,
      endLine: 5,
      side: "right",
      body: "To delete",
    });

    const deleted = store.deleteComment(key, comment.id);
    expect(deleted).toBe(true);
    expect(store.getComments(key)).toHaveLength(0);
  });

  it("returns false when deleting non-existent comment", () => {
    expect(store.deleteComment(key, "non-existent")).toBe(false);
  });

  it("handles multiple comments", () => {
    store.addComment(key, {
      filePath: "file1.go",
      startLine: 1,
      endLine: 1,
      side: "right",
      body: "Comment 1",
    });
    store.addComment(key, {
      filePath: "file2.go",
      startLine: 10,
      endLine: 15,
      side: "left",
      body: "Comment 2",
    });

    const comments = store.getComments(key);
    expect(comments).toHaveLength(2);
  });

  it("clears all comments for a key", () => {
    store.addComment(key, {
      filePath: "file1.go",
      startLine: 1,
      endLine: 1,
      side: "right",
      body: "Comment 1",
    });
    store.addComment(key, {
      filePath: "file2.go",
      startLine: 2,
      endLine: 2,
      side: "right",
      body: "Comment 2",
    });

    expect(store.getComments(key)).toHaveLength(2);
    store.clearAll(key);
    expect(store.getComments(key)).toHaveLength(0);
  });

  it("handles corrupted storage data gracefully", () => {
    storage.setItem(`givy:comments:${key}`, "not valid json");
    expect(store.getComments(key)).toEqual([]);
  });
});

describe("formatPrompt", () => {
  const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
    id: "1",
    filePath: "src/main.go",
    startLine: 5,
    endLine: 5,
    side: "right" as const,
    body: "Fix this logic",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  });

  it("formats a single comment", () => {
    const result = formatPrompt("src/main.go", [makeComment()]);
    expect(result).toContain("## src/main.go");
    expect(result).toContain("Line 5");
    expect(result).toContain("Fix this logic");
  });

  it("formats a range comment", () => {
    const result = formatPrompt("src/main.go", [
      makeComment({ startLine: 5, endLine: 10 }),
    ]);
    expect(result).toContain("Lines 5-10");
  });

  it("includes diff context when provided", () => {
    const diffContext = "-old line\n+new line";
    const result = formatPrompt("src/main.go", [makeComment()], diffContext);
    expect(result).toContain("```diff");
    expect(result).toContain(diffContext);
  });
});

describe("formatAllPrompts", () => {
  const makeComment = (body: string, filePath: string): Comment => ({
    id: "1",
    filePath,
    startLine: 1,
    endLine: 1,
    side: "right",
    body,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  });

  it("formats comments across multiple files", () => {
    const result = formatAllPrompts([
      { filePath: "file1.go", comments: [makeComment("Comment 1", "file1.go")] },
      { filePath: "file2.go", comments: [makeComment("Comment 2", "file2.go")] },
    ]);
    expect(result).toContain("## file1.go");
    expect(result).toContain("## file2.go");
    expect(result).toContain("---");
  });

  it("skips files with no comments", () => {
    const result = formatAllPrompts([
      { filePath: "file1.go", comments: [makeComment("Comment 1", "file1.go")] },
      { filePath: "file2.go", comments: [] },
    ]);
    expect(result).toContain("## file1.go");
    expect(result).not.toContain("## file2.go");
  });
});
