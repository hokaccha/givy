import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router";
import { RepoList } from "./pages/RepoList";
import { TreeView } from "./pages/TreeView";
import { BlobView } from "./pages/BlobView";
import { CommitView } from "./pages/CommitView";
import { CommitListView } from "./pages/CommitListView";
import { ChangesView } from "./pages/ChangesView";

function CompareRedirect() {
  const { owner, repo, "*": spec } = useParams();
  return <Navigate to={`/${owner}/${repo}/changes/${spec}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RepoList />} />
        <Route path="/:owner/:repo/commit/:commitId" element={<CommitView />} />
        <Route path="/:owner/:repo/commits/*" element={<CommitListView />} />
        <Route path="/:owner/:repo/compare/*" element={<CompareRedirect />} />
        <Route path="/:owner/:repo/changes/*" element={<ChangesView />} />
        <Route path="/:owner/:repo/changes" element={<ChangesView />} />
        <Route path="/:owner/:repo/blob/*" element={<BlobView />} />
        <Route path="/:owner/:repo/tree/*" element={<TreeView />} />
        <Route path="/:owner/:repo" element={<TreeView />} />
        <Route path="/:owner" element={<RepoList />} />
      </Routes>
    </BrowserRouter>
  );
}
