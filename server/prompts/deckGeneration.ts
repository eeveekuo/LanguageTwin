/**
 * Prompt templates and system instructions for Deck Generation & Frequency Progression.
 */

export interface DeckGenerationPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  topic?: string;
  level?: string;
  count?: number;
  startFrequencyRank?: number;
}

export function getDeckGenerationSystemInstruction(options: DeckGenerationPromptOptions): string {
  const { targetLanguage, knownLanguage, topic, level = "A1-A2", count = 15, startFrequencyRank = 1 } = options;

  const isTraditionalChinese =
    (targetLanguage || "").toLowerCase().includes("traditional") ||
    (targetLanguage || "").toLowerCase().includes("繁體") ||
    (targetLanguage || "").toLowerCase().includes("zh-tw");

  const isHokkien =
    (targetLanguage || "").toLowerCase().includes("hokkien") ||
    (targetLanguage || "").toLowerCase().includes("taiwanese") ||
    (targetLanguage || "").toLowerCase().includes("台語") ||
    (targetLanguage || "").toLowerCase().includes("臺語");

  const isJapanese = (targetLanguage || "").toLowerCase().includes("japanese") || (targetLanguage || "").toLowerCase().includes("日本語");
  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어");

  let scriptDirectives = "";
  if (isTraditionalChinese) {
    scriptDirectives = `
SPECIAL SCRIPT REQUIREMENT FOR TRADITIONAL CHINESE:
- You MUST strictly write all target vocabulary, grammar patterns, and example sentences in standard TRADITIONAL CHINESE characters (繁體字 / 正體字, Taiwan/Hong Kong standard, e.g. 學習, 學校, 謝謝, 歡迎, 準備, 認識, 餐廳, 喜歡, 想要, 因為...所以...).
- DO NOT use Simplified Chinese (簡體字).
- In the 'phonetic' field, provide accurate tone-marked Pinyin (e.g. "xuéxí") and/or Zhuyin (e.g. "ㄒㄩㄝˊ ㄒㄧˊ").`;
  } else if (isHokkien) {
    scriptDirectives = `
SPECIAL SCRIPT REQUIREMENT FOR TAIWANESE HOKKIEN:
- Write target expressions with standard Han characters (漢羅 / 漢字) and Pe̍h-ōe-jī (POJ) or Tâi-lô romanization with tone diacritics in the phonetic field.`;
  } else if (isJapanese) {
    scriptDirectives = `
SPECIAL SCRIPT REQUIREMENT FOR JAPANESE:
- Provide Kanji with Kana in the target item and accurate Romaji / Hiragana pronunciation in the phonetic field.`;
  } else if (isKorean) {
    scriptDirectives = `
SPECIAL SCRIPT REQUIREMENT FOR KOREAN:
- Provide standard Hangul in target sentences and Revised Romanization in the phonetic field.`;
  }

  return `You are an expert computational linguist and language curriculum designer.
Generate a high-frequency spaced repetition flashcard deck for learning ${targetLanguage} (for ${knownLanguage} speakers).
Level: ${level}
Topic / Domain: ${topic || "Top Most Frequent Core Vocabulary & Essential Grammar"}
Number of cards: ${count}
Starting frequency rank index: ${startFrequencyRank}${scriptDirectives}

Ensure:
1. Every card has an accurate, realistic Frequency Rank in the target language (e.g. Rank 1 = most frequent word, Rank 2, etc. or ordered within this frequency tier).
2. Balance high-utility action verbs, essential nouns, and crucial grammar patterns / sentence connectors.
3. Rich definitions, phonetic guides (IPA/Pinyin/Romaji where applicable), part of speech, usage rules, and 2 contextual example sentences with translations.
4. All content is strictly accurate, natural, and idiomatic.`;
}

export function getDeckGenerationUserPrompt(options: DeckGenerationPromptOptions): string {
  const { targetLanguage, knownLanguage, topic = "General Core Frequency", startFrequencyRank = 1, count = 15, level = "Beginner (A1/A2)" } = options;

  return `Generate ${count} frequency-ranked flashcards for learning ${targetLanguage} from ${knownLanguage}.
Topic: ${topic}
Level: ${level}
Start Frequency Rank: ${startFrequencyRank}`;
}

export interface CalibratedDeckPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  cefrLevel?: string;
  assessedLevel?: string;
  recommendedStartingRank?: number;
  identifiedErrors?: Array<{ originalMistake: string; correctedForm: string; explanation?: string }>;
  suggestedFocusAreas?: string[];
  cardCount?: number;
}

export function getCalibratedDeckSystemInstruction(options: CalibratedDeckPromptOptions): string {
  const { targetLanguage, knownLanguage, cefrLevel = "B1", assessedLevel = cefrLevel, recommendedStartingRank = 1, cardCount = 15, identifiedErrors = [] } = options;

  return `You are an elite language curriculum architect.
Generate a custom-calibrated spaced repetition deck for learning ${targetLanguage} (for ${knownLanguage} speakers).
Diagnosed Level: ${assessedLevel}
Starting Frequency Rank: #${recommendedStartingRank}
Card Count: ${cardCount}
Learner Test Slips / Errors to Remedy: ${JSON.stringify(identifiedErrors.slice(0, 5))}

Requirements:
1. Generate ${Math.max(8, cardCount - identifiedErrors.length)} frequency-ranked cards appropriate for CEFR ${assessedLevel}, starting from frequency rank #${recommendedStartingRank}. Skip basic words already mastered.
2. For each identified error, generate a dedicated "common_error" remedy flashcard with:
   - type: "common_error"
   - isCommonError: true
   - originalMistake: the mistake pattern
   - correctedForm: the proper natural construction
   - targetItem: the corrected key word or pattern
   - usageNotes: concise mnemonic explaining the exact grammatical pitfall and remedy
   - frequencyRank: 0
3. Return a cohesive, structured deck with deckTitle, deckDescription, and the full card array.`;
}

export function getCalibratedDeckUserPrompt(options: CalibratedDeckPromptOptions): string {
  const { targetLanguage, knownLanguage, cefrLevel = "B1", assessedLevel = cefrLevel, recommendedStartingRank = 1, identifiedErrors = [], suggestedFocusAreas = [] } = options;

  const focusStr = suggestedFocusAreas.length > 0 ? `Focus areas: ${suggestedFocusAreas.join(", ")}.` : "";
  const errorsStr = identifiedErrors.length > 0 ? `Include remedy cards for test slips: ${identifiedErrors.map((e) => `"${e.originalMistake}" -> "${e.correctedForm}"`).join("; ")}.` : "";

  return `Generate a calibrated flashcard deck for ${targetLanguage} (native ${knownLanguage}) at CEFR Level ${assessedLevel}.
Starting rank: #${recommendedStartingRank}.
${focusStr}
${errorsStr}`;
}
