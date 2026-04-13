import * as Menu from "@radix-ui/react-dropdown-menu";
import { useCallback, useMemo } from "react";
import { PiCaretLeftBold } from "react-icons/pi";
import type { CustomRRuleState } from "~/hooks/useRRuleSet";
import ExceptionDayPicker from "./ExceptionDayPicker";
import FrequencySelect from "./FrequencySelect";
import IntervalInput from "./IntervalInput";
import MonthlyRecurrenceSelect from "./MonthlyRecurrenceSelect";
import RepeatConditionSelect from "./RepeatConditionSelect";
import RepeatCountInput from "./RepeatCountInput";
import RepeatUntilInput from "./RepeatUntilInput";
import WeeklyRecurrenceToggleGroup from "./WeeklyRecurenceToggleGroup";

export default function CustomRepeatingRule({
  options,
  updateOptions,
  setType,
  rrule: { getRecurrences },
}: CustomRRuleState) {
  const startDatetime = useMemo(
    () => options.startDay.toLocalDatetime(options.startTime),
    [options],
  );

  const preventDefault = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const cancel = useCallback(() => {
    setType("preset");
  }, [setType]);

  return (
    <>
      <Menu.Group>
        <Menu.Item onSelect={preventDefault} asChild>
          <button
            className="group flex w-full items-center gap-3 px-3 py-1 text-left transition-colors hover:bg-gray-200"
            onClick={cancel}
            type="button"
          >
            <PiCaretLeftBold className="opacity-70 transition-opacity group-hover:opacity-100" />
            Back
          </button>
        </Menu.Item>
      </Menu.Group>

      <Menu.Separator className="my-1 h-px w-full bg-gray-300" />

      <Menu.Group className="flex flex-col gap-y-2 pt-1 pb-2">
        <Menu.Label className="px-3 pb-0.5 text-[0.66rem] font-semibold text-gray-500 uppercase">
          Custom Recurrence
        </Menu.Label>

        <div className="grid grid-cols-[max-content_1fr_1fr] gap-x-3 gap-y-[inherit] px-4">
          <label className="self-center text-gray-800">Every</label>

          <IntervalInput value={options.interval} onChange={updateOptions} />

          <FrequencySelect
            value={options.recurrence}
            onChange={updateOptions}
          />

          <WeeklyRecurrenceToggleGroup
            value={options.recurrence}
            onChange={updateOptions}
          />

          <MonthlyRecurrenceSelect
            startDatetime={startDatetime}
            value={options.recurrence}
            onChange={updateOptions}
          />

          <label className="self-center text-gray-800">Repeat</label>

          <RepeatConditionSelect
            value={options.repeat}
            onChange={updateOptions}
            getRecurrences={getRecurrences}
          />

          <RepeatUntilInput
            startDay={options.startDay}
            value={options.repeat}
            onChange={updateOptions}
          />

          <RepeatCountInput value={options.repeat} onChange={updateOptions} />
        </div>
      </Menu.Group>

      <Menu.Separator className="my-1 h-px w-full bg-gray-300" />

      <Menu.Group className="flex flex-col gap-y-2 pt-1 pb-2">
        <Menu.Label className="px-3 pb-0.5 text-[0.66rem] font-semibold text-gray-500 uppercase">
          Exceptions
        </Menu.Label>

        <div className="grid grid-cols-[auto_1fr] grid-rows-2 gap-x-3 gap-y-2 px-4">
          <ExceptionDayPicker
            startDatetime={startDatetime}
            includeDays={options.includeDays}
            excludeDays={options.excludeDays}
            onChange={updateOptions}
            getRecurrences={getRecurrences}
          />
        </div>
      </Menu.Group>

      <Menu.Group className="flex gap-2 px-2 py-1 font-medium">
        <Menu.Item asChild>
          <button
            className="grow rounded-sm border border-gray-400 bg-gray-100 py-1 text-gray-700 transition-[border-color,color,box-shadow,background-color] hover:border-gray-500 hover:bg-gray-200 hover:text-gray-800 hover:shadow-xs"
            onClick={cancel}
            type="button"
          >
            Cancel
          </button>
        </Menu.Item>

        <Menu.Item asChild>
          <button
            className="grow rounded-sm border border-sky-950 bg-sky-800 py-1 text-white transition-[border-color,box-shadow,background-color] hover:border-black hover:bg-sky-900 hover:shadow-xs"
            type="button"
          >
            Save
          </button>
        </Menu.Item>
      </Menu.Group>
    </>
  );
}
