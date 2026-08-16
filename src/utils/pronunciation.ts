/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PronunciationOption {
  id: string;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
}

export const PRONUNCIATION_OPTIONS_MAP: Record<string, PronunciationOption[]> = {
  // Traditional Chinese (Taiwan standard)
  "zh-TW": [
    {
      id: "zhuyin",
      label: "Zhuyin / Bopomofo (注音符號 ㄅㄆㄇㄈ)",
      shortLabel: "注音 (Zhuyin)",
      badge: "注音",
      description: "Traditional Taiwanese phonetic symbols (ㄅㄆㄇㄈ)",
    },
    {
      id: "pinyin",
      label: "Hanyu Pinyin (漢語拼音 / nǐ hǎo)",
      shortLabel: "拼音 (Pinyin)",
      badge: "拼音",
      description: "Latin alphabet tone marks (ā, á, ǎ, à)",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None (無)",
      badge: "Off",
      description: "Do not show pronunciation or romanization aids",
    },
  ],

  // Japanese
  ja: [
    {
      id: "furigana",
      label: "Furigana / Hiragana (ふりがな)",
      shortLabel: "かな (Kana)",
      badge: "かな",
      description: "Japanese syllabic script (Hiragana reading aid)",
    },
    {
      id: "romaji",
      label: "Romaji (Hepburn Latin / rōmaji)",
      shortLabel: "Romaji",
      badge: "Romaji",
      description: "Latin transcription of Japanese sounds",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None",
      badge: "Off",
      description: "Do not show pronunciation or romanization aids",
    },
  ],

  // Korean
  ko: [
    {
      id: "rr",
      label: "Revised Romanization (RR / hanguk-eo)",
      shortLabel: "Romanization",
      badge: "RR",
      description: "Official South Korean Latin romanization",
    },
    {
      id: "ipa",
      label: "IPA Phonetic (/haːn.ɡuɡ.ʌ/)",
      shortLabel: "IPA",
      badge: "IPA",
      description: "International Phonetic Alphabet representation",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None",
      badge: "Off",
      description: "Do not show pronunciation or romanization aids",
    },
  ],

  // Spanish
  es: [
    {
      id: "ipa",
      label: "IPA Phonetic (/esˈpaɲol/)",
      shortLabel: "IPA",
      badge: "IPA",
      description: "Standard Spanish International Phonetic Alphabet",
    },
    {
      id: "syllable",
      label: "Stress / Syllable Guide (es-PAH-nyol)",
      shortLabel: "Phonics",
      badge: "Phonics",
      description: "Capitalized syllable stress and phonetic approximations",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None",
      badge: "Off",
      description: "Do not show pronunciation or romanization aids",
    },
  ],

  // Taiwanese Hokkien
  nan: [
    {
      id: "tailo",
      label: "Tâi-lô Romanization (臺羅拼音)",
      shortLabel: "Tâi-lô (臺羅)",
      badge: "臺羅",
      description: "Ministry of Education Taiwanese Romanization System",
    },
    {
      id: "pehoeji",
      label: "POJ Romanization (白話字 / Pe̍h-ōe-jī)",
      shortLabel: "POJ (白話字)",
      badge: "POJ",
      description: "Historical Church Romanization with superscripts",
    },
    {
      id: "zhuyin_taiwanese",
      label: "Taiwanese Zhuyin (方音符號 / ㄅㄧㄢ)",
      shortLabel: "方音 (Zhuyin)",
      badge: "方音",
      description: "Taiwanese Extended Bopomofo phonetic symbols",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None",
      badge: "Off",
      description: "Do not show pronunciation or romanization aids",
    },
  ],

  // English
  en: [
    {
      id: "ipa",
      label: "IPA Phonetic (/ˈɪŋɡlɪʃ/)",
      shortLabel: "IPA",
      badge: "IPA",
      description: "International Phonetic Alphabet transcription",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None",
      badge: "Off",
      description: "Do not show pronunciation aid",
    },
  ],
};

