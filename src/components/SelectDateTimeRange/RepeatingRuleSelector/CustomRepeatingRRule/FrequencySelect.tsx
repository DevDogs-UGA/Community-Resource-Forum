import * as Select from "@radix-ui/react-select";
import { useCallback } from "react";
import { PiCaretDownBold, PiCheckBold } from "react-icons/pi";
import type { RRuleInputProps } from "~/hooks/useRRuleSet";

interface SelectItemProps {
  value: string;
  children: string;
}

function SelectItem({ value, children }: SelectItemProps) {
  return (
    <Select.Item
      className="flex items-center justify-between px-2 py-0.75 hover:bg-gray-200 data-[state=checked]:bg-sky-200"
      value={value}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator asChild>
        <PiCheckBold className="text-gray-800/80" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

export default function FrequencySelect({
  value,
  onChange,
}: RRuleInputProps<"recurrence">) {
  const updateRecurrenceFrequency = useCallback(
    (frequency: string) => {
      switch (frequency) {
        case "daily":
          onChange({ recurrence: { frequency } });
          break;
        case "weekly":
          onChange({ recurrence: { frequency, weeklyOn: [] } });
          break;
        case "monthly":
          onChange({ recurrence: { frequency, monthlyOn: "nthWeek" } });
          break;
        case "yearly":
          onChange({ recurrence: { frequency } });
          break;
        default:
          throw new Error("Invalid frequency");
      }
    },
    [onChange],
  );

  return (
    <Select.Root
      value={value.frequency}
      onValueChange={updateRecurrenceFrequency}
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
        <SelectItem value="daily">Days</SelectItem>
        <SelectItem value="weekly">Weeks</SelectItem>
        <SelectItem value="monthly">Months</SelectItem>
        <SelectItem value="yearly">Years</SelectItem>
      </Select.Content>
    </Select.Root>
  );
}
