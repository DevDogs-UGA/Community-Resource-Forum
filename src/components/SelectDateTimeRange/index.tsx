"use client";

import {
  addHours,
  addMinutes,
  differenceInMinutes,
  isSameDay,
  roundToNearestMinutes,
} from "date-fns";
import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import "react-day-picker/style.css";
import useNow from "~/hooks/useNow";
import useRRuleSet from "~/hooks/useRRuleSet";
import { Day, Time } from "~/lib/Day";
import DayInput from "./DayInput";
import RepeatingRuleSelector from "./RepeatingRuleSelector";
import TimeInput from "./TimeInput";

type DateTimeRange = {
  allDay: boolean;
  startDay: Day;
  endDay: Day;
  startTime: Time;
  endTime: Time;
};

interface Props {
  inputNames: Record<keyof DateTimeRange, string> & { rruleSet: string };
  defaultValue?: {
    startDay?: Day;
    endDay?: Day;
    rruleSet?: Exclude<
      Parameters<typeof useRRuleSet>[0],
      "startDay" | "startTime"
    >;
  } & ({ allDay?: true } | { allDay: false; startTime?: Time; endTime?: Time });
}

export default function SelectDateTimeRange({
  inputNames,
  defaultValue,
}: Props) {
  const now = useNow("everyMinute");

  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>(() => {
    const allDay = defaultValue?.allDay ?? false;
    const startDay = defaultValue?.startDay ?? Day.fromLocal(now);
    const endDay = defaultValue?.endDay ?? startDay;
    const startTime =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (defaultValue?.allDay === false && defaultValue.startTime) ||
      Time.from(
        roundToNearestMinutes(now, {
          nearestTo: 30,
          roundingMethod: "ceil",
        }),
      );

    const endTime =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (defaultValue?.allDay === false && defaultValue.endTime) ||
      Time.from(
        addHours(
          roundToNearestMinutes(now, { nearestTo: 30, roundingMethod: "ceil" }),
          1,
        ),
      );

    return { allDay, startDay, endDay, startTime, endTime };
  });

  const setStartDay: Dispatch<SetStateAction<Day>> = useCallback((startDay) => {
    setDateTimeRange((r) => {
      const newStartDay =
        typeof startDay === "function" ? startDay(r.startDay) : startDay;

      const newEndDateObj = addMinutes(
        r.endDay.toLocalDatetime(r.endTime),
        differenceInMinutes(
          newStartDay.toLocalDatetime(r.startTime),
          r.startDay.toLocalDatetime(r.startTime),
        ),
      );

      return {
        ...r,
        startDay: newStartDay,
        endDay: new Day(
          newEndDateObj.getFullYear(),
          newEndDateObj.getMonth() + 1,
          newEndDateObj.getDate(),
        ),
        endTime: new Time(newEndDateObj.getHours(), newEndDateObj.getMinutes()),
      };
    });
  }, []);

  const setStartTime: Dispatch<SetStateAction<Time>> = useCallback(
    (startTime) => {
      setDateTimeRange((r) => {
        const newStartTime =
          typeof startTime === "function" ? startTime(r.startTime) : startTime;

        const newEndDateObj = addMinutes(
          r.endDay.toLocalDatetime(r.endTime),
          differenceInMinutes(
            r.startDay.toLocalDatetime(newStartTime),
            r.startDay.toLocalDatetime(r.startTime),
          ),
        );

        return {
          ...r,
          startTime: newStartTime,
          endDay: new Day(
            newEndDateObj.getFullYear(),
            newEndDateObj.getMonth() + 1,
            newEndDateObj.getDate(),
          ),
          endTime: new Time(
            newEndDateObj.getHours(),
            newEndDateObj.getMinutes(),
          ),
        };
      });
    },
    [],
  );

  const setEndDay: Dispatch<SetStateAction<Day>> = useCallback((endDay) => {
    setDateTimeRange((r) => ({
      ...r,
      endDay: typeof endDay === "function" ? endDay(r.endDay) : endDay,
    }));
  }, []);

  const setEndTime: Dispatch<SetStateAction<Time>> = useCallback((endTime) => {
    setDateTimeRange((r) => ({
      ...r,
      endTime: typeof endTime === "function" ? endTime(r.endTime) : endTime,
    }));
  }, []);

  const minStartTime = useMemo(
    () =>
      isSameDay(now, dateTimeRange.startDay.toUTCDatetime())
        ? Time.from(now)
        : undefined,
    [now, dateTimeRange],
  );

  const minEndTime = useMemo(
    () =>
      isSameDay(
        dateTimeRange.startDay.toUTCDatetime(),
        dateTimeRange.endDay.toUTCDatetime(),
      )
        ? dateTimeRange.startTime
        : undefined,
    [dateTimeRange],
  );

  const defaultRRuleSet = useMemo(
    () => ({
      ...defaultValue?.rruleSet,
      startDay: dateTimeRange.startDay,
      startTime: dateTimeRange.startTime,
    }),
    [defaultValue, dateTimeRange],
  );

  const rruleSet = useRRuleSet(defaultRRuleSet);

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col gap-2">
      <div
        className="group flex items-center gap-1.5"
        data-all-day={dateTimeRange.allDay || undefined}
      >
        <div className="grow">
          <input
            type="hidden"
            name={inputNames.startDay}
            value={dateTimeRange.startDay.toString()}
          />
          <DayInput
            min={Day.fromLocal(now)}
            value={dateTimeRange.startDay}
            onChange={setStartDay}
          />
        </div>
        {!dateTimeRange.allDay && (
          <div className="min-w-26">
            <input
              type="hidden"
              name={inputNames.startTime}
              value={dateTimeRange.startTime?.toString()}
              required={dateTimeRange.allDay}
            />
            <TimeInput
              min={minStartTime}
              value={dateTimeRange.startTime}
              onChange={setStartTime}
            />
          </div>
        )}
        <p className="px-1.5">to</p>
        <div className="grow">
          <input
            type="hidden"
            name={inputNames.endDay}
            value={dateTimeRange.endDay.toString()}
          />
          <DayInput
            min={dateTimeRange.startDay}
            value={dateTimeRange.endDay}
            onChange={setEndDay}
          />
        </div>
        {!dateTimeRange.allDay && (
          <div className="min-w-26">
            <input
              type="hidden"
              name={inputNames.endTime}
              value={dateTimeRange.endTime?.toString()}
              required={dateTimeRange.allDay}
            />
            <TimeInput
              min={minEndTime}
              value={dateTimeRange.endTime}
              onChange={setEndTime}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center gap-3 px-3">
          <input
            className="size-4"
            name={inputNames.allDay}
            checked={dateTimeRange.allDay}
            onChange={(e) =>
              setDateTimeRange((r) => ({ ...r, allDay: e.target.checked }))
            }
            type="checkbox"
          />
          <span>All day</span>
        </label>

        <RepeatingRuleSelector rruleSet={rruleSet} />
        <input type="hidden" name={inputNames.rruleSet} value={rruleSet.rrule.icalString} />
      </div>
    </div>
  );
}
