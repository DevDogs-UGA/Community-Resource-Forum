"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { PiPaperPlaneTiltBold, PiUsersBold } from "react-icons/pi";
import SelectProfile from "~/components/SelectProfile";
import { createPost } from "~/server/actions/post";
import type { schema } from "~/server/db/schema";
import { useCreatePostContext } from "../CreatePostContext";
import ContentEditor from "./ContentEditor";
import DisplayPending from "./DisplayPending";
import SelectAttachments from "./SelectAttachments";
import SelectEvent from "./SelectEvent";
import SelectTags from "./SelectTags";

type ProfileWithUploads = typeof schema.profiles.$inferSelect & {
  uploads: (typeof schema.uploads.$inferSelect)[];
};

interface Props {
  userProfile: ProfileWithUploads;
  orgsCanCreatePost: ProfileWithUploads[];
  orgsCanCreateEvent: ProfileWithUploads[];
  events: (typeof schema.events.$inferSelect)[];
}

export default function CreatePostDialog({
  userProfile,
  orgsCanCreatePost,
  orgsCanCreateEvent,
  events,
}: Props) {
  const { open, setOpen, defaultValue } = useCreatePostContext();
  const [selectedProfileId, setSelectedProfileId] = useState(userProfile.id);
  const selectedProfile = useMemo(
    () =>
      [userProfile, ...orgsCanCreatePost].find(
        (p) => p.id === selectedProfileId,
      )!,
    [selectedProfileId, userProfile, orgsCanCreatePost],
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed z-60 h-dvh w-dvw bg-black/40" />

        <Dialog.Content className="fixed top-1/2 left-1/2 z-70 flex max-h-dvh w-dvw max-w-2xl -translate-1/2 flex-col px-4 py-6">
          <div className="grow overflow-x-hidden overflow-y-scroll rounded-md border border-gray-500 bg-gray-50 shadow-xl">
            <Dialog.Title asChild>
              <h1 className="sticky top-0 z-90 w-full bg-gray-300 px-6 py-4 text-left text-xl font-bold shadow-xs">
                Create a Post
              </h1>
            </Dialog.Title>

            <form
              className="flex flex-col items-center gap-7 px-6 pt-4 pb-11"
              action={createPost}
            >
              <DisplayPending>
                <label className="flex w-full flex-col gap-2">
                  <span className="mx-auto flex w-full items-center gap-2 font-bold">
                    <PiUsersBold className="-scale-x-100" /> Post as
                  </span>

                  <SelectProfile
                    inputName="authorId"
                    userProfile={userProfile}
                    organizationProfiles={orgsCanCreatePost}
                    value={selectedProfileId}
                    onChange={setSelectedProfileId}
                    defaultValue={defaultValue?.authorId}
                  />
                </label>

                <SelectTags
                  inputName="tags"
                  defaultValue={defaultValue?.tags}
                />
                
                <ContentEditor defaultValue={defaultValue?.content} />

                <SelectEvent
                  events={events}
                  userProfile={userProfile}
                  organizationProfiles={orgsCanCreateEvent}
                  defaultValue={defaultValue?.event}
                />

                <SelectAttachments
                  profile={selectedProfile}
                  defaultValue={defaultValue?.attachments}
                  multiple
                />

                <button className="mt-2 flex items-center gap-3 rounded-sm border-b-2 border-sky-900 bg-sky-800 px-6 py-1 text-lg font-medium text-white shadow-sm ring-1 ring-sky-950 transition-colors hover:bg-sky-50 hover:text-sky-800 focus:mt-0.5 focus:border-b-0">
                  <span className="contents">
                    Publish <PiPaperPlaneTiltBold />
                  </span>
                </button>
              </DisplayPending>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
