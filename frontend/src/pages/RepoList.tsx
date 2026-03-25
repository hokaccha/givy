import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Layout } from "../components/Layout";
import { searchRepos, getServerInfo } from "../api/client";
import type { Repo } from "../api/client";

export function RepoList() {
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootDir, setRootDir] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback((q: string) => {
    abortRef.current?.abort();
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    const limit = q.trim() === "" ? 20 : undefined;
    searchRepos(q, limit)
      .then((data) => {
        if (!controller.signal.aborted) {
          setRepos(data.repos ?? []);
          setTotalCount(data.totalCount);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    inputRef.current?.focus();
    getServerInfo().then((info) => setRootDir(info.rootDir));
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-semibold">Repositories</h1>
          {rootDir && (
            <span className="text-sm text-gray-500">{rootDir}</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search repositories..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {error && <p className="text-red-600">{error}</p>}
        {loading && <p className="text-gray-500 text-sm">Searching...</p>}
        {!loading && repos.length === 0 && !error && (
          <p className="text-gray-500">No repositories found.</p>
        )}
        {repos.length > 0 && (
          <>
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
            {totalCount > repos.length && (
              <p className="text-sm text-gray-500 mt-2">
                Showing {repos.length} of {totalCount} repositories. Search to narrow down results.
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
