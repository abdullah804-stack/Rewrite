\# Fixtures



The golden set. Every prompt change, model swap, or validation rule is tested

against these before it ships.



\## Folders



\### `clean/`

10 samples of human-written text, 300–800 words each.

\- Written by a person, not by an LLM.

\- Varied tone: casual, professional, technical, narrative.

\- No AI-isms.

\- Use: baseline to measure "how far does the rewrite drift from already-human text?"



\### `ai-drafts/`

10 drafts produced by ChatGPT / Claude / Gemini.

\- Different topics, lengths, registers.

\- Must contain AI-isms (stock phrases, uniform rhythm, hedging).

\- Use: the primary input for the rewrite pipeline.

\- Each draft should have a corresponding file in `target-voice/` with the same filename,

&#x20; representing what a human would have written with the same facts.



\### `target-voice/`

10 writing samples used as voice-profile targets.

\- Written by a specific person whose voice we want to match.

\- 300+ words each.

\- Use: to check whether profile-based rewrites actually converge toward the target.



\### `messy/`

5 inputs with awkward formatting:

\- Markdown with tables and code blocks

\- Mixed bullet styles

\- Emoji-heavy

\- Broken sentence structure

\- Mixed languages

\- Use: to check that normalize + protect handle real-world mess.



\### `adversarial/`

5 inputs designed to break the pipeline:

\- Prompt-injection attempts ("Ignore previous instructions and...")

\- Extremely long single words (300+ chars)

\- Numbers everywhere (phones, IDs, prices)

\- Quotes inside quotes inside quotes

\- Non-Latin scripts mixed with Latin

\- Use: to verify protection and validation catch everything.



\### `claims/`

5 inputs for the claim flagger:

\- Statistics with sources

\- Statistics without sources

\- Study references with citation

\- Study references without

\- Mixed

\- Use: to verify claim flagger sensitivity/specificity.



\### `empty/`

\- `empty.txt` — zero bytes



\### `large/`

\- `large.txt` — 5,000+ words of continuous text

\- Use: to test performance and the 1,500-word cap.



\## Naming convention



\- `01-topic.txt`, `02-topic.txt`, etc.

\- The number matters — it links `ai-drafts/NN-topic.txt` to `target-voice/NN-topic.txt`.



\## Collection



You don't need all 55 files at once. Start with:

\- 3 clean samples

\- 3 ai-drafts + 3 matching target-voice samples

\- 2 messy

\- 2 adversarial

\- 2 claims

\- 1 empty

\- 1 large



That's 17 files. Enough to run a meaningful eval. Add more as you find interesting edge cases.

