import { BrowserRouter, Routes, Route } from "react-router";
import { RepoList } from "./pages/RepoList";
import { TreeView } from "./pages/TreeView";
import { BlobView } from "./pages/BlobView";
import { CompareView } from "./pages/CompareView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RepoList />} />
        <Route path="/:owner/:repo/compare/*" element={<CompareView />} />
        <Route path="/:owner/:repo/blob/*" element={<BlobView />} />
        <Route path="/:owner/:repo/tree/*" element={<TreeView />} />
        <Route path="/:owner/:repo" element={<TreeView />} />
        <Route path="/:owner" element={<RepoList />} />
      </Routes>
    </BrowserRouter>
  );
}