const DEFAULT_GENERIC_OPTIONS: PronunciationOption[] = [
  {
    id: "phonetic",
    label: "Phonetic / Romanization Guide",
    shortLabel: "Phonetic",
    badge: "Phonetic",
    description: "Standard pronunciation guide",
  },
  {
    id: "ipa",
    label: "IPA Phonetic",
    shortLabel: "IPA",
    badge: "IPA",
    description: "International Phonetic Alphabet",
  },
  {
    id: "none",
    label: "None (Hide pronunciation aid)",
    shortLabel: "None",
    badge: "Off",
    description: "Do not show pronunciation aid",
  },
];

export function getPronunciationOptions(langCode: string): PronunciationOption[] {
  const normalized = (langCode || "").toLowerCase();
  if (normalized === "zh-tw" || normalized === "zh" || normalized === "cmn") {
    return PRONUNCIATION_OPTIONS_MAP["zh-TW"];
  }
  return PRONUNCIATION_OPTIONS_MAP[normalized] || DEFAULT_GENERIC_OPTIONS;
}

export function getDefaultPronunciationOption(langCode: string): string {
  const options = getPronunciationOptions(langCode);
  // Default to zhuyin for traditional chinese, furigana for japanese, rr for korean, ipa for spanish
  return options[0]?.id || "none";
}

const STORAGE_KEY_PREFIX = "pronunciation_aid_pref_";

export function loadSavedPronunciationAid(langCode: string): string {
  if (typeof window === "undefined") return getDefaultPronunciationOption(langCode);
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${langCode}`);
    if (saved) {
      const options = getPronunciationOptions(langCode);
      if (options.some((o) => o.id === saved)) {
        return saved;
      }
    }
  } catch (e) {
    console.warn("Could not load pronunciation preference:", e);
  }
  return getDefaultPronunciationOption(langCode);
}

export function savePronunciationAid(langCode: string, aidId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${langCode}`, aidId);
  } catch (e) {
    console.warn("Could not save pronunciation preference:", e);
  }
}

// ----------------------------------------------------------------------
// High-Precision Pinyin <-> Zhuyin (Bopomofo) Engine
// ----------------------------------------------------------------------

const PINYIN_TONE_MAP: Record<string, { base: string; tone: number }> = {
  ā: { base: "a", tone: 1 },
  á: { base: "a", tone: 2 },
  ǎ: { base: "a", tone: 3 },
  à: { base: "a", tone: 4 },
  ē: { base: "e", tone: 1 },
  é: { base: "e", tone: 2 },
  ě: { base: "e", tone: 3 },
  è: { base: "e", tone: 4 },
  ī: { base: "i", tone: 1 },
  í: { base: "i", tone: 2 },
  ǐ: { base: "i", tone: 3 },
  ì: { base: "i", tone: 4 },
  ō: { base: "o", tone: 1 },
  ó: { base: "o", tone: 2 },
  ǒ: { base: "o", tone: 3 },
  ò: { base: "o", tone: 4 },
  ū: { base: "u", tone: 1 },
  ú: { base: "u", tone: 2 },
  ǔ: { base: "u", tone: 3 },
  ù: { base: "u", tone: 4 },
  ǖ: { base: "v", tone: 1 },
  ǘ: { base: "v", tone: 2 },
  ǚ: { base: "v", tone: 3 },
  ǜ: { base: "v", tone: 4 },
  ü: { base: "v", tone: 5 },
};

const ZHUYIN_INITIALS: [string, string][] = [
  ["zh", "ㄓ"],
  ["ch", "ㄔ"],
  ["sh", "ㄕ"],
  ["b", "ㄅ"],
  ["p", "ㄆ"],
  ["m", "ㄇ"],
  ["f", "ㄈ"],
  ["d", "ㄉ"],
  ["t", "ㄊ"],
  ["n", "ㄋ"],
  ["l", "ㄌ"],
  ["g", "ㄍ"],
  ["k", "ㄎ"],
  ["h", "ㄏ"],
  ["j", "ㄐ"],
  ["q", "ㄑ"],
  ["x", "ㄒ"],
  ["r", "ㄖ"],
  ["z", "ㄗ"],
  ["c", "ㄘ"],
  ["s", "ㄙ"],
];

