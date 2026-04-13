import * as Select from "@radix-ui/react-select";
import { addMonths } from "date-fns";
import { useCallback } from "react";
import { PiCaretDownBold, PiCheckBold } from "react-icons/pi";
import { Day } from "~/lib/Day";
import type { RRuleInputProps, RRuleState } from "~/hooks/useRRuleSet";

interface Props extends RRuleInputProps<"repeat"> {
  getRecurrences: RRuleState["rrule"]["getRecurrences"];
}

export default function RepeatConditionSelect({
  getRecurrences,
  value,
  onChange,
}: Props) {
  const updateRepeatCondition = useCallback(
    (condition: string) => {
      switch (condition) {
        case "forever":
          onChange({ repeat: { condition } });
          break;
        case "until":
          onChange({
            repeat: ({ repeat, startDay }) => {
              const defaultValue = startDay.map(addMonths, 2);
              switch (repeat.condition) {
                case "forever":
                  return { condition, until: defaultValue };
                case "until":
                  return repeat;
                case "exactly":
                  return {
                    condition,
                    until:
                      (() => {
                        const last = getRecurrences("rrule").at(-1);
                        return last && Day.fromUTC(last);
                      })() ?? defaultValue,
                  };
              }
            },
          });
          break;
        case "exactly":
          onChange({
            repeat: ({ repeat }) => {
              const defaultValue = 12;
              switch (repeat.condition) {
                case "forever":
                  return { condition, count: defaultValue };
                case "until":
                  return {
                    condition,
                    count: getRecurrences("rrule").length,
                  };
                case "exactly":
                  return repeat;
              }
            },
          });
          break;
      }
    },
    [onChange, getRecurrences],
  );

  return (
    <Select.Root
      value={value.condition}
      onValueChange={updateRepeatCondition}
    >
      <Select.Trigger className="flex w-full items-center justify-between rounded-sm bg-gray-50 px-2 py-1 ring ring-gray-400">
        <Select.Value />

        <Select.Icon asChild>
          <PiCaretDownBold className="text-gray-600" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Content
        sideOffset={4}
        className="z-120 w-(--radix-select-trigger-width) rounded-sm border border-gray-500 bg-white py-0.75 text-sm shadow-xl"
        position="popper"
      >
        <Select.Item
          className="flex items-center justify-between px-2 py-0.75 hover:bg-gray-200 data-[state=checked]:bg-sky-200"
          value="forever"
        >
          <Select.ItemText>Forever</Select.ItemText>
          <Select.ItemIndicator asChild>
            <PiCheckBold className="text-gray-800/80" />
          </Select.ItemIndicator>
        </Select.Item>
        <Select.Item
          className="flex items-center justify-between px-2 py-0.75 hover:bg-gray-200 data-[state=checked]:bg-sky-200"
          value="until"
        >
          <Select.ItemText>Until</Select.ItemText>
          <Select.ItemIndicator asChild>
            <PiCheckBold className="text-gray-800/80" />
          </Select.ItemIndicator>
        </Select.Item>
        <Select.Item
          className="flex items-center justify-between px-2 py-0.75 hover:bg-gray-200 data-[state=checked]:bg-sky-200"
          value="exactly"
        >
          <Select.ItemText>Exactly</Select.ItemText>
          <Select.ItemIndicator asChild>
            <PiCheckBold className="text-gray-800/80" />
          </Select.ItemIndicator>
        </Select.Item>
      </Select.Content>
    </Select.Root>
  );
}
