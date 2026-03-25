import { useState, useCallback } from "react";
import {
  createCommentStore,
  buildCommentKey,
  formatPrompt,
  formatAllPrompts,
} from "../lib/comments";
import type { Comment } from "../lib/comments";

const store = createCommentStore();

export function useComments(
  owner: string,
  repo: string,
  base: string,
  head: string
) {
  const key = buildCommentKey(owner, repo, base, head);
  const [comments, setComments] = useState<Comment[]>(() =>
    store.getComments(key)
  );

  const refresh = useCallback(() => {
    setComments(store.getComments(key));
  }, [key]);

  const addComment = useCallback(
    (input: Omit<Comment, "id" | "createdAt" | "updatedAt">) => {
      store.addComment(key, input);
      refresh();
    },
    [key, refresh]
  );

  const updateComment = useCallback(
    (id: string, body: string) => {
      store.updateComment(key, id, body);
      refresh();
    },
    [key, refresh]
  );

  const deleteComment = useCallback(
    (id: string) => {
      store.deleteComment(key, id);
      refresh();
    },
    [key, refresh]
  );

  const getFileComments = useCallback(
    (filePath: string) => comments.filter((c) => c.filePath === filePath),
    [comments]
  );

  const copyPrompt = useCallback(
    (filePath: string, diffContext?: string) => {
      const fileComments = getFileComments(filePath);
      const text = formatPrompt(filePath, fileComments, diffContext);
      navigator.clipboard.writeText(text);
    },
    [getFileComments]
  );

  const copyAllPrompts = useCallback(
    (
      files: Array<{
        filePath: string;
        diffContext?: string;
      }>
    ) => {
      const fileComments = files.map((f) => ({
        filePath: f.filePath,
        comments: getFileComments(f.filePath),
        diffContext: f.diffContext,
      }));
      const text = formatAllPrompts(fileComments);
      navigator.clipboard.writeText(text);
    },
    [getFileComments]
  );

  return {
    comments,
    addComment,
    updateComment,
    deleteComment,
    getFileComments,
    copyPrompt,
    copyAllPrompts,
  };
}
