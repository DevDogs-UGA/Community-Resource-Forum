import { useCallback, type ChangeEvent } from "react";
import type { RRuleInputProps } from "~/hooks/useRRuleSet";

export default function IntervalInput({
  value,
  onChange,
}: RRuleInputProps<"interval">) {
  const updateInterval = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget.reportValidity()) {
        return;
      }

      onChange({
        interval: e.currentTarget.valueAsNumber,
      });
    },
    [onChange],
  );

  return (
    <input
      className="w-full rounded-sm bg-gray-50 px-2 py-1 text-center ring ring-gray-400"
      onChange={updateInterval}
      value={value}
      type="number"
    />
  );
}
