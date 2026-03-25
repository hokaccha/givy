import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import "github-markdown-css/github-markdown-light.css";
import "remark-github-blockquote-alert/alert.css";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="border border-gray-200 rounded-md p-6">
      <article className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkAlert]}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
