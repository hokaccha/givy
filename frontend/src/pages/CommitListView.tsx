import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { getCompareCommits } from "../api/client";
import type { CommitInfo } from "../api/client";
import { useTitle } from "../hooks/useTitle";

export function CommitListView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const spec = params["*"]!;

  const dotIndex = spec.indexOf("...");
  const base = dotIndex >= 0 ? spec.slice(0, dotIndex) : spec;
  const head = dotIndex >= 0 ? spec.slice(dotIndex + 3) : "";

  useTitle(`${base}...${head} · ${owner}/${repo}`);

  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevFetchKey, setPrevFetchKey] = useState("");

  const fetchKey = `${owner}/${repo}/${base}/${head}`;
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    getCompareCommits(owner, repo, base, head)
      .then((data) => setCommits(data.commits ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, base, head]);

  const breadcrumbItems = [
    { label: owner, href: `/${owner}` },
    { label: repo, href: `/${owner}/${repo}` },
    {
      label: `${base}...${head}`,
      href: `/${owner}/${repo}/changes/${base}...${head}`,
    },
    { label: "Commits" },
  ];

  return (
    <Layout>
      <div className="mx-auto p-4" style={{ maxWidth: "1000px" }}>
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} size="base" />
          <h2 className="text-sm text-[#636c76] mt-2">
            Commits between{" "}
            <span className="font-mono text-xs bg-[#eff1f3] px-1.5 py-0.5 rounded-md text-[#1f2328]">
              {base}
            </span>
            {" "}and{" "}
            <span className="font-mono text-xs bg-[#eff1f3] px-1.5 py-0.5 rounded-md text-[#1f2328]">
              {head}
            </span>
          </h2>
        </div>

        {loading && <p className="text-[#636c76]">Loading...</p>}
        {error && <p className="text-[#cf222e]">{error}</p>}
        {!loading && !error && (
          <div className="border border-[#d0d7de] rounded-md overflow-hidden">
            {commits.length === 0 ? (
              <p className="text-[#636c76] p-4">No commits found.</p>
            ) : (
              <ul>
                {commits.map((commit, idx) => (
                  <li
                    key={commit.hash}
                    className={`flex items-center justify-between px-4 py-3 ${
                      idx > 0 ? "border-t border-[#d0d7de]" : ""
                    } hover:bg-[#f6f8fa]`}
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/${owner}/${repo}/commit/${commit.hash}`}
                        className="text-sm font-semibold text-[#1f2328] hover:text-[#0969da] hover:underline"
                      >
                        {commit.subject}
                      </Link>
                      <p className="text-xs text-[#636c76] mt-0.5">
                        {commit.author} committed on{" "}
                        {new Date(commit.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Link
                      to={`/${owner}/${repo}/commit/${commit.hash}`}
                      className="ml-4 shrink-0 font-mono text-xs text-[#0969da] bg-[#eff1f3] px-2 py-1 rounded-md hover:bg-[#ddf4ff]"
                    >
                      {commit.hash.slice(0, 7)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
