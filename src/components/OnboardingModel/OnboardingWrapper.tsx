"use client";

import { useState } from "react";
import type { schema } from "~/server/db/schema";
import OnboardingModal from "./index";

interface Props {
  needsOnboarding: boolean;
  tags: (typeof schema.tags.$inferSelect)[];
  children: React.ReactNode;
}

export default function OnboardingWrapper({
  needsOnboarding,
  tags,
  children,
}: Props) {
  const [showModal, setShowModal] = useState(needsOnboarding);

  return (
    <>
      {children}
      <OnboardingModal
        open={showModal}
        tags={tags}
        onComplete={() => setShowModal(false)}
      />
    </>
  );
}
