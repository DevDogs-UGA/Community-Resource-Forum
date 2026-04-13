"use client";

import * as Popover from "@radix-ui/react-popover";
import { getDaysInMonth, setMonth, setYear, startOfMonth } from "date-fns";
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { DayPicker, type OnSelectHandler } from "react-day-picker";
import "react-day-picker/style.css";
import { Day, toFixedLength } from "~/lib/Day";
import useDocumentEvent from "~/hooks/useDocumentEvent";
import PartialInput from "./PartialInput";

interface Props {
  min?: Day;
  value: Day;
  onChange: Dispatch<SetStateAction<Day>>;
}

export default function DayInput({ value, onChange, min }: Props) {
  const labelRef = useRef<HTMLLabelElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [previewMonth, setPreviewMonth] = useState<Date>(() =>
    startOfMonth(value.toUTCDatetime()),
  );

  const preventDefault = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const handleFieldsetFocus = useCallback(() => {
    setOpen(true);
  }, []);

  const handleMonthInputChange = useCallback(
    (month: number) => {
      onChange((d) => d.with({ month }));
      setPreviewMonth((m) => setMonth(m, month - 1));
    },
    [onChange],
  );

  const handleDateInputChange = useCallback(
    (date: number) => {
      onChange((d) => d.with({ date }));
    },
    [onChange],
  );

  const handleYearInputChange = useCallback(
    (year: number) => {
      onChange((d) => d.with({ year }));
      setPreviewMonth((m) => setYear(m, year));
    },
    [onChange],
  );

  const handleDaySelect = useCallback<OnSelectHandler<Date | undefined>>(
    (selected) => {
      if (selected) {
        onChange(Day.fromLocal(selected));
        setOpen(false);
      } else {
        (labelRef.current?.children[0] as HTMLElement)?.focus();
      }
    },
    [onChange],
  );

  const handleOutsideInteraction = useCallback((source: HTMLElement | null) => {
    if (
      source &&
      !labelRef.current?.contains(source) &&
      !popoverRef.current?.contains(source)
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

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <label
          className="flex w-full items-center justify-center rounded-sm bg-white px-3 py-1 ring ring-gray-400"
          onFocus={handleFieldsetFocus}
          ref={labelRef}
        >
          <PartialInput
            length={2}
            displayValue={toFixedLength(value.getMonth(), 2)}
            onChange={handleMonthInputChange}
            min={min?.getMonth() ?? 1}
            max={12}
          />
          <span className="-mt-0.5 px-0.5">/</span>
          <PartialInput
            length={2}
            displayValue={toFixedLength(value.getDate(), 2)}
            onChange={handleDateInputChange}
            min={value.getMonth() === min?.getMonth() ? min.getDate() : 1}
            max={getDaysInMonth(value.toUTCDatetime())}
          />
          <span className="-mt-0.5 px-0.5">/</span>
          <PartialInput
            length={4}
            displayValue={toFixedLength(value.getYear(), 4)}
            onChange={handleYearInputChange}
            min={min?.getYear() ?? 2026}
          />
        </label>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          className="z-110 rounded-md border border-gray-500 bg-white p-3 shadow-lg"
          onOpenAutoFocus={preventDefault}
          onFocusOutside={preventDefault}
          onInteractOutside={preventDefault}
          sideOffset={4}
          ref={popoverRef}
        >
          <DayPicker
            animate
            mode="single"
            selected={value.toUTCDatetime()}
            onSelect={handleDaySelect}
            disabled={
              min
                ? {
                    before: min.toUTCDatetime(),
                  }
                : undefined
            }
            month={previewMonth}
            onMonthChange={setPreviewMonth}
            timeZone="UTC"
            classNames={{
              month_caption: "font-bold text-base pb-2 px-2",
              button_next:
                "p-0.5 border rounded-sm text-gray-600 border-gray-400 hover:bg-gray-200 transition-colors",
              button_previous:
                "p-0.5 border rounded-sm text-gray-600 border-gray-400 hover:bg-gray-200 transition-colors",
              nav: "absolute top-px space-x-1 right-2",
              chevron: "size-4",
              day: "text-xs size-8 rounded-full",
              day_button:
                "size-8 rounded-full disabled:text-gray-500 not-disabled:hover:border-sky-800 border border-transparent transition-colors",
              weekday: "text-gray-500 text-xs font-medium pt-2 pb-1.5",
              today: "text-white bg-sky-700",
              selected: "font-bold bg-sky-200",
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
