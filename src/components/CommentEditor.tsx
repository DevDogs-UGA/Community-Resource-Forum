"use client";

import dynamic from "next/dynamic";
import type Delta from "quill-delta";
import {
  cloneElement,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
  type ReactElement,
  type RefObject,
} from "react";
import type { EmitterSource, default as RQ } from "react-quill-new";
import ReactQuill from "react-quill-new";
// const ReactQuill = dynamic(
//   async () => {
//     const { default: RQ } = await import("react-quill-new");

//     return function ReactQuill({
//       ref,
//       ...props
//     }: { ref: RefObject<RQ | null> } & ComponentProps<typeof RQ>) {
//       return <RQ ref={ref} {...props} />;
//     };
//   },
//   { ssr: false },
// );

interface Props {
  children: ReactElement<HTMLAttributes<HTMLButtonElement>>;
}

export default function CommentEditor({ children }: Props) {
  const [value, setValue] = useState("{}");
  const [active, setActive] = useState<boolean>(false);
  const editorRef = useRef<RQ>(null);

  const handleClickTrigger = useCallback(() => {
    setActive(true);
    requestAnimationFrame(() => {    
      editorRef.current?.editor?.setSelection(0)
    });
  }, []);

  const trigger = useMemo(
    () => cloneElement(children, { onClick: handleClickTrigger }),
    [children, handleClickTrigger],
  );

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
    <div className="group contents" data-active={active}>
      <div className="group-[[data-active='true']]:hidden">{trigger}</div>
      <form className="group-[[data-active='false']]:hidden">
        <ReactQuill
          className="mx-auto flex h-64 w-full max-w-xl flex-col rounded-sm border border-gray-400 bg-white shadow-xs ring ring-transparent focus-within:ring-sky-600"
          onChange={handleChange}
          ref={editorRef}
          theme="snow"
        />
      </form>
    </div>
  );
}
