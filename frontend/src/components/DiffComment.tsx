import { useState } from "react";

interface DiffCommentFormProps {
  startLine: number;
  endLine: number;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}

export function DiffCommentForm({
  startLine,
  endLine,
  onSubmit,
  onCancel,
}: DiffCommentFormProps) {
  const [body, setBody] = useState("");

  const rangeLabel =
    startLine === endLine
      ? `Line ${startLine}`
      : `Lines ${startLine}-${endLine}`;

  return (
    <div className="bg-white border border-[#d0d7de] rounded-md p-3 my-1">
      <div className="text-xs text-[#636c76] mb-2">{rangeLabel}</div>
      <textarea
        placeholder="Add a comment..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border border-[#d0d7de] rounded-md p-2 text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-transparent"
        autoFocus
      />
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm border border-[#d0d7de] rounded-md text-[#24292f] bg-[#f6f8fa] hover:bg-[#eaeef2] cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (body.trim()) onSubmit(body.trim());
          }}
          disabled={!body.trim()}
          className="px-3 py-1 text-sm bg-[#2da44e] text-white rounded-md hover:bg-[#2c974b] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

interface CommentDisplayProps {
  body: string;
  onEdit: (newBody: string) => void;
  onDelete: () => void;
}

export function CommentDisplay({ body, onEdit, onDelete }: CommentDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(body);

  if (editing) {
    return (
      <div className="bg-white border border-[#d0d7de] rounded-md p-3 my-1">
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          className="w-full border border-[#d0d7de] rounded-md p-2 text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#0969da]"
          role="textbox"
        />
        <div className="flex gap-2 mt-2 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1 text-sm border border-[#d0d7de] rounded-md text-[#24292f] bg-[#f6f8fa] hover:bg-[#eaeef2] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (editBody.trim()) {
                onEdit(editBody.trim());
                setEditing(false);
              }
            }}
            className="px-3 py-1 text-sm bg-[#2da44e] text-white rounded-md hover:bg-[#2c974b] cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#d0d7de] rounded-md p-3 my-1">
      <div className="text-sm whitespace-pre-wrap">{body}</div>
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={() => {
            setEditBody(body);
            setEditing(true);
          }}
          className="px-3 py-1 text-xs border border-[#d0d7de] rounded-md text-[#24292f] bg-[#f6f8fa] hover:bg-[#eaeef2] cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-[#ffebe9] hover:text-[#cf222e] hover:border-[#cf222e] cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
