import { computeMetrics } from "./metrics";

export type CoachResult = {
  score: number;
  feedback: string[];
  ready: boolean;
};

export function analyzeSample(text: string): CoachResult {
  const metrics = computeMetrics(text);
  const feedback: string[] = [];
  let score = 100;

  if (metrics.wordCount < 100) {
    return {
      score: 0,
      feedback: ["Sample is too short. Paste at least 100 words (ideally 150+)."],
      ready: false,
    };
  }

  if (metrics.wordCount < 150) {
    score -= 20;
    feedback.push("A bit short. 150–300 words gives the AI a much better read on your voice.");
  }

  if (metrics.sentenceLenSd < 3) {
    score -= 20;
    feedback.push("Your sentences are very uniform in length. Try including a mix of short and long sentences.");
  }

  if (metrics.contractionRate < 0.01) {
    score -= 10;
    feedback.push("Very few contractions (like 'don't', 'it's'). Is this how you normally write?");
  }

  if (metrics.readingGrade > 15) {
    score -= 10;
    feedback.push("This reads at a very high grade level. Ensure this matches your actual target audience.");
  }

  if (feedback.length === 0) {
    feedback.push("Great sample! This has enough variety and length to build a strong voice profile.");
  }

  return {
    score: Math.max(0, score),
    feedback,
    ready: true,
  };
}