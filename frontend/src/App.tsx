import { BrowserRouter, Routes, Route } from "react-router";
import { RepoList } from "./pages/RepoList";
import { RepoHome } from "./pages/RepoHome";
import { TreeView } from "./pages/TreeView";
import { BlobView } from "./pages/BlobView";
import { CompareView } from "./pages/CompareView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RepoList />} />
        <Route path="/:owner/:repo" element={<RepoHome />} />
        <Route path="/:owner/:repo/tree/:ref/*" element={<TreeView />} />
        <Route path="/:owner/:repo/blob/:ref/*" element={<BlobView />} />
        <Route path="/:owner/:repo/compare/:spec" element={<CompareView />} />
      </Routes>
    </BrowserRouter>
  );
}
