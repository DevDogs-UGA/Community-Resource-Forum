import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useCallback } from "react";
import { ALL_WEEKDAYS, type WeekdayStr } from "rrule";
import type { RRuleInputProps } from "~/hooks/useRRuleSet";

function areValidWeekdays(array: string[]): array is WeekdayStr[] {
  return array.every((item) => ALL_WEEKDAYS.includes(item as WeekdayStr));
}

export default function WeeklyRecurrenceToggleGroup({
  value,
  onChange,
}: RRuleInputProps<"recurrence">) {
  const updateWeeklyRecurrence = useCallback(
    (weeklyOn: string[]) => {
      if (weeklyOn.length <= 0) {
        return;
      }

      if (!areValidWeekdays(weeklyOn)) {
        throw new Error("Invalid weekdays");
      }

      onChange({ recurrence: { frequency: "weekly", weeklyOn } });
    },
    [onChange],
  );

  if (value.frequency !== "weekly") {
    return null;
  }

  return (
    <fieldset className="contents">
      <legend className="self-center text-gray-800">On</legend>

      <ToggleGroup.Root
        className="col-span-2 flex items-center justify-around px-2"
        type="multiple"
        value={value.weeklyOn}
        onValueChange={updateWeeklyRecurrence}
      >
        <ToggleGroup.Item
          className="block size-7 rounded-full p-1 text-xs font-medium ring-sky-800 hover:ring data-[state=on]:bg-sky-200 data-[state=on]:font-bold"
          value={ALL_WEEKDAYS[6]!}
        >
          {ALL_WEEKDAYS[6]}
        </ToggleGroup.Item>
        {ALL_WEEKDAYS.slice(0, 6).map((day) => (
          <ToggleGroup.Item
            className="block size-7 rounded-full p-1 text-xs font-medium ring-sky-800 hover:ring data-[state=on]:bg-sky-200 data-[state=on]:font-bold"
            value={day}
            key={day}
          >
            {day}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </fieldset>
  );
}
