import {
  getISODay,
  getWeekOfMonth,
  getWeeksInMonth,
  type GetWeekOfMonthOptions,
} from "date-fns";
import {
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ActionDispatch,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ALL_WEEKDAYS,
  Frequency,
  RRule,
  RRuleSet,
  Weekday,
  type Options as LibOptions,
  type WeekdayStr,
} from "rrule";
import type { Day, Time } from "../lib/Day";
import capitalize from "../lib/capitalize";

interface DailyRecurrence {
  frequency: "daily";
}

interface WeeklyRecurrence {
  frequency: "weekly";
  weeklyOn: WeekdayStr[];
}

interface MonthlyRecurrence {
  frequency: "monthly";
  monthlyOn: "nthDay" | "nthWeek" | "lastDay" | "lastWeek";
}

interface YearlyRecurrence {
  frequency: "yearly";
}

interface RepeatForever {
  condition: "forever";
}

interface RepeatUntil {
  condition: "until";
  until: Day;
}

interface RepeatExactly {
  condition: "exactly";
  count: number;
}

interface RRuleOptions {
  interval: number;
  startDay: Day;
  startTime?: Time;
  includeDays: Day[];
  excludeDays: Day[];
  recurrence:
    | DailyRecurrence
    | WeeklyRecurrence
    | MonthlyRecurrence
    | YearlyRecurrence;
  repeat: RepeatForever | RepeatUntil | RepeatExactly;
}

interface RRulePresetDefinition {
  enabled: boolean;
  options: RRuleOptions | null;
}

type RRuleAction<K extends keyof RRuleOptions> =
  | RRuleOptions[K]
  | ((prevState: RRuleOptions) => RRuleOptions[K]);

type ActionRecord = {
  [K in keyof RRuleOptions]?: RRuleAction<K>;
};

function uppercase<S extends string>(s: S) {
  return s.toUpperCase() as Uppercase<S>;
}

function compileRRule(options: RRuleOptions) {
  const dtstart = options.startDay.toUTCDatetime(options.startTime);
  const localStart = options.startDay.toLocalDatetime(options.startTime);

  const rrule: Partial<LibOptions> = {
    dtstart,
    interval: options.interval,
    freq: Frequency[uppercase(options.recurrence.frequency)],
  };

  if (options.recurrence.frequency === "weekly") {
    rrule.byweekday = options.recurrence.weeklyOn.map((str) =>
      Weekday.fromStr(str),
    );
  }

  if (options.recurrence.frequency === "monthly") {
    switch (options.recurrence.monthlyOn) {
      case "nthWeek":
        rrule.byweekday = new Weekday(
          getISODay(localStart) - 1,
          getWeekOfMonth(localStart),
        );
        break;
      case "lastWeek":
        rrule.byweekday = new Weekday(getISODay(localStart) - 1, -1);
        break;
      case "nthDay":
        rrule.bymonthday = options.startDay.getDate();
        break;
      case "lastDay":
        rrule.bymonthday = -1;
        break;
    }
  }

  if (options.repeat.condition === "until") {
    rrule.until = options.repeat.until.toUTCDatetime(options.startTime);
  }

  if (options.repeat.condition === "exactly") {
    rrule.count = options.repeat.count;
  }

  return new RRule(rrule);
}

function defineRRulePreset({ enabled, options }: RRulePresetDefinition) {
  return {
    enabled,
    options,
    description: capitalize(
      options ? compileRRule(options).toText() : "Does not repeat",
    ),
  };
}

