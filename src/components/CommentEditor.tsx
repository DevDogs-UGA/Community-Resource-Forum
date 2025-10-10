"use client";

import dynamic from "next/dynamic";
import type Delta from "quill-delta";
import React, {
  createContext,
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type PropsWithChildren,
  type RefObject,
  type SetStateAction,
} from "react";
import { PiCircleNotchBold, PiTextAa, PiTextAaBold } from "react-icons/pi";
import type { EmitterSource, default as RQ } from "react-quill-new";
import comment from "~/server/actions/comment";
import signIn from "~/server/actions/signIn";
import type { profiles } from "~/server/db/schema";
import SelectProfile from "./SelectProfile";

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");

    return function ReactQuill({
      ref,
      ...props
    }: { ref: RefObject<RQ | null> } & ComponentProps<typeof RQ>) {
      return <RQ ref={ref} {...props} />;
    };
  },
  { ssr: false },
);

type Profile = (typeof profiles)["$inferSelect"];

interface Context {
  state: [active: boolean, setActive: Dispatch<SetStateAction<boolean>>];
  data: {
    profiles?: Readonly<[Profile, ...Profile[]]>;
    parentId?: string;
    postId: string;
  };
}

const context = createContext<Context | null>(null);

export function useContext() {
  const ctx = React.useContext(context);

  if (ctx === null) {
    throw new Error(
      "`<CommentEditor.Trigger />` must be a child of `<CommentEditor.Root />`",
    );
  }

  return ctx;
}

interface Props extends PropsWithChildren<Context["data"]> {
  defaultActive?: boolean;
}

export function Root({ children, defaultActive = false, ...data }: Props) {
  const state = useState<boolean>(defaultActive);

  return (
    <context.Provider value={{ data, state }}>{children}</context.Provider>
  );
}

export function Trigger({ children }: PropsWithChildren) {
  const {
    state: [_active, setActive],
  } = useContext();

  const handleClick = useCallback(() => {
    setActive((a) => !a);
  }, [setActive]);

  return (
    <div className="contents" onClick={handleClick}>
      {children}
    </div>
  );
}

export function Slot({ children }: PropsWithChildren) {
  const {
    state: [active, setActive],
    data: { parentId, postId, profiles },
  } = useContext();

  const [value, setValue] = useState("{}");
  const [toolbar, setToolbar] = useState<boolean>(false);
  const editorRef = useRef<RQ>(null);
  const [_formState, formAction, pending] = useActionState(comment, null);

  const focusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      editorRef.current?.editor?.setSelection(0);
    });
  }, []);

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

  const handleToolbarActive = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setToolbar(e.currentTarget.checked);
      focusEditor();
    },
    [focusEditor],
  );

  const handleReset = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setActive(false);
    },
    [setActive],
  );

  const activateEditor = useCallback(() => {
    setActive(true);
  }, [setActive]);

  useEffect(() => {
    if (!active) {
      setToolbar(false);
      return;
    }

    if (!profiles) {
      startTransition(() => {
        signIn().catch(console.error);
      });
      return;
    }

    focusEditor();
  }, [profiles, focusEditor, active]);

  return (
    <div className="group contents" data-active={active}>
      <div
        className="contents group-[[data-active='true']]:hidden"
        onClick={activateEditor}
      >
        {children}
      </div>
      {profiles ? (
        <form
          action={formAction}
          className="flex flex-col gap-2 group-[[data-active='false']]:hidden"
          onReset={handleReset}
        >
          <input
            className="hidden"
            type="hidden"
            name="postId"
            value={postId}
          />
          <input
            className="hidden"
            type="hidden"
            name="parentId"
            value={parentId}
          />
          <input
            className="hidden"
            type="hidden"
            name="content"
            value={value}
          />

          <div
            data-toolbar={!!toolbar}
            className="mx-auto w-full max-w-xl flex-col rounded-sm border border-gray-400 bg-white shadow-xs ring ring-transparent has-[.ql-container:focus-within]:ring-sky-600 [&>.quill>.ql-container]:h-20! data-[toolbar=true]:[&>.quill>.ql-container]:h-40!"
          >
            <ReactQuill
              className="relative [&>.ql-toolbar]:sticky [&>.ql-toolbar]:top-0 [&>.ql-toolbar]:z-10 [&>.ql-toolbar]:border-b! [&>.ql-toolbar]:border-gray-300!"
              onChange={handleChange}
              ref={editorRef}
              theme="snow"
              modules={{
                toolbar,
              }}
            />
            <div className="grid grid-cols-[min-content_1fr_repeat(2,min-content)] grid-rows-2 items-center justify-between gap-3 rounded-b-sm border-t border-gray-300 bg-gray-100 px-3 py-1.5 sm:flex">
              <label className="group row-start-2 rounded-full p-1.5 text-lg hover:bg-gray-300 has-checked:bg-gray-300 has-checked:shadow-sm has-checked:ring-1 has-checked:ring-gray-400">
                <input
                  className="hidden"
                  type="checkbox"
                  checked={!!toolbar}
                  onChange={handleToolbarActive}
                />
                <PiTextAa className="text-gray-600 group-has-checked:hidden" />
                <PiTextAaBold className="hidden text-gray-800 group-has-checked:block" />
              </label>

              <div className="col-span-full w-full text-sm">
                <SelectProfile inputName="authorId" profiles={profiles} />
              </div>

              <button
                className="col-start-3 rounded-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                type="reset"
              >
                <span className="contents">Cancel</span>
              </button>

              <button
                className="group relative col-start-4 flex cursor-default items-center gap-1.5 rounded-full border-b border-sky-900 bg-sky-800 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors focus:mt-px focus:border-b-0 disabled:cursor-not-allowed disabled:opacity-80"
                disabled={pending}
                type="submit"
              >
                <span className="block transition-opacity group-disabled:opacity-0">
                  Comment
                </span>
                <PiCircleNotchBold className="absolute top-1/2 left-1/2 -translate-1/2 animate-spin opacity-0 transition-opacity group-disabled:opacity-100" />
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