const ZHUYIN_FINALS: Record<string, string> = {
  iang: "ㄧㄤ",
  iong: "ㄩㄥ",
  uang: "ㄨㄤ",
  ueng: "ㄨㄥ",
  ang: "ㄤ",
  eng: "ㄥ",
  ong: "ㄨㄥ",
  iao: "ㄧㄠ",
  ian: "ㄧㄢ",
  ing: "ㄧㄥ",
  uai: "ㄨㄞ",
  uan: "ㄨㄢ",
  van: "ㄩㄢ",
  uan_v: "ㄩㄢ",
  ai: "ㄞ",
  ei: "ㄟ",
  ao: "ㄠ",
  ou: "ㄡ",
  an: "ㄢ",
  en: "ㄣ",
  er: "ㄦ",
  ia: "ㄧㄚ",
  ie: "ㄧㄝ",
  iu: "ㄧㄡ",
  in: "ㄧㄣ",
  ua: "ㄨㄚ",
  uo: "ㄨㄛ",
  ui: "ㄨㄟ",
  un: "ㄨㄣ",
  ve: "ㄩㄝ",
  vn: "ㄩㄣ",
  a: "ㄚ",
  o: "ㄛ",
  e: "ㄜ",
  ê: "ㄝ",
  i: "ㄧ",
  u: "ㄨ",
  v: "ㄩ",
};

const ZHUYIN_TONE_SYMBOLS: Record<number, string> = {
  1: "", // Tone 1 is unmarked in Zhuyin
  2: "ˊ",
  3: "ˇ",
  4: "ˋ",
  5: "˙", // Neutral tone (often preceding or trailing)
};

/**
 * Converts a single lowercase pinyin syllable without tone marks into Zhuyin
 */
function convertPinyinSyllableToZhuyin(syllable: string, tone: number): string {
  let s = syllable.toLowerCase().trim();
  if (!s) return "";

  // Handle standard standalone syllables
  if (s === "er") return `ㄦ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "zhi") return `ㄓ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "chi") return `ㄔ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "shi") return `ㄕ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "ri") return `ㄖ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "zi") return `ㄗ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "ci") return `ㄘ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "si") return `ㄙ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;

  if (s === "yi") return `ㄧ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "wu") return `ㄨ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yu") return `ㄩ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;

  if (s === "yin") return `ㄧㄣ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "ying") return `ㄧㄥ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yong") return `ㄩㄥ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yue") return `ㄩㄝ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yuan") return `ㄩㄢ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yun") return `ㄩㄣ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;

  // Y- transformations
  if (s.startsWith("y")) {
    const rem = s.slice(1);
    if (rem === "a") return `ㄧㄚ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "e") return `ㄧㄝ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "ao") return `ㄧㄠ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "ou") return `ㄧㄡ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "an") return `ㄧㄢ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "ang") return `ㄧㄤ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  }

  // W- transformations
  if (s.startsWith("w")) {
    const rem = s.slice(1);
    if (rem === "a") return `ㄨㄚ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "o") return `ㄨㄛ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "ai") return `ㄨㄞ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "ei") return `ㄨㄟ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "an") return `ㄨㄢ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "en") return `ㄨㄣ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "ang") return `ㄨㄤ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
    if (rem === "eng") return `ㄨㄥ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  }

  // Find initial
  let initial = "";
  let zhuyinInit = "";
  for (const [pInit, zInit] of ZHUYIN_INITIALS) {
    if (s.startsWith(pInit)) {
      initial = pInit;
      zhuyinInit = zInit;
      break;
    }
  }

  let final = initial ? s.slice(initial.length) : s;

  // j, q, x with u is actually ü (v)
  if (["j", "q", "x"].includes(initial)) {
    if (final === "u") final = "v";
    if (final === "ue") final = "ve";
    if (final === "uan") final = "van";
    if (final === "un") final = "vn";
  }

  let zhuyinFinal = ZHUYIN_FINALS[final] || final;
  const toneMark = ZHUYIN_TONE_SYMBOLS[tone] || "";

  if (tone === 5) {
    // Neutral tone in Zhuyin can be represented with leading or trailing dot
    return `˙${zhuyinInit}${zhuyinFinal}`;
  }

  return `${zhuyinInit}${zhuyinFinal}${toneMark}`;
}

