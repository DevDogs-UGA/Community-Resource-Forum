"use client";

import {
  addHours,
  addMinutes,
  differenceInMinutes,
  format,
  getHours,
  getMinutes,
  isBefore,
  isSameDay,
  parse,
  roundToNearestMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { useCallback, useEffect, useReducer, useState } from "react";

interface Props {
  inputNames: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay: string;
  };
}

interface DateTimeRange {
  allDay: boolean;
  start: Date;
  end: Date;
}

function normalizeDate(date: Date | null | undefined) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

function normalizeTime(date: Date | null | undefined) {
  return date ? format(date, "HH:mm") : "";
}

type PartialDateTime = { date: string } | { time: string };

type ReducerAction =
  | {
      start: PartialDateTime;
    }
  | { end: PartialDateTime }
  | { allDay: boolean };

function parsePartialDateTime(
  partial: PartialDateTime,
  reference: Date = new Date(),
) {
  return "date" in partial
    ? setMinutes(
        setHours(
          parse(partial.date, "yyyy-MM-dd", reference),
          getHours(reference),
        ),
        getMinutes(reference),
      )
    : parse(partial.time, "HH:mm", reference);
}

function atLeastNow(date: Date) {
  const now = new Date();
  return isBefore(date, now) ? now : date;
}

function reducer(state: DateTimeRange | null, action: ReducerAction) {
  if ("start" in action) {
    const value = parsePartialDateTime(action.start, state?.start);

    if (isBefore(value, Date.now())) {
      return state;
    }

    if (state === null) {
      return {
        start: value,
        end: addHours(value, 1),
        allDay: false,
      } satisfies DateTimeRange;
    }

    return {
      ...state,
      start: value,
      end: addMinutes(state.end, differenceInMinutes(value, state.start)),
    } satisfies DateTimeRange;
  }

  if ("end" in action) {
    const value = parsePartialDateTime(action.end, state?.end);

    if (isBefore(value, Date.now())) {
      return state;
    }

    if (state === null) {
      return {
        start: new Date(),
        end: value,
        allDay: false,
      } satisfies DateTimeRange;
    }

    if (isBefore(value, state.start)) {
      return {
        ...state,
        start: atLeastNow(
          addMinutes(state.start, differenceInMinutes(value, state.end)),
        ),
        end: value,
      } satisfies DateTimeRange;
    }

    return {
      ...state,
      end: value,
    } satisfies DateTimeRange;
  }

  if (state === null) {
    const now = new Date();
    return {
      start: now,
      end: addHours(now, 1),
      allDay: action.allDay,
    } satisfies DateTimeRange;
  }

  return {
    ...state,
    allDay: action.allDay,
  };
}

export default function SelectDateTimeRange({ inputNames }: Props) {
  const [minStartDate, setMinStartDate] = useState<Date | null>(null);
  const [dateTimeRange, setDateTimeRange] = useReducer(reducer, null);

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateTimeRange({
        start: {
          date: e.currentTarget.value,
        },
      });
    },
    [],
  );

  const handleStartTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateTimeRange({
        start: {
          time: e.currentTarget.value,
        },
      });
    },
    [],
  );

  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateTimeRange({
        end: {
          date: e.currentTarget.value,
        },
      });
    },
    [],
  );

  const handleEndTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateTimeRange({
        end: {
          time: e.currentTarget.value,
        },
      });
    },
    [],
  );

  const handleAllDayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateTimeRange({
        allDay: e.currentTarget.checked,
      });
    },
    [],
  );

  useEffect(() => {
    const now = new Date();
    const defaultValue = roundToNearestMinutes(now, {
      nearestTo: 30,
      roundingMethod: "ceil",
    });

    setMinStartDate(now);
    setDateTimeRange({ start: { date: normalizeDate(defaultValue) } });
    setDateTimeRange({ start: { time: normalizeTime(defaultValue) } });
  }, []);

  return (
    <span className="relative mx-auto flex w-full max-w-xl flex-col gap-4">
      <span
        className="group grid grid-cols-8 sm:grid-cols-9 items-center gap-1.5 sm:grid-rows-2 data-[allDay='true']:sm:grid-cols-[1fr_min-content_1fr] data-[allDay='true']:sm:grid-rows-1"
        data-allday={dateTimeRange?.allDay ?? false}
      >
        <input
          className="col-span-4 w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400 group-[[data-allday='true']]:col-span-7 sm:col-span-3 group-[[data-allday='true']]:sm:col-span-1"
          min={normalizeDate(minStartDate)}
          name={inputNames.startDate}
          onChange={handleStartDateChange}
          value={normalizeDate(dateTimeRange?.start)}
          type="date"
          required
        />
        {dateTimeRange?.allDay === true ? null : (
          <input
            className="col-span-3 w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400 sm:col-span-2"
            min={
              minStartDate &&
              dateTimeRange &&
              isSameDay(minStartDate, dateTimeRange.start)
                ? normalizeTime(minStartDate)
                : undefined
            }
            name={inputNames.startTime}
            onChange={handleStartTimeChange}
            value={normalizeTime(dateTimeRange?.start)}
            type="time"
            required
          />
        )}
        <span className="row-start-2 px-1.5 text-right group-[[data-allday='true']]:col-start-2 group-[[data-allday='true']]:text-center sm:col-start-4 group-[[data-allday='true']]:sm:row-start-1">
          to
        </span>
        <input
          className="col-span-4 row-start-2 w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400 group-[[data-allday='true']]:col-span-7 group-[[data-allday='true']]:col-start-auto sm:col-span-3 sm:col-start-5 group-[[data-allday='true']]:sm:col-span-1 group-[[data-allday='true']]:sm:row-start-auto"
          min={normalizeDate(dateTimeRange?.start)}
          name={inputNames.endDate}
          onChange={handleEndDateChange}
          value={normalizeDate(dateTimeRange?.end)}
          type="date"
          required
        />
        {dateTimeRange?.allDay === true ? null : (
          <input
            className="col-span-3 row-start-2 w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400 sm:col-span-2 sm:col-start-8"
            min={normalizeDate(dateTimeRange?.start)}
            name={inputNames.endTime}
            onChange={handleEndTimeChange}
            value={normalizeTime(dateTimeRange?.end)}
            type="time"
            required
          />
        )}
      </span>
      <label className="flex items-center justify-end gap-3">
        <input
          className="size-4"
          name={inputNames.allDay}
          checked={dateTimeRange?.allDay ?? false}
          onChange={handleAllDayChange}
          type="checkbox"
        />
        <span>All day</span>
      </label>
    </span>
  );
}
