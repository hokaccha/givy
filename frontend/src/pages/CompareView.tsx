import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { DiffViewer } from "../components/DiffViewer";
import { getCompare } from "../api/client";
import { parseDiff } from "../lib/diff-parser";
import { useComments } from "../hooks/useComments";
import type { DiffFile } from "../lib/diff-parser";
import type { DiffStat } from "../api/client";
import { useTitle } from "../hooks/useTitle";

export function CompareView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const spec = params["*"]!;

  // Parse base...head (head may contain slashes, e.g. feature/foo)
  const dotIndex = spec.indexOf("...");
  const base = dotIndex >= 0 ? spec.slice(0, dotIndex) : spec;
  const head = dotIndex >= 0 ? spec.slice(dotIndex + 3) : "";

  useTitle(`${base}...${head} · ${owner}/${repo}`);

  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [, setFileStats] = useState<DiffStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevFetchKey, setPrevFetchKey] = useState("");

  const fetchKey = `${owner}/${repo}/${base}/${head}`;
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
    getCompare(owner, repo, base, head)
      .then((data) => {
        setFileStats(data.files);
        setDiffFiles(parseDiff(data.patch));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, base, head]);

  const breadcrumbItems = [
    { label: repo, href: `/${owner}/${repo}` },
    { label: `${base}...${head}` },
  ];

  return (
    <Layout>
      <div className="mx-auto p-4" style={{ maxWidth: "1600px" }}>
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} size="base" />
          <div className="flex items-center gap-4 mt-2">
            <h2 className="text-sm text-[#636c76]">
              Comparing{" "}
              <span className="font-mono text-xs bg-[#eff1f3] px-1.5 py-0.5 rounded-md text-[#1f2328]">{base}</span>
              {" "}...{" "}
              <span className="font-mono text-xs bg-[#eff1f3] px-1.5 py-0.5 rounded-md text-[#1f2328]">{head}</span>
            </h2>
            <Link
              to={`/${owner}/${repo}/commits/${base}...${head}`}
              className="text-sm text-[#0969da] hover:underline"
            >
              View commits
            </Link>
          </div>
        </div>

        {loading && <p className="text-[#636c76]">Loading...</p>}
        {error && <p className="text-[#cf222e]">{error}</p>}
        {!loading && !error && (
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