/**
 * Converts a pinyin word or sentence into Zhuyin (Bopomofo)
 */
export function pinyinToZhuyin(input: string): string {
  if (!input) return "";

  // If already pure zhuyin, return as is
  if (/[\u3100-\u312F\u31A0-\u31BF]/.test(input) && !/[a-zA-Z]/.test(input)) {
    return input.trim();
  }

  // Tokenize words/syllables
  return input
    .split(/([ \t\n,./!?;:()\[\]"“”'’/—~-]+)/)
    .map((token) => {
      if (!token || /^([ \t\n,./!?;:()\[\]"“”'’/—~-]+)$/.test(token)) {
        return token;
      }

      // Check for numbered pinyin (e.g. ni3 hao3 or hao3)
      const numMatch = token.match(/^([a-zA-ZüÜvV]+)([1-5])$/);
      if (numMatch) {
        return convertPinyinSyllableToZhuyin(numMatch[1], parseInt(numMatch[2], 10));
      }

      // Check tone marks in token
      let tone = 5;
      let rawChars = "";
      for (const ch of token) {
        if (PINYIN_TONE_MAP[ch]) {
          tone = PINYIN_TONE_MAP[ch].tone;
          rawChars += PINYIN_TONE_MAP[ch].base;
        } else {
          rawChars += ch;
        }
      }

      if (/^[a-zA-ZüÜvV]+$/.test(rawChars)) {
        return convertPinyinSyllableToZhuyin(rawChars, tone);
      }

      return token;
    })
    .join("");
}

/**
 * Extracts and cleans the pronunciation string according to the selected mode
 */
export function formatPronunciation(
  targetItem: string,
  rawPhonetic: string | undefined,
  langCode: string,
  aidMode: string
): string | null {
  if (aidMode === "none" || !aidMode) {
    return null;
  }

  const normalizedLang = (langCode || "").toLowerCase();

  // Traditional Chinese handling (Pinyin vs Zhuyin)
  if (normalizedLang === "zh-tw" || normalizedLang === "zh" || normalizedLang === "cmn") {
    const raw = (rawPhonetic || "").trim();

    // Check if raw contains both zhuyin and pinyin (e.g. "ㄕˋ / shì")
    const parts = raw.split(/[\/|]/).map((s) => s.trim());
    const zhuyinPart = parts.find((p) => /[\u3100-\u312F\u31A0-\u31BF]/.test(p));
    const pinyinPart = parts.find((p) => /[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p));

    if (aidMode === "zhuyin") {
      if (zhuyinPart) return zhuyinPart;
      if (pinyinPart) return pinyinToZhuyin(pinyinPart);
      if (raw) return pinyinToZhuyin(raw);

      // Check if target item has embedded pinyin like "是 (shì)"
      const bracketMatch = targetItem.match(/\(([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+)\)/);
      if (bracketMatch) {
        return pinyinToZhuyin(bracketMatch[1]);
      }
      return null;
    }

    if (aidMode === "pinyin") {
      if (pinyinPart) return pinyinPart;
      if (raw && !/[\u3100-\u312F]/.test(raw)) return raw;

      // Extract from targetItem if available e.g. "是 (shì)"
      const bracketMatch = targetItem.match(/\(([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+)\)/);
      if (bracketMatch) {
        return bracketMatch[1];
      }
      if (raw) return raw; // Fallback
      return null;
    }
  }

  // Japanese handling (Kana vs Romaji)
  if (normalizedLang === "ja") {
    const raw = (rawPhonetic || "").trim();
    if (!raw) return null;

    if (aidMode === "furigana") {
      // If contains hiragana/katakana
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(raw)) {
        return raw;
      }
    }
    return raw;
  }

  // Korean handling
  if (normalizedLang === "ko") {
    const raw = (rawPhonetic || "").trim();
    if (!raw) return null;
    return raw;
  }

  // Spanish and other languages
  const raw = (rawPhonetic || "").trim();
  return raw || null;
}
