import raw from "../data/phrases.json";

export type PhraseCategory =
  | "stock-phrase"
  | "hedge"
  | "transition"
  | "intensifier"
  | "corporate"
  | "ai-tell";

export type PhraseEntry = {
  phrase: string;
  category: PhraseCategory;
  replacements: string[];
  notes: string;
};

export type PhrasesFile = {
  version: number;
  updated: string;
  categories: Record<PhraseCategory, string>;
  phrases: PhraseEntry[];
};

export const phrasesFile = raw as PhrasesFile;

export const phrases: PhraseEntry[] = phrasesFile.phrases;

export const phraseCategories = phrasesFile.categories;