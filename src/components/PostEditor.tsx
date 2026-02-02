"use client";

import dynamic from "next/dynamic";
import type Delta from "quill-delta";
import { useCallback, useState } from "react";
import { PiPencilSimpleBold } from "react-icons/pi";
import type RQ from "react-quill-new";
import type { EmitterSource } from "react-quill-new";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function PostEditor() {
  const [deltaContent, setDeltaContent] = useState("{}");
  const [textContent, setTextContent] = useState("");

  const handleChange = useCallback(
    (
      _html: string,
      _delta: Delta,
      _source: EmitterSource,
      editor: RQ.UnprivilegedEditor,
    ) => {
      setTextContent(editor.getText());
      setDeltaContent(JSON.stringify(editor.getContents().ops));
    },
    [],
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
        <PiPencilSimpleBold /> Content
      </label>

      <div className="relative -mx-8 bg-gray-200 px-8 py-4">
        <input type="hidden" name="content" value={deltaContent} readOnly />
        <input type="hidden" name="textContent" value={textContent} readOnly />
        <ReactQuill
          className="mx-auto flex h-64 w-full max-w-xl flex-col rounded-sm border border-gray-400 bg-white shadow-xs ring ring-transparent focus-within:ring-sky-600"
          theme="snow"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
