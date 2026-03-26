import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { SimpleDiffViewer } from "../components/SimpleDiffViewer";
import { getCommit } from "../api/client";
import { parseDiff } from "../lib/diff-parser";
import type { DiffFile } from "../lib/diff-parser";
import type { CommitInfo } from "../api/client";

export function CommitView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const commitId = params.commitId!;

  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [commit, setCommit] = useState<CommitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevFetchKey, setPrevFetchKey] = useState("");

  const fetchKey = `${owner}/${repo}/${commitId}`;
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    getCommit(owner, repo, commitId)
      .then((data) => {
        setCommit(data.commit);
        setDiffFiles(parseDiff(data.patch));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, commitId]);

  const shortHash = commitId.slice(0, 7);

  const breadcrumbItems = [
    { label: owner, href: `/${owner}` },
    { label: repo, href: `/${owner}/${repo}` },
    { label: shortHash },
  ];

  return (
    <Layout>
      <div className="mx-auto p-4" style={{ maxWidth: "1600px" }}>
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} size="base" />
          {commit && (
            <div className="mt-2">
              <h2 className="text-lg font-semibold text-[#1f2328]">
                {commit.subject}
              </h2>
              <p className="text-sm text-[#636c76] mt-1">
                <span className="font-mono text-xs bg-[#eff1f3] px-1.5 py-0.5 rounded-md text-[#1f2328]">
                  {commit.hash.slice(0, 7)}
                </span>
                {" "}by {commit.author} on{" "}
                {new Date(commit.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {loading && <p className="text-[#636c76]">Loading...</p>}
        {error && <p className="text-[#cf222e]">{error}</p>}
        {!loading && !error && <SimpleDiffViewer files={diffFiles} />}
      </div>
    </Layout>
  );
}
