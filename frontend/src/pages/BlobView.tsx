import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { CodeViewer } from "../components/CodeViewer";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { ImageViewer } from "../components/ImageViewer";
import { BinaryViewer } from "../components/BinaryViewer";
import { getBlob, getServerInfo } from "../api/client";
import type { BlobResponse } from "../api/client";
import { useTitle } from "../hooks/useTitle";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"]);

function isImage(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

function isMarkdown(fileName: string): boolean {
  return fileName.endsWith(".md") || fileName.endsWith(".mdx");
}

export function BlobView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const path = params["*"] || "";
  const fileName = path.split("/").pop() || "";

  useTitle(`${path || fileName} · ${owner}/${repo}`);

  const [blob, setBlob] = useState<BlobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rootDir, setRootDir] = useState<string | null>(null);
  const [prevFetchKey, setPrevFetchKey] = useState("");

  const fetchKey = `${owner}/${repo}/${path}`;
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    getServerInfo().then((info) => setRootDir(info.rootDir));
  }, []);

  useEffect(() => {
    getBlob(owner, repo, path)
      .then(setBlob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, path]);

  const segments = path.split("/");
  const breadcrumbItems: Array<{ label: React.ReactNode; href?: string }> = [
    { label: repo, href: `/${owner}/${repo}` },
  ];
  segments.forEach((seg, i) => {
    if (i === segments.length - 1) {
      breadcrumbItems.push({ label: seg });
    } else {
      const subPath = segments.slice(0, i + 1).join("/");
      breadcrumbItems.push({
        label: seg,
        href: `/${owner}/${repo}/tree/${subPath}`,
      });
    }
  });

  const [copied, setCopied] = useState(false);
  const copyPath = useCallback(() => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [path]);

  function renderContent() {
    if (!blob) return null;

    if (blob.isBinary) {
      if (isImage(fileName)) {
        return <ImageViewer content={blob.content} fileName={fileName} />;
      }
      return <BinaryViewer fileName={fileName} size={blob.size} />;
    }

    if (isMarkdown(fileName)) {
      const dir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
      const rawBase = `/api/repos/${owner}/${repo}/raw${dir ? `/${dir}` : ""}`;
      return <MarkdownViewer content={blob.content} rawBaseUrl={rawBase} />;
    }

    const absPath = rootDir ? `${rootDir}/${owner}/${repo}/${path}` : undefined;
    const githubUrl = `https://github.com/${owner}/${repo}/blob/HEAD/${path}`;
    return <CodeViewer code={blob.content} language="" fileName={fileName} filePath={path} absolutePath={absPath} githubUrl={githubUrl} />;
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-4">
          <Breadcrumb items={breadcrumbItems} size="lg" />
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
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && renderContent()}
      </div>
    </Layout>
  );
}
