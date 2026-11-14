/**
 * Generates extra AI-style test texts so the benchmark can reach 30+ samples.
 *
 *   npx tsx bench/gen-corpus.ts 20        -> writes bench/corpus-extra.json (needs your provider API keys in .env)
 *   npx tsx bench/run-bench.ts --corpus bench/corpus.json,bench/corpus-extra.json
 *
 * The texts are meant to look like a typical chatbot answer: generic, tidy, full of stock phrasing.
 * That is the input your tool is supposed to fix.
 */
import "dotenv/config";
import fs from "fs";
import { chatWithFallback } from "../lib/ai/chat";

const TOPICS = [
  "the benefits of learning a second language", "how to prepare for a job interview", "the rise of electric vehicles",
  "why sleep matters for students", "the importance of cybersecurity for small businesses", "how social media affects teenagers",
  "urban gardening and food security", "the future of online learning", "time management for busy professionals",
  "the history of the printing press", "pros and cons of nuclear energy", "how to start a small business",
  "the role of exercise in mental health", "why reading habits are declining", "the gig economy and worker rights",
  "microplastics and ocean health", "how to build a personal brand", "the impact of inflation on households",
  "the case for four-day work weeks", "how vaccines work and why they matter", "minimalism and consumer culture",
  "the ethics of facial recognition", "customer service in the age of chatbots", "the Silk Road and global trade",
  "how to negotiate a salary", "public transport and city planning", "the benefits of volunteering",
  "cloud computing for startups", "the science of habit formation", "water scarcity and conservation",
];

const count = Math.max(1, Number(process.argv[2]) || 18);
const SYSTEM = "You write the kind of generic, polished, well-structured explanatory text a chatbot produces. Use clear paragraphs, transitions like 'Furthermore' and 'Moreover', and a summarizing closing paragraph. Output only the text, no title, no markdown.";

(async () => {
  const out: { id: string; text: string }[] = [];
  for (let i = 0; i < count; i++) {
    const topic = TOPICS[i % TOPICS.length];
    process.stdout.write(`[${i + 1}/${count}] ${topic} ... `);
    try {
      const r = await chatWithFallback({
        system: SYSTEM,
        user: `Write about 250 words on: ${topic}. Include two specific figures or dates. Use 3 or 4 paragraphs.`,
        maxTokens: 900,
        temperature: 0.7,
      });
      const text = r.text.trim();
      const words = text.split(/\s+/).length;
      if (words < 180) { console.log(`too short (${words} words), skipped`); continue; }
      out.push({ id: `gen-${String(i + 1).padStart(2, "0")}-${topic.split(" ").slice(-2).join("-").replace(/[^a-z0-9-]/gi, "")}`, text });
      console.log(`ok (${words} words, ${r.provider})`);
    } catch (e) {
      console.log("failed:", (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  fs.writeFileSync("bench/corpus-extra.json", JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.length} texts to bench/corpus-extra.json`);
})();
