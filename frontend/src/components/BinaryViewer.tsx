interface BinaryViewerProps {
  fileName: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BinaryViewer({ fileName, size }: BinaryViewerProps) {
  return (
    <div className="border border-gray-200 rounded-md p-8 text-center">
      <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-gray-700 font-medium">{fileName}</p>
      <p className="text-sm text-gray-500 mt-1">
        Binary file &middot; {formatSize(size)}
      </p>
    </div>
  );
}
