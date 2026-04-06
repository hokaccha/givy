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
}

export interface Branch {
  name: string;
  isDefault: boolean;
  isCurrent: boolean;
  lastCommit: string;
}

export interface TreeEntry {
  name: string;
  type: "blob" | "tree";
  mode: string;
  size: number;
}

export interface TreeResponse {
  path: string;
  entries: TreeEntry[];
}

export interface BlobResponse {
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

export interface ServerInfo {
  rootDir: string;
}

export function getServerInfo(): Promise<ServerInfo> {
  return fetchJSON<ServerInfo>("/info");
}

export interface RepoListResponse {
  repos: Repo[];
  totalCount: number;
}

export function searchRepos(query: string, options?: { limit?: number }): Promise<RepoListResponse> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (options?.limit) params.set("limit", String(options.limit));
  return fetchJSON<RepoListResponse>(`/repos?${params.toString()}`);
}

export function getRepo(owner: string, repo: string): Promise<RepoDetail> {
  return fetchJSON<RepoDetail>(`/repos/${owner}/${repo}`);
}

export function listBranches(owner: string, repo: string): Promise<Branch[]> {
  return fetchJSON<Branch[]>(`/repos/${owner}/${repo}/branches`);
}

export function getTree(owner: string, repo: string, path?: string): Promise<TreeResponse> {
  const p = path ? `/${path}` : "";
  return fetchJSON<TreeResponse>(`/repos/${owner}/${repo}/tree${p}`);
}

export function getBlob(owner: string, repo: string, path: string): Promise<BlobResponse> {
  return fetchJSON<BlobResponse>(`/repos/${owner}/${repo}/blob/${path}`);
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

export function getDiffUnstaged(
  owner: string,
  repo: string,
): Promise<DiffResponse> {
  return fetchJSON<DiffResponse>(`/repos/${owner}/${repo}/diff/unstaged`);
}

export function getDiffStaged(
  owner: string,
  repo: string,
): Promise<DiffResponse> {
  return fetchJSON<DiffResponse>(`/repos/${owner}/${repo}/diff/staged`);
}

export interface CommitInfo {
  hash: string;
  subject: string;
  author: string;
  date: string;
}

export interface CommitDiffResponse {
  commit: CommitInfo;
  files: DiffStat[];
  patch: string;
  stats: {
    files: number;
    additions: number;
    deletions: number;
  };
}

export interface CommitListResponse {
  commits: CommitInfo[];
}

export function getCommit(
  owner: string,
  repo: string,
  commitId: string
): Promise<CommitDiffResponse> {
  return fetchJSON<CommitDiffResponse>(
    `/repos/${owner}/${repo}/commits/${commitId}`
  );
}

export function getCompareCommits(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<CommitListResponse> {
  return fetchJSON<CommitListResponse>(
    `/repos/${owner}/${repo}/compare-commits/${base}...${head}`
  );
}
