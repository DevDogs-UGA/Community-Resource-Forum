"use client";

import { useEffect, useState } from "react";

export type FilterParams = {
  search?: string;
  startDate?: string;
  endDate?: string;
  flagged?: number;
  archived?: number;
  minComments?: number;
};

interface FilterWindowProps {
  onClose: () => void;
  onApply: (filters: FilterParams) => void;
}

export function FilterWindow({ onClose, onApply }: FilterWindowProps) {
  const [filters, setFilters] = useState<FilterParams>({});

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = <K extends keyof FilterParams>(
    key: K,
    value: FilterParams[K],
  ) => {
    setFilters((s) => ({ ...s, [key]: value }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => setFilters({});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Search Filters</h3>
          <button
            aria-label="Close filters"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="text-sm text-gray-600">Search Term</div>
            <input
              value={filters.search ?? ""}
              onChange={(e) => update("search", e.target.value || undefined)}
              className="mt-1 w-full rounded border px-2 py-1"
              placeholder="Search posts..."
            />
          </label>

          <div className="flex gap-2">
            <label className="flex-1">
              <div className="text-sm text-gray-600">Start date</div>
              <input
                type="date"
                value={filters.startDate ?? ""}
                onChange={(e) =>
                  update("startDate", e.target.value || undefined)
                }
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
            <label className="flex-1">
              <div className="text-sm text-gray-600">End date</div>
              <input
                type="date"
                value={filters.endDate ?? ""}
                onChange={(e) => update("endDate", e.target.value || undefined)}
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
          </div>

          <div className="block">
            <div className="mb-1 text-sm text-gray-600">Flagged</div>
            <button
              type="button"
              onClick={() =>
                update("flagged", filters.flagged === 1 ? undefined : 1)
              }
              className={`w-full rounded px-3 py-2 text-sm font-medium ${
                filters.flagged === 1
                  ? "bg-red-500 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filters.flagged === 1 ? "Flagged" : "Not Flagged"}
            </button>
          </div>

          <div className="block">
            <div className="mb-1 text-sm text-gray-600">Archived</div>
            <button
              type="button"
              onClick={() =>
                update("archived", filters.archived === 1 ? undefined : 1)
              }
              className={`w-full rounded px-3 py-2 text-sm font-medium ${
                filters.archived === 1
                  ? "bg-yellow-500 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filters.archived === 1 ? "Archived" : "Not Archived"}
            </button>
          </div>

          <label className="block">
            <div className="text-sm text-gray-600">Minimum comments</div>
            <input
              type="number"
              min={0}
              value={filters.minComments ?? ""}
              onChange={(e) =>
                update(
                  "minComments",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="mt-1 w-full rounded border px-2 py-1"
              placeholder="e.g. 5"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded bg-[#02ACF7] px-4 py-1 text-sm text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
