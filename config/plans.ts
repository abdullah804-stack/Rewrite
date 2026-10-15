export const PLANS = {
  FREE: {
    name: "Free",
    rewriteWordsPerDay: 1500,
    maxWordsPerRun: 1500,
    maxVoiceProfiles: 3,
    historyRetentionDays: 14,
    anonymousWordsPerRun: 300,
    anonymousRunsPerDay: 3,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getLimits(_userId: string | null) {
  return PLANS.FREE;
}