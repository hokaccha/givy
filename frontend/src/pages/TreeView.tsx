import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { FileTree } from "../components/FileTree";
import { ReviewLauncher } from "../components/ReviewLauncher";
import { getTree } from "../api/client";
import type { TreeEntry } from "../api/client";

export function TreeView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const path = params["*"] || "";

  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTree(owner, repo, path)
      .then((data) => setEntries(data.entries ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, path]);

  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: owner, href: "/" },
    { label: repo, href: `/${owner}/${repo}` },
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
        <div className="flex items-center gap-4 mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {!path && <ReviewLauncher owner={owner} repo={repo} />}

        {loading && <p className="text-gray-500 mt-4">Loading...</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
        {!loading && !error && (
          <div className={path ? "" : "mt-4"}>
            <FileTree
              entries={entries}
              owner={owner}
              repo={repo}
              currentPath={path}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
