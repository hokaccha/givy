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
    <div className="bg-white border border-blue-200 rounded-md p-3 my-1">
      <div className="text-xs text-gray-500 mb-2">{rangeLabel}</div>
      <textarea
        placeholder="Add a comment..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2 text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoFocus
      />
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (body.trim()) onSubmit(body.trim());
          }}
          disabled={!body.trim()}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 my-1">
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          role="textbox"
        />
        <div className="flex gap-2 mt-2 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
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
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 my-1">
      <div className="text-sm whitespace-pre-wrap">{body}</div>
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={() => {
            setEditBody(body);
            setEditing(true);
          }}
          className="px-2 py-0.5 text-xs text-gray-500 hover:text-blue-600"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-2 py-0.5 text-xs text-gray-500 hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
