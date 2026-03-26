import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { DiffViewer } from "../components/DiffViewer";
import { getDiffUnstaged, getDiffStaged } from "../api/client";
import { parseDiff } from "../lib/diff-parser";
import { useComments } from "../hooks/useComments";
import type { DiffFile } from "../lib/diff-parser";
import { useTitle } from "../hooks/useTitle";

type Tab = "unstaged" | "staged";

const TAB_CONFIG: Record<Tab, { label: string; base: string; head: string }> = {
  unstaged: { label: "Unstaged", base: "index", head: "worktree" },
  staged: { label: "Staged", base: "HEAD", head: "index" },
};

export function ChangesView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = (searchParams.get("tab") as Tab) || "unstaged";
  const { base, head } = TAB_CONFIG[tab] ?? TAB_CONFIG.unstaged;

  useTitle(`Changes · ${owner}/${repo}`);

  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevFetchKey, setPrevFetchKey] = useState("");

  const fetchKey = `${owner}/${repo}/${tab}`;
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  const {
    comments,
    addComment,
    updateComment,
    deleteComment,
    clearAll,
    copyAllPrompts,
  } = useComments(owner, repo, base, head);

  useEffect(() => {
    const fetcher = tab === "staged" ? getDiffStaged : getDiffUnstaged;
    fetcher(owner, repo)
      .then((data) => {
        setDiffFiles(parseDiff(data.patch));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, tab]);

  const setTab = (t: Tab) => {
    setSearchParams(t === "unstaged" ? {} : { tab: t });
  };

  const breadcrumbItems = [
    { label: owner, href: `/${owner}` },
    { label: repo, href: `/${owner}/${repo}` },
    { label: "Working Changes" },
  ];

  return (
    <Layout>
      <div className="mx-auto p-4" style={{ maxWidth: "1600px" }}>
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} size="base" />
          <div className="flex items-center gap-1 mt-3">
            {(Object.keys(TAB_CONFIG) as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md ${
                  tab === t
                    ? "bg-[#0969da] text-white"
                    : "bg-[#f6f8fa] text-[#1f2328] hover:bg-[#eaeef2]"
                }`}
              >
                {TAB_CONFIG[t].label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-[#636c76]">Loading...</p>}
        {error && <p className="text-[#cf222e]">{error}</p>}
        {!loading && !error && diffFiles.length === 0 && (
          <p className="text-[#636c76] mt-4">No {TAB_CONFIG[tab].label.toLowerCase()} changes.</p>
        )}
        {!loading && !error && diffFiles.length > 0 && (
          <DiffViewer
            files={diffFiles}
            comments={comments}
            onAddComment={addComment}
            onUpdateComment={updateComment}
            onDeleteComment={deleteComment}
            onClearAllComments={clearAll}
            onCopyAllPrompts={() =>
              copyAllPrompts(diffFiles.map((f) => ({ filePath: f.newPath })))
            }
          />
        )}
      </div>
    </Layout>
  );
}
