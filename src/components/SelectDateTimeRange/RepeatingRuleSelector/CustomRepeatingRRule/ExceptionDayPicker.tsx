import {
  compareAsc,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { PiMinusCircleBold, PiPlusCircleBold, PiXBold } from "react-icons/pi";
import { Day } from "~/lib/Day";
import type { CustomRRuleState, RRuleState } from "~/hooks/useRRuleSet";

function dedupeDays(...dates: Date[]) {
  return dates.filter(
    (a, i) => !dates.some((b, j) => i !== j && isSameDay(a, b)),
  );
}

interface Props {
  startDatetime: Date;
  includeDays: CustomRRuleState["options"]["includeDays"];
  excludeDays: CustomRRuleState["options"]["excludeDays"];
  onChange: CustomRRuleState["updateOptions"];
  getRecurrences: RRuleState["rrule"]["getRecurrences"];
}

export default function ExceptionDayPicker({
  getRecurrences,
  startDatetime,
  includeDays,
  excludeDays,
  onChange,
}: Props) {
  const [previewMonth, setPreviewMonth] = useState(startDatetime);

  const selectionPreview = useMemo<Date[]>(
    () =>
      getRecurrences("rruleSet", {
        after: Day.localToUTC(startOfMonth(previewMonth)),
        before: Day.localToUTC(endOfMonth(previewMonth)),
        inclusive: true,
      }).map((d) => Day.utcToLocal(d)),
    [getRecurrences, previewMonth],
  );

  const handleDaySelection = useCallback(
    (dates: Date[] = []) => {
      const rruleDates =
        getRecurrences("rrule", {
          after: Day.localToUTC(startOfMonth(previewMonth)),
          before: Day.localToUTC(endOfMonth(previewMonth)),
          inclusive: true,
        }).map((d) => Day.utcToLocal(d));

      onChange({
        includeDays: ({ includeDays }) =>
          dedupeDays(
            ...includeDays
              .map((day) => day.toLocalDatetime())
              .filter((date) => !isSameMonth(date, previewMonth)),
            ...dates.filter(
              (date) => !rruleDates.some((other) => isSameDay(date, other)),
            ),
          )
            .toSorted(compareAsc)
            .map((date) => Day.fromLocal(date)),
        excludeDays: ({ excludeDays }) =>
          dedupeDays(
            ...excludeDays
              .map((day) => day.toLocalDatetime())
              .filter((date) => !isSameMonth(date, previewMonth)),
            ...rruleDates.filter(
              (date) => !dates.some((other) => isSameDay(date, other)),
            ),
          )
            .toSorted(compareAsc)
            .map((date) => Day.fromLocal(date)),
      });
    },
    [previewMonth, getRecurrences, onChange],
  );

  return (
    <>
      <DayPicker
        animate
        mode="multiple"
        disabled={{
          before: startDatetime,
        }}
        selected={selectionPreview}
        onSelect={handleDaySelection}
        required={false}
        defaultMonth={startDatetime}
        month={previewMonth}
        onMonthChange={setPreviewMonth}
        className="row-span-2"
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

      {includeDays.length > 0 ? (
        <div className="relative block h-full min-h-0 overflow-hidden rounded-sm border border-green-950 bg-green-100">
          <div className="absolute inset-0 size-full overflow-y-scroll">
            <p className="sticky top-0 flex items-center gap-2 bg-green-800 px-2 py-0.75 text-[0.66rem] font-bold tracking-wide text-white uppercase">
              <PiPlusCircleBold className="text-base" />
              Additional Dates
            </p>
            <ul className="py-1 text-xs font-medium text-green-950">
              {includeDays.map((day) => (
                <li
                  className="group flex cursor-pointer items-center justify-between gap-1.5 px-2 py-1 transition-colors hover:bg-green-200"
                  key={day.toLocalDatetime().toISOString()}
                  tabIndex={1}
                  onClick={() =>
                    onChange({
                      includeDays: ({ includeDays }) =>
                        includeDays.filter((d) => !day.equals(d)),
                    })
                  }
                >
                  {format(day.toLocalDatetime().toISOString(), "iii, MMM d")}
                  <PiXBold className="text-transparent transition-colors group-hover:text-green-800" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="flex items-center rounded-sm bg-gray-100 px-3 text-center text-xs text-balance text-gray-600 italic">
          No additional dates included.
        </p>
      )}

      {excludeDays.length > 0 ? (
        <div className="relative block h-full min-h-0 overflow-hidden rounded-sm border border-red-950 bg-red-100">
          <div className="absolute inset-0 size-full overflow-y-scroll">
            <p className="sticky top-0 flex items-center gap-2 bg-red-800 px-2 py-0.75 text-[0.66rem] font-bold tracking-wide text-white uppercase">
              <PiMinusCircleBold className="text-base" />
              Excluded Dates
            </p>
            <ul className="py-1 text-xs font-medium text-red-950">
              {excludeDays.map((day) => (
                <li
                  className="group flex cursor-pointer items-center justify-between gap-1.5 px-2 py-1 transition-colors hover:bg-red-200"
                  key={day.toLocalDatetime().toISOString()}
                  tabIndex={1}
                  onClick={() =>
                    onChange({
                      excludeDays: ({ excludeDays }) =>
                        excludeDays.filter((d) => !day.equals(d)),
                    })
                  }
                >
                  {format(day.toLocalDatetime().toISOString(), "iii, MMM d")}
                  <PiXBold className="text-transparent transition-colors group-hover:text-red-800" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="flex items-center rounded-sm bg-gray-100 px-3 text-center text-xs text-balance text-gray-600 italic">
          No recurrences excluded.
        </p>
      )}
    </>
  );
}
