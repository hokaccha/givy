import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { CodeViewer } from "../components/CodeViewer";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { ImageViewer } from "../components/ImageViewer";
import { BinaryViewer } from "../components/BinaryViewer";
import { getBlob } from "../api/client";
import type { BlobResponse } from "../api/client";

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

  const [blob, setBlob] = useState<BlobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getBlob(owner, repo, path)
      .then(setBlob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, path]);

  const segments = path.split("/");
  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: owner, href: `/${owner}` },
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

  function renderContent() {
    if (!blob) return null;

    if (blob.isBinary) {
      if (isImage(fileName)) {
        return <ImageViewer content={blob.content} fileName={fileName} />;
      }
      return <BinaryViewer fileName={fileName} size={blob.size} />;
    }

    if (isMarkdown(fileName)) {
      return <MarkdownViewer content={blob.content} />;
    }

    return <CodeViewer code={blob.content} language="" fileName={fileName} />;
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && renderContent()}
      </div>
    </Layout>
  );
}