function createRRulePresets(startDay: Day, time?: Time) {
  return {
    none: defineRRulePreset({
      enabled: false,
      options: null,
    }),
    daily: defineRRulePreset({
      enabled: true,
      options: {
        startDay,
        startTime: time,
        interval: 1,
        recurrence: {
          frequency: "daily",
        },
        repeat: {
          condition: "forever",
        },
        includeDays: [],
        excludeDays: [],
      },
    }),
    weekdays: defineRRulePreset({
      enabled: true,
      options: {
        startDay,
        startTime: time,
        interval: 1,
        recurrence: {
          frequency: "weekly",
          weeklyOn: ["MO", "TU", "WE", "TH", "FR"],
        },
        repeat: {
          condition: "forever",
        },
        includeDays: [],
        excludeDays: [],
      },
    }),
    weekly: defineRRulePreset({
      enabled: true,
      options: {
        startDay,
        startTime: time,
        interval: 1,
        recurrence: {
          frequency: "weekly",
          weeklyOn: [ALL_WEEKDAYS[getISODay(startDay.toLocalDatetime()) - 1]!],
        },
        repeat: {
          condition: "forever",
        },
        includeDays: [],
        excludeDays: [],
      },
    }),
    monthlyNthWeek: defineRRulePreset({
      enabled: true,
      options: {
        startDay,
        startTime: time,
        interval: 1,
        recurrence: {
          frequency: "monthly",
          monthlyOn: "nthWeek",
        },
        repeat: {
          condition: "forever",
        },
        includeDays: [],
        excludeDays: [],
      },
    }),
    monthlyLastWeek: defineRRulePreset({
      enabled:
        getWeekOfMonth(startDay.toUTCDatetime(), {
          weekStartsOn: startDay
            .toUTCDatetime()
            .getDay() as GetWeekOfMonthOptions["weekStartsOn"],
        }) ===
        getWeeksInMonth(startDay.toUTCDatetime(), {
          weekStartsOn: startDay
            .toUTCDatetime()
            .getDay() as GetWeekOfMonthOptions["weekStartsOn"],
        }),
      options: {
        startDay,
        startTime: time,
        interval: 1,
        recurrence: {
          frequency: "monthly",
          monthlyOn: "lastWeek",
        },
        repeat: {
          condition: "forever",
        },
        includeDays: [],
        excludeDays: [],
      },
    }),
    monthlyNthDay: defineRRulePreset({
      enabled: true,
      options: {
        startDay,
        startTime: time,
        interval: 1,
        recurrence: {
          frequency: "monthly",
          monthlyOn: "nthDay",
        },
        repeat: {
          condition: "forever",
        },
        includeDays: [],
        excludeDays: [],
      },
    }),
    monthlyLastDay: defineRRulePreset({
      enabled: startDay.getDate() >= 28,
      options: {
        startDay,
        startTime: time,
        interval: 1,
        recurrence: {
          frequency: "monthly",
          monthlyOn: "lastDay",
        },
        repeat: {
          condition: "forever",
        },
        includeDays: [],
        excludeDays: [],
      },
    }),
  };
}

function updateKey<K extends keyof RRuleOptions>(
  key: K,
  prevState: RRuleOptions,
  actionRecord: ActionRecord,
): RRuleOptions[K] {
  if (actionRecord[key] === undefined) {
    return prevState[key];
  }

  const action: RRuleAction<K> = actionRecord[key];

  if (typeof action === "function") {
    return action(prevState);
  }

  return action;
}

type PresetKeys = keyof ReturnType<typeof createRRulePresets>;

type DefaultValue = {
  startDay: Day;
  startTime?: Time;
} & (
  | { type?: "preset"; preset?: keyof PresetKeys }
  | ({ type: "custom" } & RRuleOptions)
);

