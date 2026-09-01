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
SPECIAL SCRIPT & GRAMMAR REQUIREMENT FOR JAPANESE:
- Provide Kanji with Kana in the target item and accurate Romaji / Hiragana pronunciation in the phonetic field.
- Strictly adhere to Japanese SOV word order (Topic は, Subject が, Object を, Time/Place に/で, Verb concluding the sentence).`;
  } else if (isKorean) {
    scriptDirectives = `
CRITICAL GRAMMAR & SCRIPT RULES FOR KOREAN:
1. WORD ORDER (SOV): Korean is strictly Subject-Object-Verb. The conjugated predicate (verb/adjective) MUST ALWAYS anchor the clause or sentence at the very end. NEVER use Chinese or English SVO structures.
2. POSTPOSITIONAL PARTICLES (조사): Attach correct Korean particles directly to preceding nouns without spaces:
   - Topic: -은 (after consonant/batchim) / -는 (after vowel)
   - Subject: -이 (after consonant/batchim) / -가 (after vowel)
   - Object: -을 (after consonant/batchim) / -를 (after vowel)
   - Time & Destination / Static Location: -에 (e.g., 8시에, 서울에 가요, 방에 있어요)
   - Dynamic Action Location: -에서 (e.g., 카페에서 커피를 마셔요, 도서관에서 공부해요)
   - Means / Direction / Instrument: -(으)로 (e.g., 버스로, 한국어로)
   - Comitative / With: -와/과, -(이)랑, -하고 (e.g., 친구와 함께)
3. SPEECH LEVEL & CONJUGATION: All example sentences must be fully conjugated in natural standard polite Korean (Informal Polite 해요체: -아요/어요/해요, or Formal Polite 하십시오체: -(스)ㅂ니다). NEVER output raw unconjugated dictionary citation forms (-다) as standalone sentences.
4. SCRIPT & PHONETICS: Write purely in authentic modern Hangul (한글) for all target items, definitions, and sentences. In the 'phonetic' field, provide accurate Revised Romanization.
5. NO CHINESE PATTERNS: Do NOT use Chinese characters (漢字), Chinese grammatical aspect markers (了, 著, 過), Chinese preverbal time/location SVO patterns, or Chinese measure words in Korean sentences.`;
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
  const { targetLanguage, knownLanguage, cefrLevel = "B1", assessedLevel = cefrLevel, recommendedStartingRank = 1, cardCount = 300, identifiedErrors = [] } = options;

  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어");
  const isTraditionalChinese =
    (targetLanguage || "").toLowerCase().includes("traditional") ||
    (targetLanguage || "").toLowerCase().includes("繁體") ||
    (targetLanguage || "").toLowerCase().includes("zh-tw");

  let languageDirectives = "";
  if (isKorean) {
    languageDirectives = `
KOREAN GRAMMATICAL RULES:
- Word Order: Strictly Subject-Object-Verb (SOV) with verb/adjective concluding the sentence.
- Particles: Accurate attachable particles (-은/는 Topic, -이/가 Subject, -을/를 Object, -에/에서 Location/Time, -(으)로 Direction/Means).
- Conjugation: Conjugate all example sentences in natural polite forms (해요체: -아요/어요/해요, or 하십시오체: -(스)ㅂ니다).
- Script: Pure standard modern Hangul (한글). No Chinese characters. Accurate Revised Romanization in phonetic fields.`;
  } else if (isTraditionalChinese) {
    languageDirectives = `
TRADITIONAL CHINESE SCRIPT RULES:
- Strictly write in Traditional Chinese characters (繁體字 / 正體字). Provide tone-marked Pinyin/Zhuyin in phonetic fields.`;
  }

  return `You are an elite language curriculum architect.
Generate a custom-calibrated spaced repetition deck for learning ${targetLanguage} (for ${knownLanguage} speakers).
Diagnosed Level: ${assessedLevel}
Starting Frequency Rank: #${recommendedStartingRank}
Card Count: ${cardCount}
Learner Test Slips / Errors to Remedy: ${JSON.stringify(identifiedErrors.slice(0, 5))}${languageDirectives}

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
