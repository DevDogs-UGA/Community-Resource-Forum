export const INTEREST_WEIGHTS = {
  // Onboarding - user explicitly selects interest
  INITIAL_SELECTION: 2.0,

  // Voting signals
  UPVOTE: 0.5,
  DOWNVOTE_INCORRECT: -0.1,
  DOWNVOTE_HARMFUL: -0.3,
  DOWNVOTE_SPAM: -0.2,

  // Bounds
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 10,
} as const;

export type VoteType = "up" | "down.incorrect" | "down.harmful" | "down.spam";

export const VOTE_WEIGHT_MAP: Record<VoteType, number> = {
  up: INTEREST_WEIGHTS.UPVOTE,
  "down.incorrect": INTEREST_WEIGHTS.DOWNVOTE_INCORRECT,
  "down.harmful": INTEREST_WEIGHTS.DOWNVOTE_HARMFUL,
  "down.spam": INTEREST_WEIGHTS.DOWNVOTE_SPAM,
};
