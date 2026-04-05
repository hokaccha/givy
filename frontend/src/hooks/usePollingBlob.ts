import { useEffect, useRef, useCallback } from "react";
import { getBlob } from "../api/client";
import type { BlobResponse } from "../api/client";

export function usePollingBlob(
  owner: string,
  repo: string,
  path: string,
  enabled: boolean,
  onUpdate: (blob: BlobResponse) => void,
  intervalMs = 1000,
) {
  const lastContentRef = useRef<string | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const stableOnUpdate = useCallback((blob: BlobResponse) => {
    onUpdateRef.current(blob);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const blob = await getBlob(owner, repo, path);
        if (blob.content !== lastContentRef.current) {
          lastContentRef.current = blob.content;
          stableOnUpdate(blob);
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [owner, repo, path, enabled, intervalMs, stableOnUpdate]);
}
