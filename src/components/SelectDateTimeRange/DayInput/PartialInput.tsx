"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import "react-day-picker/style.css";
import focusNext from "~/lib/focusNext";

interface Props {
  length: number;
  displayValue: string;
  min: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function PartialInput({
  length,
  displayValue,
  min,
  max,
  onChange,
}: Props) {
  const [keysPressed, setKeysPressed] = useState(0);
  const [value, setValue] = useState<string>("");

  const handleFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
    setKeysPressed(0);
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      setKeysPressed(0);
      e.currentTarget.select();
      return;
    }

    if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key)) {
      setKeysPressed((p) => p + 1);
      return;
    }
  }, []);

  const handleBlur = useCallback(() => {
    const numericValue = parseInt(value);

    if (
      isNaN(numericValue) ||
      numericValue < min ||
      (max && numericValue > max)
    ) {
      setValue(displayValue);
      return;
    }

    onChange(numericValue);
  }, [onChange, value, displayValue, max, min]);

  useEffect(() => {
    setValue(displayValue);
  }, [displayValue]);

  useEffect(() => {
    if (keysPressed >= length) {
      requestAnimationFrame(() => {
        focusNext();
      });
    }
  }, [keysPressed, length]);

  return (
    <input
      style={{ width: `${length}ch` }}
      className="hide-spin-controls outline-none"
      value={value}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      type="number"
      min={min}
      max={max}
      step={1}
    />
  );
}
