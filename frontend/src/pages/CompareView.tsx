import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { DiffViewer } from "../components/DiffViewer";
import { getCompare } from "../api/client";
import { parseDiff } from "../lib/diff-parser";
import { useComments } from "../hooks/useComments";
import type { DiffFile } from "../lib/diff-parser";
import type { DiffStat } from "../api/client";

export function CompareView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const spec = params["*"]!;

  // Parse base...head (head may contain slashes, e.g. feature/foo)
  const dotIndex = spec.indexOf("...");
  const base = dotIndex >= 0 ? spec.slice(0, dotIndex) : spec;
  const head = dotIndex >= 0 ? spec.slice(dotIndex + 3) : "";

  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [, setFileStats] = useState<DiffStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    comments,
    addComment,
    updateComment,
    deleteComment,
    copyPrompt,
    copyAllPrompts,
  } = useComments(owner, repo, base, head);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCompare(owner, repo, base, head)
      .then((data) => {
        setFileStats(data.files);
        setDiffFiles(parseDiff(data.patch));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, base, head]);

  const breadcrumbItems = [
    { label: owner, href: `/${owner}` },
    { label: repo, href: `/${owner}/${repo}` },
    { label: `${base}...${head}` },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="text-lg font-semibold mt-2">
            Comparing{" "}
            <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{base}</span>
            {" "}...{" "}
            <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{head}</span>
          </h2>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <DiffViewer
            files={diffFiles}
            comments={comments}
            onAddComment={addComment}
            onUpdateComment={updateComment}
            onDeleteComment={deleteComment}
            onCopyPrompt={(filePath) => copyPrompt(filePath)}
            onCopyAllPrompts={() =>
              copyAllPrompts(diffFiles.map((f) => ({ filePath: f.newPath })))
            }
          />
        )}
      </div>
    </Layout>
  );
}
