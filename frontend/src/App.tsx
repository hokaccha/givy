import { BrowserRouter, Routes, Route } from "react-router";
import { RepoList } from "./pages/RepoList";
import { TreeView } from "./pages/TreeView";
import { BlobView } from "./pages/BlobView";
import { CompareView } from "./pages/CompareView";
import { CommitView } from "./pages/CommitView";
import { CommitListView } from "./pages/CommitListView";
import { ChangesView } from "./pages/ChangesView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RepoList />} />
        <Route path="/:owner/:repo/commit/:commitId" element={<CommitView />} />
        <Route path="/:owner/:repo/commits/*" element={<CommitListView />} />
        <Route path="/:owner/:repo/compare/*" element={<CompareView />} />
        <Route path="/:owner/:repo/changes" element={<ChangesView />} />
        <Route path="/:owner/:repo/blob/*" element={<BlobView />} />
        <Route path="/:owner/:repo/tree/*" element={<TreeView />} />
        <Route path="/:owner/:repo" element={<TreeView />} />
        <Route path="/:owner" element={<RepoList />} />
      </Routes>
    </BrowserRouter>
  );
}
