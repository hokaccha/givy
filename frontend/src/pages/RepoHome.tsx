import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { getRepo } from "../api/client";

export function RepoHome() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!owner || !repo) return;
    getRepo(owner, repo)
      .then((data) => {
        navigate(`/${owner}/${repo}/tree/${data.defaultBranch}`, {
          replace: true,
        });
      })
      .catch(() => {
        navigate("/", { replace: true });
      });
  }, [owner, repo, navigate]);

  return (
    <div className="p-8 text-gray-500">Redirecting...</div>
  );
}
