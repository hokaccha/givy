import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Layout } from "../components/Layout";
import { listRepos } from "../api/client";
import type { Repo } from "../api/client";

export function RepoList() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRepos()
      .then((data) => setRepos(data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Repositories</h1>
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && repos.length === 0 && (
          <p className="text-gray-500">No repositories found.</p>
        )}
        {repos.length > 0 && (
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {repos.map((repo) => (
              <li key={`${repo.owner}/${repo.name}`} className="hover:bg-gray-50">
                <Link
                  to={`/${repo.owner}/${repo.name}`}
                  className="block px-4 py-3 text-blue-600 hover:underline font-medium"
                >
                  {repo.owner}/{repo.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
