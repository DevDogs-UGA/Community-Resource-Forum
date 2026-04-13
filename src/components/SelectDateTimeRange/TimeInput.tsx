"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  type ChangeEvent,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
  type UIEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PiCaretDownBold, PiCaretUpBold } from "react-icons/pi";
import { Time, toFixedLength } from "~/lib/Day";
import useDocumentEvent from "~/hooks/useDocumentEvent";

const placeholderTimes = Array.from({ length: 24 }, (_, hour) =>
  Array.from({ length: 4 }, (_, minute) => new Time(hour, minute * 15)),
).flat();

interface Props {
  min?: Time;
  value: Time;
  onChange: Dispatch<SetStateAction<Time>>;
}

export default function TimeInput({ min, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [scrollState, setScrollState] = useState<"top" | "between" | "bottom">(
    "between",
  );
  const [scrollUp, setScrollUp] = useState(false);
  const [scrollDown, setScrollDown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const popoverContainerRef = useRef<HTMLDivElement>(null);

  const preventDefault = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      try {
        onChange(Time.parse(e.currentTarget.value));
      } catch (error) {
        console.error(error);
        e.preventDefault();
      }
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      try {
        onChange(Time.parse(e.currentTarget.value));
        setOpen(false);
      } catch (error) {
        console.error(error);
        e.preventDefault();
      }
    },
    [onChange],
  );

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      setScrollState("top");
      return;
    }

    if (
      e.currentTarget.scrollTop + e.currentTarget.clientHeight ===
      e.currentTarget.scrollHeight
    ) {
      setScrollState("bottom");
      return;
    }

    setScrollState("between");
  }, []);

  const handleScrollUpMouseEnter = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget;

      setTimeout(() => {
        if (target.matches(":hover")) {
          setScrollUp(true);
        }
      }, 150);
    },
    [],
  );

  const handleScrollUpMouseLeave = useCallback(() => {
    setScrollUp(false);
  }, []);

  const handleScrollDownMouseEnter = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget;

      setTimeout(() => {
        if (target.matches(":hover")) {
          setScrollDown(true);
        }
      }, 150);
    },
    [],
  );

  const handleScrollDownMouseLeave = useCallback(() => {
    setScrollDown(false);
  }, []);

  const handleOutsideInteraction = useCallback((source: HTMLElement | null) => {
    if (
      source &&
      !inputRef.current?.contains(source) &&
      !popoverContainerRef.current?.contains(source)
    ) {
      setOpen(false);
    }
  }, []);

  useDocumentEvent(
    "focusin",
    (e) => handleOutsideInteraction(e.target as HTMLElement),
    [handleOutsideInteraction],
  );

  useDocumentEvent(
    "pointerdown",
    (e) => handleOutsideInteraction(e.target as HTMLElement),
    [handleOutsideInteraction],
  );

  useEffect(() => {
    if (!scrollUp) {
      return;
    }

    const interval = setInterval(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop -= 5;
      }
    }, 10);

    return () => clearInterval(interval);
  }, [scrollUp]);

  useEffect(() => {
    if (!scrollDown) {
      return;
    }

    const interval = setInterval(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop += 5;
      }
    }, 10);

    return () => clearInterval(interval);
  }, [scrollDown]);

  useEffect(() => {
    scrollAreaRef.current
      ?.querySelector(
        `[value="${toFixedLength(value.getHour(), 2)}:${toFixedLength(value.getMinute() - (value.getMinute() % 15), 2)}"]`,
      )
      ?.scrollIntoView({ behavior: "instant", block: "center" });
  }, [value]);

  console.log(value.toString());

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <input
          className="w-full rounded-sm bg-white px-2 py-1 text-center ring ring-gray-400"
          value={value.toString()}
          onChange={handleInputChange}
          onFocus={handleFocus}
          ref={inputRef}
          type="time"
          required
        />
      </Popover.Anchor>

      <div className="*:pointer-events-none">
        <Popover.Content
          forceMount
          sideOffset={4}
          className="relative z-100 min-w-(--radix-popper-anchor-width) overflow-hidden rounded-md border border-gray-600 bg-white text-sm shadow-xl transition-opacity data-[state=closed]:pointer-events-none! data-[state=closed]:opacity-0"
          onPointerDownOutside={preventDefault}
          onInteractOutside={preventDefault}
          onOpenAutoFocus={preventDefault}
          ref={popoverContainerRef}
        >
          <button
            className="absolute flex w-full justify-center bg-white/50 py-0.5 text-xs text-gray-600 backdrop-blur-xs transition-[border-color,background-color,text-color,translate] hover:bg-gray-200/80 hover:text-gray-800 data-[scroll-state=top]:-translate-y-full"
            data-scroll-state={scrollState}
            onMouseEnter={handleScrollUpMouseEnter}
            onMouseLeave={handleScrollUpMouseLeave}
            type="button"
            tabIndex={-1}
          >
            <PiCaretUpBold className="mt-0.5" />
          </button>
          <div
            className="bg-scroll-shadow flex max-h-56.5 flex-col overflow-y-scroll"
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            {placeholderTimes.map((time) => (
              <button
                className="cursor-default px-4 py-1 text-left hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500 data-[selected=true]:bg-sky-200 data-[selected=true]:font-bold"
                data-selected={value.equals(time)}
                disabled={
                  min &&
                  (time.getHour() < min.getHour() ||
                    (time.getHour() === min.getHour() &&
                      time.getMinute() < min.getMinute()))
                }
                value={time.toString()}
                key={time.toString()}
                onClick={handleClick}
                type="button"
              >
                {time.toText()}
              </button>
            ))}
          </div>
          <button
            className="absolute bottom-0 flex w-full justify-center bg-white/50 py-0.5 text-xs text-gray-600 backdrop-blur-xs transition-[border-color,background-color,text-color,translate] hover:bg-gray-200/80 hover:text-gray-800 data-[scroll-state=bottom]:translate-y-full"
            data-scroll-state={scrollState}
            onMouseEnter={handleScrollDownMouseEnter}
            onMouseLeave={handleScrollDownMouseLeave}
            type="button"
            tabIndex={-1}
          >
            <PiCaretDownBold className="mb-0.5" />
          </button>
        </Popover.Content>
      </div>
    </Popover.Root>
  );
}
