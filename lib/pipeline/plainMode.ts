/**
 * "Plain mode" (used by the Stealth preset, and switchable per request for A/B tests).
 *
 * It exists because of one controlled pair: a tool output that StealthWriter scored 0% human, and a light
 * rewrite of that exact text that scored 100%. Both texts sat at reading grade 8.2 with the same average word
 * length, so "plain words" was not what separated them. What did differ, measurably: commas per sentence
 * (0.91 vs 0.28), the simple future with "you" ("will help", 21 uses vs 0), shorter sentences (16.3 vs 14.0
 * words), no comma after openers like "However", and literal wording instead of lively phrases. The detector the
 * output was also run through named "unusual punctuation consistency" as one of its reasons for the 0% text.
 *
 * That is one pair, so this mode is an experiment: it is measured with `pnpm bench --plain on|off`.
 */

export const PLAIN_SYSTEM = `You rewrite a draft in plain, simple English, the way an ordinary careful writer would explain it. Keep the draft's points in the draft's order, and rewrite every sentence in your own plain words.

HARD RULES
1. Preserve every fact, number, name, claim and the logic connecting them. Add nothing: no new examples, scenes, people, questions, asides or closing lines. Never invent statistics, quotes, names, dates, credentials or personal history.
2. Keep the order of the draft's ideas. Do not reorder them. You may join two very short sentences or split a long one, but every point stays where it was.
3. One idea per sentence, in a simple shape: subject, verb, object. Most sentences should be 10 to 16 words. Do not stack clauses.
4. Use very few commas. Most sentences should have none, and none should have more than one. Do not put a comma after an opening word such as however, overall, therefore or also. Do not set off an aside with commas. Do not use semicolons, colons, dashes or parentheses.
5. Where the draft states general benefits, effects or advice, write in the plain future or present and speak to the reader as "you": things will help you, you will feel, you can do. Do this in most sentences where it fits naturally.
6. Use common, literal words. No metaphors, idioms, slang, vivid verbs or flourishes. Choose the ordinary word over the clever one.
7. Do not open many sentences with connecting words. Start with the subject, or with an "-ing" phrase naming the activity.
8. Every sentence must use different wording from the draft. Never copy a sentence, and do not repeat a point you already made.
9. Keep placeholders such as [FACT_1] exactly as written.
10. Every sentence must be complete and every pronoun must clearly refer to one thing. Never end on a question or a fragment.

OUTPUT FORMAT (CRITICAL)
Return valid JSON, nothing else:
{
  "paragraphs": [
    { "index": 0, "text": "..." }
  ]
}`;

export const PLAIN_INTENSITY_RULE =
  "Keep the draft's order of ideas. Rewrite every sentence in plain words so that no sentence matches the draft's wording.";

const INTRO_WORDS =
  "however|overall|therefore|thus|also|meanwhile|besides|moreover|furthermore|additionally|consequently|ultimately|generally|usually|instead|still|finally|honestly|similarly|likewise|nevertheless|nonetheless|hence|generally speaking|in addition|in conclusion|in summary|in practice|for example|for instance|as a result";
const INTRO_COMMA = new RegExp(`(^|[.!?]["')\\]]*\\s+)((?:${INTRO_WORDS}))\\s*,\\s+`, "gi");

/** Removes the comma after a sentence-opening word or phrase ("However, it works" -> "However it works"). */
export function dropIntroCommas(text: string): string {
  return text.replace(INTRO_COMMA, (_m, lead: string, word: string) => `${lead}${word} `);
}

/** Commas per sentence. */
export function commasPerSentence(text: string, sentenceCount: number): number {
  return sentenceCount ? (text.match(/,/g)?.length ?? 0) / sentenceCount : 0;
}
