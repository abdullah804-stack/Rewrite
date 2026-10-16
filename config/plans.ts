// Rewrite is 100% free. No payment code exists.
// If monetization ever happens, this function reads the Subscription table.
// Until then, every user gets FREE and this file is the only place to change.
//
// Limits chosen from eval measurements (2026-10-16):
// - Groq free tier: 8,000 tokens/min per org — supports about 3 concurrent
//   full rewrites. Fallback is OpenRouter (31s latency, 9/9 success).
// - Google free tier: 5 requests/min per model. Unusable as a fallback.
// - Cloudflare: drops protected spans. Not in the chain.
//
// Re-measure before scaling. These numbers assume a single small user base.

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