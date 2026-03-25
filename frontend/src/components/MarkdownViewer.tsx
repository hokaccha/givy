import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="border border-gray-200 rounded-md p-6 prose prose-sm max-w-none prose-headings:border-b prose-headings:border-gray-200 prose-headings:pb-2 prose-a:text-blue-600">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
