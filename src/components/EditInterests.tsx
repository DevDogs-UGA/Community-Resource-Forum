"use client";

import { useState, useTransition } from "react";
import { PiPlusBold, PiXBold } from "react-icons/pi";
import { addInterest, removeInterest } from "~/server/actions/interests";
import type { schema } from "~/server/db/schema";

interface Props {
  currentInterests: {
    tagId: string;
    tagName: string;
    weight: string;
  }[];
  allTags: (typeof schema.tags.$inferSelect)[];
}

export default function EditInterests({ currentInterests, allTags }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const currentTagIds = new Set(currentInterests.map((i) => i.tagId));
  const availableTags = allTags.filter(
    (t) => !currentTagIds.has(t.id) && t.depth > 0,
  );

  const handleRemove = (tagId: string) => {
    startTransition(async () => {
      await removeInterest(tagId);
    });
  };

  const handleAdd = (tagId: string) => {
    startTransition(async () => {
      await addInterest(tagId);
      setShowAddMenu(false);
    });
  };

  // Group available tags by category
  const categories = allTags.filter((t) => t.depth === 0);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Your Interests</label>

      {/* Current Interests */}
      <div className="flex flex-wrap gap-2">
        {currentInterests.length === 0 ? (
          <p className="text-sm text-gray-500">No interests selected yet.</p>
        ) : (
          currentInterests.map((interest) => (
            <span
              key={interest.tagId}
              className="flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-800"
            >
              {interest.tagName}
              <span className="text-xs text-sky-600">({interest.weight})</span>
              <button
                type="button"
                onClick={() => handleRemove(interest.tagId)}
                disabled={isPending}
                className="ml-1 rounded-full p-0.5 hover:bg-sky-200 disabled:opacity-50"
              >
                <PiXBold className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Interest Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          disabled={isPending || availableTags.length === 0}
          className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <PiPlusBold /> Add Interest
        </button>

        {/* Dropdown Menu */}
        {showAddMenu && (
          <div className="absolute top-full left-0 z-10 mt-1 max-h-64 w-72 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
            {categories.map((category) => {
              const children = availableTags.filter(
                (t) => t.lft > category.lft && t.rgt < category.rgt,
              );

              if (children.length === 0) return null;

              return (
                <div key={category.id} className="border-b border-gray-100 p-2">
                  <p className="mb-1 text-xs font-semibold text-gray-500 uppercase">
                    {category.name}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {children.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAdd(tag.id)}
                        disabled={isPending}
                        className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-sky-100 hover:text-sky-800 disabled:opacity-50"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowAddMenu(false)}
              className="w-full p-2 text-center text-sm text-gray-500 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
