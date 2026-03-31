import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { FileTree } from "../components/FileTree";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { getTree, getBlob } from "../api/client";
import type { TreeEntry } from "../api/client";
import { useTitle } from "../hooks/useTitle";

const README_PATTERN = /^readme\.md$/i;

export function TreeView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const path = params["*"] || "";

  useTitle(path ? `${path} · ${owner}/${repo}` : `${owner}/${repo}`);

  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [prevFetchKey, setPrevFetchKey] = useState("");

  const fetchKey = `${owner}/${repo}/${path}`;
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
    setReadme(null);
  }

  useEffect(() => {
    getTree(owner, repo, path)
      .then((data) => {
        const list = data.entries ?? [];
        setEntries(list);
        const readmeEntry = list.find(
          (e) => e.type === "blob" && README_PATTERN.test(e.name),
        );
        if (readmeEntry) {
          const readmePath = path ? `${path}/${readmeEntry.name}` : readmeEntry.name;
          getBlob(owner, repo, readmePath)
            .then((blob) => setReadme(blob.content))
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, path]);

  const repoLabel = <>{owner} <span className="text-gray-400">/</span> {repo}</>;
  const breadcrumbItems: Array<{ label: React.ReactNode; href?: string }> = [
    { label: repoLabel, href: path ? `/${owner}/${repo}` : undefined },
  ];
  if (path) {
    const segments = path.split("/");
    segments.forEach((seg, i) => {
      const subPath = segments.slice(0, i + 1).join("/");
      if (i === segments.length - 1) {
        breadcrumbItems.push({ label: seg });
      } else {
        breadcrumbItems.push({
          label: seg,
          href: `/${owner}/${repo}/tree/${subPath}`,
        });
      }
    });
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Breadcrumb items={breadcrumbItems} size="lg" />
          {!path && (
            <div className="flex items-center gap-2">
              <a
                href={`https://github.com/${owner}/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                title="View on GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                </svg>
                GitHub
              </a>
              <Link
                to={`/${owner}/${repo}/changes`}
                className="px-4 py-1.5 text-sm font-medium text-white bg-[#0969da] rounded-md hover:bg-[#0860ca]"
              >
                View Diff
              </Link>
            </div>
          )}
        </div>

        {loading && <p className="text-gray-500 mt-4">Loading...</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
        {!loading && !error && (
          <>
            <div className={path ? "" : "mt-4"}>
              <FileTree
                entries={entries}
                owner={owner}
                repo={repo}
                currentPath={path}
              />
            </div>
            {readme && (
              <div className="mt-6">
                <MarkdownViewer
                  content={readme}
                  rawBaseUrl={`/api/repos/${owner}/${repo}/raw${path ? `/${path}` : ""}`}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
