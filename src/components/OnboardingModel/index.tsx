"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState, useTransition } from "react";
import {
  saveOnboardingInterests,
  skipOnboarding,
} from "~/server/actions/interests";
import type { schema } from "~/server/db/schema";
import DevDogsLogo from "~/assets/devdog.png";

interface Props {
  open: boolean;
  tags: (typeof schema.tags.$inferSelect)[];
  onComplete: () => void;
}

export default function OnboardingModal({ open, tags, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Debug: log tags on render
  console.log("=== MODAL RENDERED ===");
  console.log("Tags received:", tags.length);
  console.log(
    "Tags:",
    tags.map((t) => ({ id: t.id, name: t.name, depth: t.depth })),
  );

  const toggleTag = (tagId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      console.log("Selected tags:", Array.from(next));
      return next;
    });
  };

  const handleSubmit = () => {
    console.log("=== SUBMIT CLICKED ===");
    console.log("Selected tag IDs:", Array.from(selected));
    console.log("Selected count:", selected.size);

    startTransition(async () => {
      try {
        if (selected.size > 0) {
          console.log("Calling saveOnboardingInterests...");
          await saveOnboardingInterests(Array.from(selected));
          console.log("SUCCESS: Interests saved!");
        } else {
          console.log("Calling skipOnboarding...");
          await skipOnboarding();
          console.log("SUCCESS: Onboarding skipped!");
        }
        onComplete();
      } catch (error) {
        console.error("ERROR:", error);
      }
    });
  };

  // Group tags by parent (depth 0 = category headers, depth 1+ = selectable)
  const categories = tags.filter((t) => t.depth === 0);
  const childTags = tags.filter((t) => t.depth > 0);

  console.log(
    "Categories:",
    categories.map((c) => c.name),
  );
  console.log(
    "Child tags:",
    childTags.map((c) => c.name),
  );

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-70 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-8 shadow-2xl">
          {/* DevDogs Logo */}
          <div className="mb-4 flex justify-center">
            <Image
              src={DevDogsLogo}
              alt="DevDogs"
              width={72}
              height={72}
              className="h-18 w-18 object-contain"
            />
          </div>

          <div className="text-center">
            <Dialog.Title className="text-2xl font-bold text-gray-900">
              Welcome to DevDogs!
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600">
              Select topics you&apos;re interested in to personalize your feed.
            </Dialog.Description>
          </div>

          <div className="mt-6 max-h-80 overflow-y-auto">
            {/* If we have child tags, show grouped view */}
            {childTags.length > 0 ? (
              <div className="space-y-4">
                {categories.map((category) => {
                  // Find children of this category using nested set (lft/rgt)
                  const children = childTags.filter(
                    (t) => t.lft > category.lft && t.rgt < category.rgt,
                  );

                  if (children.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                        {category.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {children.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            disabled={isPending}
                            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                              selected.has(tag.id)
                                ? "bg-red-600 text-white ring-2 ring-red-300"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } disabled:opacity-50`}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback: show ALL tags as selectable (no children found)
              <div className="flex flex-wrap justify-center gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    disabled={isPending}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      selected.has(tag.id)
                        ? "bg-red-600 text-white ring-2 ring-red-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:opacity-50`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tags.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              No topics available yet. You can skip for now.
            </p>
          )}

          {/* Single button - changes based on selection */}
          <div className="mt-8 flex justify-end border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-50 ${
                selected.size > 0
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isPending ? (
                "Saving..."
              ) : selected.size > 0 ? (
                <>
                  Continue
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {selected.size}
                  </span>
                </>
              ) : (
                "Skip"
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
