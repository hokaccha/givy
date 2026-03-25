const BASE = "/api";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export interface Repo {
  owner: string;
  name: string;
  defaultBranch: string;
}

export interface Branch {
  name: string;
  isDefault: boolean;
  lastCommit: string;
}

export interface TreeEntry {
  name: string;
  type: "blob" | "tree";
  mode: string;
  size: number;
}

export interface TreeResponse {
  ref: string;
  path: string;
  entries: TreeEntry[];
}

export interface BlobResponse {
  ref: string;
  path: string;
  name: string;
  content: string;
  size: number;
  isBinary: boolean;
  encoding?: string;
}

export interface DiffStat {
  path: string;
  status: string;
  additions: number;
  deletions: number;
}

export interface DiffResponse {
  base: string;
  head: string;
  files: DiffStat[];
  patch: string;
  stats: {
    files: number;
    additions: number;
    deletions: number;
  };
}

export interface RepoDetail {
  owner: string;
  name: string;
  defaultBranch: string;
}

export function listRepos(): Promise<Repo[]> {
  return fetchJSON<Repo[]>("/repos");
}

export function getRepo(owner: string, repo: string): Promise<RepoDetail> {
  return fetchJSON<RepoDetail>(`/repos/${owner}/${repo}`);
}

export function listBranches(owner: string, repo: string): Promise<Branch[]> {
  return fetchJSON<Branch[]>(`/repos/${owner}/${repo}/branches`);
}

export function getTree(
  owner: string,
  repo: string,
  ref: string,
  path?: string
): Promise<TreeResponse> {
  const p = path ? `/${path}` : "";
  return fetchJSON<TreeResponse>(`/repos/${owner}/${repo}/tree/${ref}${p}`);
}

export function getBlob(
  owner: string,
  repo: string,
  ref: string,
  path: string
): Promise<BlobResponse> {
  return fetchJSON<BlobResponse>(`/repos/${owner}/${repo}/blob/${ref}/${path}`);
}

export function getCompare(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<DiffResponse> {
  return fetchJSON<DiffResponse>(
    `/repos/${owner}/${repo}/compare/${base}...${head}`
  );
}
