import { useCallback, type ChangeEvent } from "react";
import type { RRuleInputProps } from "~/hooks/useRRuleSet";

export default function RepeatCountInput({
  value,
  onChange,
}: RRuleInputProps<"repeat">) {
  const updateRepeatCount = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget.reportValidity()) {
        return;
      }

      onChange({
        repeat: {
          condition: "exactly",
          count: e.currentTarget.valueAsNumber,
        },
      });
    },
    [onChange],
  );

  if (value.condition !== "exactly") {
    return null;
  }

  return (
    <label className="flex items-center gap-x-[inherit]">
      <input
        className="relative w-full rounded-sm bg-gray-50 px-2 py-1 text-center ring ring-gray-400"
        onChange={updateRepeatCount}
        min={2}
        value={value.count}
        type="number"
      />
      <span className="text-gray-800">times</span>
    </label>
  );
}
