/**
 * Prompt templates and system instructions for Deep Flashcard Explanations & Mnemonic Assistance.
 */

export interface FlashcardExplanationPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  targetItem: string;
  cardType?: string;
  partOfSpeech?: string;
  frequencyRank?: number | string;
  definition?: string;
  usageNotes?: string;
  examples?: Array<{ target: string; translation: string; phonetic?: string }>;
  query?: string;
}

export function getExplainCardSystemInstruction(options: FlashcardExplanationPromptOptions): string {
  const { targetLanguage, knownLanguage, targetItem, cardType = "vocabulary", partOfSpeech = "general", frequencyRank = "N/A" } = options;

  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어");

  let languageDirectives = "";
  if (isKorean) {
    languageDirectives = `
KOREAN GRAMMATICAL STRUCTURE GUIDANCE:
- Word Order: Strictly Subject-Object-Verb (SOV). Show how "${targetItem}" sits in an SOV sentence with proper postpositional particles (조사: -은/는, -이/가, -을/를, -에/에서, -(으)로).
- Conjugation & Speech Level: Use natural Informal Polite (해요체: -아요/어요/해요) for examples.
- Script: Write all Korean text in standard Hangul (한글) and phonetic fields in Revised Romanization. Never output Chinese characters.`;
  }

  return `You are a master polyglot tutor and linguist.
The student is learning ${targetLanguage} (known language: ${knownLanguage}) and hit "I don't know this" on the flashcard: "${targetItem}".
(Type: ${cardType}, Frequency Rank: #${frequencyRank}, Part of speech: ${partOfSpeech}).${languageDirectives}

Your job is to provide a crystal-clear, comprehensive learning guide with:
1. Precise definition in ${knownLanguage}.
2. Phonetic guide / IPA / Romanization / Pinyin / Furigana as appropriate for ${targetLanguage}.
3. Usage format / grammar pattern / conjugation formula (e.g. how it fits into a sentence).
4. Pedagogical rule explanation in ${knownLanguage}.
5. 3 to 4 varied, practical real-life example sentences in ${targetLanguage} with exact translations and phonetic guides.
6. 2-3 common collocations or set expressions.
7. A memorable mnemonic / memory hook to make it stick permanently.
8. Common pitfalls/mistakes learners make with this word or grammar concept.`;
}

export function getExplainCardUserPrompt(options: FlashcardExplanationPromptOptions): string {
  const { targetItem, targetLanguage, knownLanguage } = options;
  return `Explain the target item: "${targetItem}" in ${targetLanguage} for a native ${knownLanguage} speaker.`;
}

// Aliases for compatibility
export const getFlashcardExplanationSystemInstruction = getExplainCardSystemInstruction;
export const getFlashcardExplanationUserPrompt = getExplainCardUserPrompt;
