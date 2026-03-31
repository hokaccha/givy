import { useEffect, useState, useCallback } from "react";
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

  const breadcrumbItems: Array<{ label: React.ReactNode; href?: string }> = [
    { label: repo, href: path ? `/${owner}/${repo}` : undefined },
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

  const [copied, setCopied] = useState(false);
  const copyPath = useCallback(() => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [path]);

  const githubTreeUrl = path
    ? `https://github.com/${owner}/${repo}/tree/HEAD/${path}`
    : `https://github.com/${owner}/${repo}`;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Breadcrumb items={breadcrumbItems} size="lg" />
            {path && (
              <>
                <button
                  onClick={copyPath}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer relative"
                  title="Copy path"
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
                      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
                    </svg>
                  )}
                </button>
                <a
                  href={githubTreeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-700"
                  title="View on GitHub"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                  </svg>
                </a>
              </>
            )}
          </div>
          {!path && (
            <div className="flex items-center gap-2">
              <a
                href={githubTreeUrl}
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
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[#2da44e] rounded-md hover:bg-[#2c974b]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />
                </svg>
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
