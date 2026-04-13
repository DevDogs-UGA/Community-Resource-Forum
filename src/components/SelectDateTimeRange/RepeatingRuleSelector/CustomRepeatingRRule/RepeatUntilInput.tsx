import { addMonths } from "date-fns";
import { useCallback, type SetStateAction } from "react";
import type { Day } from "~/lib/Day";
import type { RRuleInputProps } from "~/hooks/useRRuleSet";
import DayInput from "../../DayInput";

interface Props extends RRuleInputProps<"repeat"> {
  startDay: Day;
}

export default function RepeatUntilInput({ startDay, value, onChange }: Props) {
  const updateRepeatUntil = useCallback(
    (day: SetStateAction<Day>) => {
      onChange({
        repeat: ({ repeat, startDay }) => ({
          condition: "until",
          until:
            typeof day === "function"
              ? repeat.condition === "until"
                ? day(repeat.until)
                : startDay.map(addMonths, 2)
              : day,
        }),
      });
    },
    [onChange],
  );

  if (value.condition !== "until") {
    return null;
  }

  return (
    <div className="contents *:bg-gray-50!">
      <DayInput
        min={startDay}
        value={value.until}
        onChange={updateRepeatUntil}
      />
    </div>
  );
}
