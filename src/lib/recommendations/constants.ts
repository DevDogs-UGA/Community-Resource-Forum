export const INTEREST_WEIGHTS = {
  // Onboarding - user explicitly selects interest
  INITIAL_SELECTION: 2.0,

  // Voting signals
  UPVOTE: 0.5,
  DOWNVOTE: -0.5,

  // Bounds
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 10,
} as const;