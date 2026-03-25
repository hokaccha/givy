import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { BranchSelector } from "../components/BranchSelector";
import { FileTree } from "../components/FileTree";
import { getTree } from "../api/client";
import type { TreeEntry } from "../api/client";

export function TreeView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const ref = params.ref!;
  const path = params["*"] || "";

  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTree(owner, repo, ref, path)
      .then((data) => setEntries(data.entries ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, ref, path]);

  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: owner, href: "/" },
    { label: repo, href: `/${owner}/${repo}/tree/${ref}` },
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
          href: `/${owner}/${repo}/tree/${ref}/${subPath}`,
        });
      }
    });
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-4">
          <BranchSelector
            owner={owner}
            repo={repo}
            currentRef={ref}
            basePath="tree"
            subPath={path}
          />
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <FileTree
            entries={entries}
            owner={owner}
            repo={repo}
            refName={ref}
            currentPath={path}
          />
        )}
      </div>
    </Layout>
  );
}
