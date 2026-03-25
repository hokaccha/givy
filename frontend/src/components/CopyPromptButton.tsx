import { useState } from "react";

interface CopyPromptButtonProps {
  onClick: () => void;
  label: string;
}

export function CopyPromptButton({ onClick, label }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    onClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