export default function useRRuleSet(defaultValue: DefaultValue) {
  const rrulePresets = useMemo(
    () => createRRulePresets(defaultValue.startDay, defaultValue.startTime),
    [defaultValue],
  );

  const [type, setType] = useState<"preset" | "custom">("preset");
  const [preset, setPreset] = useState<PresetKeys>("none");

  const [options, updateOptions] = useReducer<RRuleOptions, [ActionRecord]>(
    (prevState, action): RRuleOptions => ({
      interval: updateKey("interval", prevState, action),
      startDay: updateKey("startDay", prevState, action),
      startTime: updateKey("startTime", prevState, action),
      includeDays: updateKey("includeDays", prevState, action),
      excludeDays: updateKey("excludeDays", prevState, action),
      recurrence: updateKey("recurrence", prevState, action),
      repeat: updateKey("repeat", prevState, action),
    }),
    defaultValue?.type === "custom"
      ? defaultValue
      : {
          startDay: defaultValue.startDay,
          startTime: defaultValue.startTime,
          interval: 1,
          recurrence: {
            frequency: "weekly",
            weeklyOn: [
              ALL_WEEKDAYS[
                getISODay(defaultValue.startDay.toLocalDatetime()) - 1
              ]!,
            ],
          },
          repeat: {
            condition: "forever",
          },
          includeDays: [],
          excludeDays: [],
        },
  );

  useEffect(() => {
    if (rrulePresets[preset].options) {
      updateOptions(rrulePresets[preset].options);
    } else {
      updateOptions(defaultValue);
    }
  }, [type, preset, rrulePresets, defaultValue]);

  const rrule = useMemo(
    () =>
      type === "preset" && preset === "none" ? null : compileRRule(options),
    [options, preset, type],
  );

  const rruleSet = useMemo(() => {
    if (rrule === null) {
      return null;
    }

    const rruleSet = new RRuleSet();

    rruleSet.rrule(rrule);

    options.includeDays.forEach((d) => {
      rruleSet.rdate(d.toUTCDatetime(options.startTime));
    });

    options.excludeDays.forEach((d) => {
      rruleSet.exdate(d.toUTCDatetime(options.startTime));
    });

    return rruleSet;
  }, [rrule, options]);

  return useMemo<RRuleState>(() => {
    const icalString = rruleSet?.toString();
    const displayText =
      type === "preset"
        ? rrulePresets[preset].description
        : capitalize(rrule!.toText());

    const getRecurrences = (
      type: "rrule" | "rruleSet",
      range?: RecurrenceRange,
    ) => {
      const target = type === "rrule" ? rrule : rruleSet;

      if (!target) {
        return [];
      }
      if (!range) {
        return target.all();
      }

      return target.between(range.after, range.before, range.inclusive);
    };

    if (type === "preset") {
      return {
        type,
        setType,
        preset,
        setPreset,
        rrulePresets,
        rrule: {
          getRecurrences,
          displayText,
          icalString,
        },
      };
    }

    return {
      type,
      setType,
      options,
      updateOptions,
      rrule: {
        getRecurrences,
        displayText,
        icalString,
      },
    };
  }, [type, preset, options, rrule, rruleSet, rrulePresets]);
}

type RecurrenceRange = { after: Date; before: Date; inclusive?: boolean };

interface BaseRRuleState {
  setType: Dispatch<SetStateAction<"preset" | "custom">>;
  rrule: {
    getRecurrences: (
      type: "rruleSet" | "rrule",
      range?: RecurrenceRange,
    ) => Date[];
    displayText: string;
    icalString: string | undefined;
  };
}

export interface CustomRRuleState extends BaseRRuleState {
  type: "custom";
  options: RRuleOptions;
  updateOptions: ActionDispatch<[ActionRecord]>;
}

export interface PresetRRuleState extends BaseRRuleState {
  type: "preset";
  preset: keyof ReturnType<typeof createRRulePresets>;
  rrulePresets: ReturnType<typeof createRRulePresets>;
  setPreset: Dispatch<
    SetStateAction<keyof ReturnType<typeof createRRulePresets>>
  >;
}

export type RRuleState = CustomRRuleState | PresetRRuleState;

export interface RRuleInputProps<K extends keyof RRuleOptions> {
  value: RRuleOptions[K];
  onChange: Dispatch<Record<K, RRuleAction<K>>>;
}
