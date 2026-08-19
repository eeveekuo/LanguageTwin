/**
 * Bidirectional Token and Phrase Alignment for Parallel Translations
 */

export interface Token {
  id: string;
  text: string;
  isPunctuation: boolean;
  cleanText: string;
  alignedIds: string[]; // IDs of aligned tokens in the other language
}

export interface AlignedSentencePair {
  targetTokens: Token[];
  translationTokens: Token[];
}

// CJK character check
export function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
    (code >= 0x3040 && code <= 0x309f) || // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) || // Katakana
    (code >= 0xac00 && code <= 0xd7af)    // Hangul Syllables
  );
}

// Common punctuation characters
const PUNCTUATION_REGEX = /^[.,!?;:()[\]{}"'`«»—–\-·。，！？；：「」『』（）…]+$/;

/**
 * Tokenize a sentence based on language characteristics
 */
export function tokenizeSentence(text: string, langCode: string, idPrefix: string): Token[] {
  if (!text || typeof text !== "string") return [];

  const isTargetCJK = ["zh-TW", "zh", "ja", "ko", "nan"].includes(langCode) || 
    Array.from(text).some(isCJK);

  const tokens: Token[] = [];

  if (isTargetCJK && !["ko"].includes(langCode)) {
    // For Chinese / Japanese, split into individual characters or 2-char compounds when surrounded by spaces
    // First, split by space/punctuation boundaries while preserving characters
    let currentId = 0;
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      if (char === " ") {
        i++;
        continue;
      }
      
      const isPunct = PUNCTUATION_REGEX.test(char);
      if (isPunct) {
        tokens.push({
          id: `${idPrefix}-${currentId++}`,
          text: char,
          isPunctuation: true,
          cleanText: char,
          alignedIds: [],
        });
        i++;
        continue;
      }

      // Check if next char forms a common compound (or simply character-level tokens)
      tokens.push({
        id: `${idPrefix}-${currentId++}`,
        text: char,
        isPunctuation: false,
        cleanText: char,
        alignedIds: [],
      });
      i++;
    }
  } else {
    // Space-separated languages (English, Spanish, French, German, Korean, etc.)
    const rawWords = text.split(/(\s+|[.,!?;:()[\]{}"'`«»—–\-·。，！？；：「」『』（）…])/).filter(Boolean);
    let currentId = 0;

    for (const segment of rawWords) {
      if (/^\s+$/.test(segment)) {
        continue; // Skip pure whitespace
      }
      const isPunct = PUNCTUATION_REGEX.test(segment);
      tokens.push({
        id: `${idPrefix}-${currentId++}`,
        text: segment,
        isPunctuation: isPunct,
        cleanText: segment.replace(PUNCTUATION_REGEX, "").trim().toLowerCase(),
        alignedIds: [],
      });
    }
  }

  return tokens;
}

/**
 * Build bidirectional alignment mappings between target tokens and translation tokens
 */
export function buildTokenAlignment(
  targetTokens: Token[],
  translationTokens: Token[]
): { targetTokens: Token[]; translationTokens: Token[] } {
  const meaningfulTarget = targetTokens.filter((t) => !t.isPunctuation);
  const meaningfulTranslation = translationTokens.filter((t) => !t.isPunctuation);

  if (meaningfulTarget.length === 0 || meaningfulTranslation.length === 0) {
    return { targetTokens, translationTokens };
  }

  // Create alignment ratio mapping:
  // Maps relative position in source sentence to corresponding relative position in translation
  const targetMap: Record<string, string[]> = {};
  const translationMap: Record<string, string[]> = {};

  meaningfulTarget.forEach((tToken, tIdx) => {
    const tRatio = tIdx / Math.max(1, meaningfulTarget.length - 1);
    
    // Find closest translation token(s)
    const exactMatch = meaningfulTranslation.find(
      (trToken) => trToken.cleanText && trToken.cleanText === tToken.cleanText
    );

    if (exactMatch) {
      targetMap[tToken.id] = [exactMatch.id];
      if (!translationMap[exactMatch.id]) translationMap[exactMatch.id] = [];
      translationMap[exactMatch.id].push(tToken.id);
    } else {
      // Proportional span mapping (supports n-to-m mapping for multi-word phrases)
      const mappedTransIdx = Math.round(tRatio * (meaningfulTranslation.length - 1));
      const primaryTransToken = meaningfulTranslation[mappedTransIdx];

      if (primaryTransToken) {
        if (!targetMap[tToken.id]) targetMap[tToken.id] = [];
        targetMap[tToken.id].push(primaryTransToken.id);

        if (!translationMap[primaryTransToken.id]) translationMap[primaryTransToken.id] = [];
        translationMap[primaryTransToken.id].push(tToken.id);
      }
    }
  });

  // Assign computed IDs
  targetTokens.forEach((t) => {
    t.alignedIds = targetMap[t.id] || [];
  });

  translationTokens.forEach((tr) => {
    tr.alignedIds = translationMap[tr.id] || [];
  });

  return { targetTokens, translationTokens };
}

// In-memory cache for aligned sentence pairs
const alignmentCache = new Map<string, AlignedSentencePair>();

export function getAlignedSentencePair(
  targetText: string,
  translationText: string,
  targetLangCode: string,
  idSeed: string
): AlignedSentencePair {
  const cacheKey = `${targetLangCode}:::${targetText}:::${translationText}`;
  if (alignmentCache.has(cacheKey)) {
    return alignmentCache.get(cacheKey)!;
  }

  const rawTargetTokens = tokenizeSentence(targetText, targetLangCode, `tgt-${idSeed}`);
  const rawTranslationTokens = tokenizeSentence(translationText, "en", `tra-${idSeed}`);

  const aligned = buildTokenAlignment(rawTargetTokens, rawTranslationTokens);
  alignmentCache.set(cacheKey, aligned);
  return aligned;
}
