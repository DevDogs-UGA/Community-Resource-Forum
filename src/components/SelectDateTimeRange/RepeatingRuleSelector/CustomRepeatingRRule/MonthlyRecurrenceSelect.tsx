import * as Select from "@radix-ui/react-select";
import {
  format,
  getWeekOfMonth,
  type GetWeekOfMonthOptions,
  getWeeksInMonth,
} from "date-fns";
import { useCallback } from "react";
import { PiCaretDownBold, PiCheckBold } from "react-icons/pi";
import addOrdinalSuffix from "~/lib/addOrdinalSuffix";
import { WeekdayNames } from "~/lib/Day";
import type { RRuleInputProps, RRuleOptions } from "~/hooks/useRRuleSet";

function isValidMonthlyRecurrence(
  str: string,
): str is Extract<
  RRuleOptions["recurrence"][],
  { frequency: "monthly" }
>["monthlyOn"] {
  return (
    str === "nthDay" ||
    str === "nthWeek" ||
    str === "lastDay" ||
    str === "lastWeek"
  );
}

interface Props extends RRuleInputProps<"recurrence"> {
  startDatetime: Date;
}

export default function MonthlyRecurrenceSelect({
  startDatetime,
  value,
  onChange,
}: Props) {
  const updateMonthlyRecurrence = useCallback(
    (monthlyOn: string) => {
      if (!isValidMonthlyRecurrence(monthlyOn)) {
        throw new Error("Invalid monthly recurrence");
      }

      onChange({ recurrence: { frequency: "monthly", monthlyOn } });
    },
    [onChange],
  );

  if (value.frequency !== "monthly") {
    return null;
  }

  return (
    <label className="contents">
      <span className="self-center text-gray-800">On</span>

      <Select.Root
        value={value.monthlyOn}
        onValueChange={updateMonthlyRecurrence}
      >
        <Select.Trigger className="col-span-2 flex w-full items-center justify-between rounded-sm bg-gray-50 px-2 py-1 ring ring-gray-400">
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
            value="nthWeek"
          >
            <Select.ItemText>
              the {addOrdinalSuffix(getWeekOfMonth(startDatetime))}{" "}
              {WeekdayNames[startDatetime.getDay()]}
            </Select.ItemText>
            <Select.ItemIndicator asChild>
              <PiCheckBold className="text-gray-800/80" />
            </Select.ItemIndicator>
          </Select.Item>

          {getWeekOfMonth(startDatetime, {
            weekStartsOn: startDatetime.getDay(),
          } as GetWeekOfMonthOptions) ===
            getWeeksInMonth(startDatetime, {
              weekStartsOn: startDatetime.getDay(),
            } as GetWeekOfMonthOptions) && (
            <Select.Item
              className="flex items-center justify-between px-2 py-0.75 hover:bg-gray-200 data-[state=checked]:bg-sky-200"
              value="lastWeek"
            >
              <Select.ItemText>
                the last {format(startDatetime, "EEEE")}
              </Select.ItemText>
              <Select.ItemIndicator asChild>
                <PiCheckBold className="text-gray-800/80" />
              </Select.ItemIndicator>
            </Select.Item>
          )}

          <Select.Item
            className="flex items-center justify-between px-2 py-0.75 hover:bg-gray-200 data-[state=checked]:bg-sky-200"
            value="nthDay"
          >
            <Select.ItemText>
              the {addOrdinalSuffix(startDatetime.getDate())}
            </Select.ItemText>
            <Select.ItemIndicator asChild>
              <PiCheckBold className="text-gray-800/80" />
            </Select.ItemIndicator>
          </Select.Item>

          {startDatetime.getDate() >= 28 && (
            <Select.Item
              className="flex items-center justify-between px-2 py-0.75 hover:bg-gray-200 data-[state=checked]:bg-sky-200"
              value="lastDay"
            >
              <Select.ItemText>the last day</Select.ItemText>
              <Select.ItemIndicator asChild>
                <PiCheckBold className="text-gray-800/80" />
              </Select.ItemIndicator>
            </Select.Item>
          )}
        </Select.Content>
      </Select.Root>
    </label>
  );
}
