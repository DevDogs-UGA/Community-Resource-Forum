"use client";

import dynamic from "next/dynamic";
import type Delta from "quill-delta";
import { useCallback, useState } from "react";
import { PiPencilSimpleBold } from "react-icons/pi";
import type RQ from "react-quill-new";
import type { EmitterSource } from "react-quill-new";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function Editor() {
  const [value, setValue] = useState("{}");

  const handleChange = useCallback(
    (
      _html: string,
      _delta: Delta,
      _source: EmitterSource,
      editor: RQ.UnprivilegedEditor,
    ) => {
      setValue(JSON.stringify(editor.getContents().ops));
    },
    [],
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="flex items-center gap-2 font-bold max-w-xl mx-auto w-full">
        <PiPencilSimpleBold /> Content
      </label>
      
      <div className="relative bg-gray-200 px-8 py-4 -mx-8">
        <input type="hidden" name="content" value={value} readOnly />
        <ReactQuill
          className="flex h-64 flex-col rounded-sm border border-gray-400 ring ring-transparent focus-within:ring-sky-600 bg-white shadow-xs max-w-xl mx-auto w-full"
          theme="snow"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
