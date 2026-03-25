interface ImageViewerProps {
  content: string; // base64 encoded
  fileName: string;
}

function mimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    bmp: "image/bmp",
  };
  return map[ext] || "image/png";
}

export function ImageViewer({ content, fileName }: ImageViewerProps) {
  const src = `data:${mimeType(fileName)};base64,${content}`;
  return (
    <div className="border border-gray-200 rounded-md p-8 flex items-center justify-center bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')]">
      <img src={src} alt={fileName} className="max-w-full max-h-[600px]" />
    </div>
  );
}
