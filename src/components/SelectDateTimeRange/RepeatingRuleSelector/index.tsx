import * as Menu from "@radix-ui/react-dropdown-menu";
import { PiCaretDownBold, PiCaretRightBold, PiCheckBold } from "react-icons/pi";
import type useRRuleSet from "~/hooks/useRRuleSet";
import CustomRepeatingRule from "./CustomRepeatingRRule";

interface Props {
  rruleSet: ReturnType<typeof useRRuleSet>;
}

export default function RepeatingRuleSelector({ rruleSet: state }: Props) {
  return (
    <>
      <div className="grow">
        <Menu.Root>
          <Menu.Trigger className="relative flex w-full items-center justify-between rounded-sm bg-white px-3 py-1.5 text-left ring ring-gray-400">
            {state.rrule.displayText}
            <PiCaretDownBold className="size-4 fill-black/60 group-data-hover:fill-black" />
          </Menu.Trigger>

          <Menu.Portal>
            <Menu.Content
              sideOffset={4}
              className="z-100 w-(--radix-dropdown-menu-trigger-width) rounded-sm border border-gray-600 bg-white py-1 text-sm shadow-xl"
            >
              {state.type === "custom" ? (
                <CustomRepeatingRule {...state} />
              ) : (
                <Menu.Group>
                  <Menu.Item asChild>
                    <button
                      className="group flex w-full items-center justify-between px-3 py-1 text-left transition-colors hover:bg-gray-200 data-[selected=true]:bg-sky-200"
                      data-selected={state.preset === "none"}
                      onClick={() => state.setPreset("none")}
                    >
                      Does not repeat
                      <PiCheckBold className="opacity-70 not-group-data-[selected=true]:hidden" />
                    </button>
                  </Menu.Item>

                  <Menu.Separator className="my-1 h-px w-full bg-gray-300" />

                  {Object.entries(state.rrulePresets)
                    .filter(([_, preset]) => preset.enabled && preset.options)
                    .map(([key, preset]) => (
                      <Menu.Item key={key} asChild>
                        <button
                          className="group flex w-full items-center justify-between px-3 py-1 text-left transition-colors hover:bg-gray-200 data-[selected=true]:bg-sky-200"
                          data-selected={state.preset === key}
                          onClick={() =>
                            state.setPreset(
                              key as keyof typeof state.rrulePresets,
                            )
                          }
                        >
                          {preset.description}
                          <PiCheckBold className="opacity-70 not-group-data-[selected=true]:hidden" />
                        </button>
                      </Menu.Item>
                    ))}

                  <Menu.Separator className="my-1 h-px w-full bg-gray-300" />

                  <Menu.Item onSelect={(e) => e.preventDefault()} asChild>
                    <button
                      className="group flex w-full items-center justify-between px-3 py-1 text-left transition-colors hover:bg-gray-200"
                      onClick={() => state.setType("custom")}
                      type="button"
                    >
                      Custom...
                      <PiCaretRightBold className="opacity-70 transition-opacity group-hover:opacity-100" />
                    </button>
                  </Menu.Item>
                </Menu.Group>
              )}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </>
  );
}
