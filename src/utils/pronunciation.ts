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

  // French
  fr: [
    {
      id: "ipa",
      label: "IPA Phonetic (/fʁɑ̃.sɛ/)",
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

  // German
  de: [
    {
      id: "ipa",
      label: "IPA Phonetic (/dɔɪ̯tʃ/)",
      shortLabel: "IPA",
      badge: "IPA",
      description: "Standard German IPA phonetic transcription",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None",
      badge: "Off",
      description: "Do not show pronunciation aid",
    },
  ],

  // Italian
  it: [
    {
      id: "ipa",
      label: "IPA Phonetic (/itaˈljaːno/)",
      shortLabel: "IPA",
      badge: "IPA",
      description: "Standard Italian IPA phonetic transcription",
    },
    {
      id: "none",
      label: "None (Hide pronunciation aid)",
      shortLabel: "None",
      badge: "Off",
      description: "Do not show pronunciation aid",
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
// High-Precision Multi-Syllable Pinyin <-> Zhuyin (Bopomofo) Engine
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
  5: "˙", // Neutral tone (placed as dot before symbol in Taiwan Zhuyin)
};

// Canonical set of valid Mandarin Pinyin base syllables
const VALID_PINYIN_SYLLABLES: Set<string> = new Set([
  "a", "ai", "an", "ang", "ao",
  "ba", "bai", "ban", "bang", "bao", "bei", "ben", "beng", "bi", "bian", "biao", "bie", "bin", "bing", "bo", "bu",
  "ca", "cai", "can", "cang", "cao", "ce", "cen", "ceng", "cha", "chai", "chan", "chang", "chao", "che", "chen", "cheng", "chi", "chong", "chou", "chu", "chua", "chuai", "chuan", "chuang", "chui", "chun", "chuo", "ci", "cong", "cou", "cu", "cuan", "cui", "cun", "cuo",
  "da", "dai", "dan", "dang", "dao", "de", "dei", "den", "deng", "di", "dia", "dian", "diao", "die", "ding", "diu", "dong", "dou", "du", "duan", "dui", "dun", "duo",
  "e", "ei", "en", "eng", "er",
  "fa", "fan", "fang", "fei", "fen", "feng", "fo", "fou", "fu",
  "ga", "gai", "gan", "gang", "gao", "ge", "gei", "gen", "geng", "gong", "gou", "gu", "gua", "guai", "guan", "guang", "gui", "gun", "guo",
  "ha", "hai", "han", "hang", "hao", "he", "hei", "hen", "heng", "hong", "hou", "hu", "hua", "huai", "huan", "huang", "hui", "hun", "huo",
  "ji", "jia", "jian", "jiang", "jiao", "jie", "jin", "jing", "jiong", "jiu", "ju", "juan", "jue", "jun",
  "ka", "kai", "kan", "kang", "kao", "ke", "kei", "ken", "keng", "kong", "kou", "ku", "kua", "kuai", "kuan", "kuang", "kui", "kun", "kuo",
  "la", "lai", "lan", "lang", "lao", "le", "lei", "leng", "li", "lia", "lian", "liang", "liao", "lie", "lin", "ling", "liu", "lo", "long", "lou", "lu", "luan", "lun", "luo", "lv", "lue", "lü", "lüe",
  "ma", "mai", "man", "mang", "mao", "me", "mei", "men", "meng", "mi", "mian", "miao", "mie", "min", "ming", "miu", "mo", "mou", "mu",
  "na", "nai", "nan", "nang", "nao", "ne", "nei", "nen", "neng", "ni", "nian", "niang", "niao", "nie", "nin", "ning", "niu", "nong", "nou", "nu", "nuan", "nun", "nuo", "nv", "nue", "nü", "nüe",
  "o", "ou",
  "pa", "pai", "pan", "pang", "pao", "pei", "pen", "peng", "pi", "pian", "piao", "pie", "pin", "ping", "po", "pou", "pu",
  "qi", "qia", "qian", "qiang", "qiao", "qie", "qin", "qing", "qiong", "qiu", "qu", "quan", "que", "qun",
  "ran", "rang", "rao", "re", "ren", "reng", "ri", "rong", "rou", "ru", "rua", "ruan", "rui", "run", "ruo",
  "sa", "sai", "san", "sang", "sao", "se", "sen", "seng", "sha", "shai", "shan", "shang", "shao", "she", "shei", "shen", "sheng", "shi", "shou", "shu", "shua", "shuai", "shuan", "shuang", "shui", "shun", "shuo", "si", "song", "sou", "su", "suan", "sui", "sun", "suo",
  "ta", "tai", "tan", "tang", "tao", "te", "teng", "ti", "tian", "tiao", "tie", "ting", "tong", "tou", "tu", "tuan", "tui", "tun", "tuo",
  "wa", "wai", "wan", "wang", "wei", "wen", "weng", "wo", "wu",
  "xi", "xia", "xian", "xiang", "xiao", "xie", "xin", "xing", "xiong", "xiu", "xu", "xuan", "xue", "xun",
  "ya", "yan", "yang", "yao", "ye", "yi", "yin", "ying", "yong", "you", "yu", "yuan", "yue", "yun",
  "za", "zai", "zan", "zang", "zao", "ze", "zei", "zen", "zeng", "zha", "zhai", "zhan", "zhang", "zhao", "zhe", "zhei", "zhen", "zheng", "zhi", "zhong", "zhou", "zhu", "zhua", "zhuai", "zhuan", "zhuang", "zhui", "zhun", "zhuo", "zi", "zong", "zou", "zu", "zuan", "zui", "zun", "zuo"
]);

/**
 * Converts a single lowercase pinyin syllable without tone marks into Zhuyin
 */
export function convertPinyinSyllableToZhuyin(syllable: string, tone: number = 5): string {
  let s = syllable.toLowerCase().trim();
  if (!s) return "";

  // Replace v/ü representations
  if (s.includes("ü")) s = s.replace(/ü/g, "v");
  if (s.includes("u:") || s.includes("u\"")) s = s.replace(/u[:"]/g, "v");

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
  if (s === "yu" || s === "yv") return `ㄩ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;

  if (s === "yin") return `ㄧㄣ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "ying") return `ㄧㄥ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yong") return `ㄩㄥ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yue" || s === "yve") return `ㄩㄝ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yuan" || s === "yvan") return `ㄩㄢ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;
  if (s === "yun" || s === "yvn") return `ㄩㄣ${ZHUYIN_TONE_SYMBOLS[tone] || ""}`;

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

  let zhuyinFinal = ZHUYIN_FINALS[final] || "";
  if (!zhuyinFinal && final) {
    zhuyinFinal = final; // Fallback
  }

  const toneMark = ZHUYIN_TONE_SYMBOLS[tone] || "";

  if (tone === 5) {
    // Neutral tone in Taiwan Zhuyin
    return `˙${zhuyinInit}${zhuyinFinal}`;
  }

  return `${zhuyinInit}${zhuyinFinal}${toneMark}`;
}

/**
 * Segment a continuous string of letters (e.g. "xuesheng", "xue2sheng1", "shouji") into syllables with tones
 */
export function segmentPinyinWord(word: string): Array<{ syllable: string; tone: number }> {
  const result: Array<{ syllable: string; tone: number }> = [];
  if (!word) return result;

  let pos = 0;
  const len = word.length;

  while (pos < len) {
    let bestMatch = "";
    let bestTone = 5;
    let matchedLength = 0;

    // Try finding the longest valid syllable starting at pos (syllable length typically 1 to 6 chars)
    for (let end = Math.min(len, pos + 7); end > pos; end--) {
      const candidateRaw = word.slice(pos, end);

      // Extract diacritics / tones from candidate
      let extractedTone = 5;
      let cleanedCandidate = "";
      for (const ch of candidateRaw) {
        if (PINYIN_TONE_MAP[ch]) {
          extractedTone = PINYIN_TONE_MAP[ch].tone;
          cleanedCandidate += PINYIN_TONE_MAP[ch].base;
        } else {
          cleanedCandidate += ch.toLowerCase();
        }
      }

      // Check trailing number tone (e.g. "xue2")
      const numMatch = cleanedCandidate.match(/^([a-z]+)([1-5])$/);
      if (numMatch) {
        if (VALID_PINYIN_SYLLABLES.has(numMatch[1])) {
          bestMatch = numMatch[1];
          bestTone = parseInt(numMatch[2], 10);
          matchedLength = candidateRaw.length;
          break;
        }
      }

      if (VALID_PINYIN_SYLLABLES.has(cleanedCandidate)) {
        bestMatch = cleanedCandidate;
        bestTone = extractedTone;
        matchedLength = candidateRaw.length;
        break;
      }
    }

    if (bestMatch && matchedLength > 0) {
      result.push({ syllable: bestMatch, tone: bestTone });
      pos += matchedLength;
    } else {
      // Advance by 1 char if no standard syllable matched
      const ch = word[pos];
      if (/[a-zA-Z]/.test(ch)) {
        result.push({ syllable: ch.toLowerCase(), tone: 5 });
      }
      pos++;
    }
  }

  return result;
}

/**
 * Converts a pinyin word or sentence into Zhuyin (Bopomofo)
 * Properly handles multi-syllable compounds like "xuesheng" -> "ㄒㄩㄝ ㄕㄥ",
 * "xuéshēng" -> "ㄒㄩㄝˊ ㄕㄥ", and mixed corrupted tokens like "ㄒuesheng" -> "ㄒㄩㄝ ㄕㄥ".
 */
export function pinyinToZhuyin(input: string): string {
  if (!input) return "";

  // If input contains partial zhuyin mixed with latin letters (e.g. "ㄒuesheng" or "ㄕˋ, xuesheng")
  // Clean corrupt prefixes like "ㄒuesheng"
  let sanitized = input;
  if (/^[\u3100-\u312F\u31A0-\u31BF]+[a-zA-Z]/.test(sanitized)) {
    sanitized = sanitized.replace(/^[\u3100-\u312F\u31A0-\u31BF]+/, "");
  }

  // If already pure zhuyin symbols, return cleanly
  if (/^[\u3100-\u312F\u31A0-\u31BF\s˙ˊˇˋ-]+$/.test(sanitized.trim())) {
    return sanitized.trim();
  }

  // Split by non-word/delimiter characters
  const parts = sanitized.split(/([ \t\n,./!?;:()\[\]"“”'’/—~-]+)/);

  const convertedTokens = parts.map((token) => {
    if (!token || /^([ \t\n,./!?;:()\[\]"“”'’/—~-]+)$/.test(token)) {
      return token;
    }

    // Check if token is already pure zhuyin
    if (/^[\u3100-\u312F\u31A0-\u31BF˙ˊˇˋ]+$/.test(token)) {
      return token;
    }

    // Segment multi-syllable or single-syllable pinyin word into syllables
    const syllables = segmentPinyinWord(token);
    if (syllables.length > 0) {
      return syllables
        .map((s) => convertPinyinSyllableToZhuyin(s.syllable, s.tone))
        .filter(Boolean)
        .join(" ");
    }

    return token;
  });

  return convertedTokens.join("").replace(/\s{2,}/g, " ").trim();
}

// ----------------------------------------------------------------------
// High-Frequency Chinese Character to Zhuyin/Pinyin Dictionary
// ----------------------------------------------------------------------
const HANZI_PHONETIC_DICT: Record<string, { zhuyin: string; pinyin: string }> = {
  // Common Single Characters & Core Verbs
  "是": { zhuyin: "ㄕˋ", pinyin: "shì" },
  "有": { zhuyin: "ㄧㄡˇ", pinyin: "yǒu" },
  "在": { zhuyin: "ㄗㄞˋ", pinyin: "zài" },
  "把": { zhuyin: "ㄅㄚˇ", pinyin: "bǎ" },
  "和": { zhuyin: "ㄏㄢˋ", pinyin: "hàn" },
  "這": { zhuyin: "ㄓㄜˋ", pinyin: "zhè" },
  "那": { zhuyin: "ㄋㄚˋ", pinyin: "nà" },
  "我": { zhuyin: "ㄨㄛˇ", pinyin: "wǒ" },
  "你": { zhuyin: "ㄋㄧˇ", pinyin: "nǐ" },
  "您": { zhuyin: "ㄋㄧㄣˊ", pinyin: "nín" },
  "他": { zhuyin: "ㄊㄚ", pinyin: "tā" },
  "她": { zhuyin: "ㄊㄚ", pinyin: "tā" },
  "它": { zhuyin: "ㄊㄚ", pinyin: "tā" },
  "的": { zhuyin: "˙ㄉㄜ", pinyin: "de" },
  "得": { zhuyin: "˙ㄉㄜ", pinyin: "de" },
  "地": { zhuyin: "˙ㄉㄜ", pinyin: "de" },
  "了": { zhuyin: "˙ㄌㄜ", pinyin: "le" },
  "嗎": { zhuyin: "˙ㄇㄚ", pinyin: "ma" },
  "呢": { zhuyin: "˙ㄋㄜ", pinyin: "ne" },
  "吧": { zhuyin: "˙ㄅㄚ", pinyin: "ba" },
  "啊": { zhuyin: "˙ㄚ", pinyin: "a" },
  "不": { zhuyin: "ㄅㄨˋ", pinyin: "bù" },
  "沒": { zhuyin: "ㄇㄟˊ", pinyin: "méi" },
  "很": { zhuyin: "ㄏㄣˇ", pinyin: "hěn" },
  "太": { zhuyin: "ㄊㄞˋ", pinyin: "tài" },
  "真": { zhuyin: "ㄓㄣ", pinyin: "zhēn" },
  "多": { zhuyin: "ㄉㄨㄛ", pinyin: "duō" },
  "少": { zhuyin: "ㄕㄠˇ", pinyin: "shǎo" },
  "大": { zhuyin: "ㄉㄚˋ", pinyin: "dà" },
  "小": { zhuyin: "ㄒㄧㄠˇ", pinyin: "xiǎo" },
  "冷": { zhuyin: "ㄌㄥˇ", pinyin: "lěng" },
  "熱": { zhuyin: "ㄖㄜˋ", pinyin: "rè" },
  "好": { zhuyin: "ㄏㄠˇ", pinyin: "hǎo" },
  "想": { zhuyin: "ㄒㄧㄤˇ", pinyin: "xiǎng" },
  "要": { zhuyin: "ㄧㄠˋ", pinyin: "yào" },
  "看": { zhuyin: "ㄎㄢˋ", pinyin: "kàn" },
  "聽": { zhuyin: "ㄊㄧㄥ", pinyin: "tīng" },
  "說": { zhuyin: "ㄕㄨㄛ", pinyin: "shuō" },
  "讀": { zhuyin: "ㄉㄨˊ", pinyin: "dú" },
  "寫": { zhuyin: "ㄒㄧㄝˇ", pinyin: "xiě" },
  "吃": { zhuyin: "ㄔ", pinyin: "chī" },
  "喝": { zhuyin: "ㄏㄜ", pinyin: "hē" },
  "去": { zhuyin: "ㄑㄩˋ", pinyin: "qù" },
  "來": { zhuyin: "ㄌㄞˊ", pinyin: "lái" },
  "回": { zhuyin: "ㄏㄨㄟˊ", pinyin: "huí" },
  "買": { zhuyin: "ㄇㄞˇ", pinyin: "mǎi" },
  "賣": { zhuyin: "ㄇㄞˋ", pinyin: "mài" },
  "做": { zhuyin: "ㄗㄨㄛˋ", pinyin: "zuò" },
  "學": { zhuyin: "ㄒㄩㄝˊ", pinyin: "xué" },
  "給": { zhuyin: "ㄍㄟˇ", pinyin: "gěi" },
  "問": { zhuyin: "ㄨㄣˋ", pinyin: "wèn" },
  "請": { zhuyin: "ㄑㄧㄥˇ", pinyin: "qǐng" },
  "能": { zhuyin: "ㄋㄥˊ", pinyin: "néng" },
  "會": { zhuyin: "ㄏㄨㄟˋ", pinyin: "huì" },
  "開": { zhuyin: "ㄎㄞ", pinyin: "kāi" },
  "關": { zhuyin: "ㄍㄨㄢ", pinyin: "guān" },

  // High-Frequency Compound Words & Phrases
  "學生": { zhuyin: "ㄒㄩㄝˊ ㄕㄥ", pinyin: "xuéshēng" },
  "老師": { zhuyin: "ㄌㄠˇ ㄕ", pinyin: "lǎoshī" },
  "手機": { zhuyin: "ㄕㄡˇ ㄐㄧ", pinyin: "shǒujī" },
  "電話": { zhuyin: "ㄉㄧㄢˋ ㄏㄨㄚˋ", pinyin: "diànhuà" },
  "台灣": { zhuyin: "ㄊㄞˊ ㄨㄢ", pinyin: "Táiwān" },
  "臺灣": { zhuyin: "ㄊㄞˊ ㄨㄢ", pinyin: "Táiwān" },
  "中文": { zhuyin: "ㄓㄨㄥ ㄨㄣˊ", pinyin: "zhōngwén" },
  "英文": { zhuyin: "ㄧㄥ ㄨㄣˊ", pinyin: "yīngwén" },
  "今天": { zhuyin: "ㄐㄧㄣ ㄊㄧㄢ", pinyin: "jīntiān" },
  "明天": { zhuyin: "ㄇㄧㄥˊ ㄊㄧㄢ", pinyin: "míngtiān" },
  "昨天": { zhuyin: "ㄗㄨㄛˊ ㄊㄧㄢ", pinyin: "zuótiān" },
  "作業": { zhuyin: "ㄗㄨㄛˋ ㄧㄝˋ", pinyin: "zuòyè" },
  "功課": { zhuyin: "ㄍㄨㄥ ㄎㄜˋ", pinyin: "gōngkè" },
  "很多": { zhuyin: "ㄏㄣˇ ㄉㄨㄛ", pinyin: "hěn duō" },
  "非常": { zhuyin: "ㄈㄟ ㄔㄤˊ", pinyin: "fēicháng" },
  "喜歡": { zhuyin: "ㄒㄧˇ ㄏㄨㄢ", pinyin: "xǐhuān" },
  "運動": { zhuyin: "ㄩㄣˋ ㄉㄨㄥˋ", pinyin: "yùndòng" },
  "窗戶": { zhuyin: "ㄔㄨㄤ ㄏㄨˋ", pinyin: "chuānghù" },
  "關上": { zhuyin: "ㄍㄨㄢ ㄕㄤˋ", pinyin: "guān shàng" },
  "打開": { zhuyin: "ㄉㄚˇ ㄎㄞ", pinyin: "dǎ kāi" },
  "外面": { zhuyin: "ㄨㄞˋ ㄇㄧㄢˋ", pinyin: "wàimiàn" },
  "裡面": { zhuyin: "ㄌㄧˇ ㄇㄧㄢˋ", pinyin: "lǐmiàn" },
  "天氣": { zhuyin: "ㄊㄧㄢ ㄑㄧˋ", pinyin: "tiānqì" },
  "雖然": { zhuyin: "ㄙㄨㄟ ㄖㄢˊ", pinyin: "suīrán" },
  "但是": { zhuyin: "ㄉㄢˋ ㄕˋ", pinyin: "dànshì" },
  "因為": { zhuyin: "ㄧㄣ ㄨㄟˋ", pinyin: "yīnwèi" },
  "所以": { zhuyin: "ㄙㄨㄛˇ ㄧˇ", pinyin: "suǒyǐ" },
  "如果": { zhuyin: "ㄖㄨˊ ㄍㄨㄛˇ", pinyin: "rúguǒ" },
  "夜市": { zhuyin: "ㄧㄝˋ ㄕˋ", pinyin: "yèshì" },
  "美食": { zhuyin: "ㄇㄟˇ ㄕˊ", pinyin: "měishí" },
  "品嚐": { zhuyin: "ㄆㄧㄣˇ ㄔㄤˊ", pinyin: "pǐncháng" },
  "旅行": { zhuyin: "ㄌㄩˇ ㄒㄧㄥˊ", pinyin: "lǚxíng" },
  "旅遊": { zhuyin: "ㄌㄩˇ ㄧㄡˊ", pinyin: "lǚyóu" },
  "推薦": { zhuyin: "ㄊㄨㄟ ㄐㄧㄢˋ", pinyin: "tuījiàn" },
  "圖書館": { zhuyin: "ㄊㄨˊ ㄕㄨ ㄍㄨㄢˇ", pinyin: "túshūguǎn" },
  "咖啡店": { zhuyin: "ㄎㄚ ㄈㄟ ㄉㄧㄢˋ", pinyin: "kāfēidiàn" },
  "咖啡": { zhuyin: "ㄎㄚ ㄈㄟ", pinyin: "kāfēi" },
  "電影": { zhuyin: "ㄉㄧㄢˋ ㄧㄥˇ", pinyin: "diànyǐng" },
  "看書": { zhuyin: "ㄎㄢˋ ㄕㄨ", pinyin: "kàn shū" },
  "寫字": { zhuyin: "ㄒㄧㄝˇ ㄗˋ", pinyin: "xiě zì" },
  "吃飯": { zhuyin: "ㄔ ㄈㄢˋ", pinyin: "chī fàn" },
  "喝水": { zhuyin: "ㄏㄜ ㄕㄨㄟˇ", pinyin: "hē shuǐ" },
  "謝謝": { zhuyin: "ㄒㄧㄝˋ ㄒㄧㄝ˙", pinyin: "xièxiè" },
  "你好": { zhuyin: "ㄋㄧˇ ㄏㄠˇ", pinyin: "nǐ hǎo" },
  "出門": { zhuyin: "ㄔㄨ ㄇㄣˊ", pinyin: "chūmén" },
  "容易": { zhuyin: "ㄖㄨㄥˊ ㄧˋ", pinyin: "róngyì" },
  "我們": { zhuyin: "ㄨㄛˇ ˙ㄇㄣ", pinyin: "wǒmen" },
  "你們": { zhuyin: "ㄋㄧˇ ˙ㄇㄣ", pinyin: "nǐmen" },
  "他們": { zhuyin: "ㄊㄚ ˙ㄇㄣ", pinyin: "tāmen" },
  "她們": { zhuyin: "ㄊㄚ ˙ㄇㄣ", pinyin: "tāmen" },
  "自己": { zhuyin: "ㄗˋ ㄐㄧˇ", pinyin: "zìjǐ" },
  "已經": { zhuyin: "ㄧˇ ㄐㄧㄥ", pinyin: "yǐjīng" },
  "準備": { zhuyin: "ㄓㄨㄣˇ ㄅㄟˋ", pinyin: "zhǔnbèi" },
  "開始": { zhuyin: "ㄎㄞ ㄕˇ", pinyin: "kāishǐ" },
  "結束": { zhuyin: "ㄐㄧㄝˊ ㄕㄨˋ", pinyin: "jiéshù" },
  "問題": { zhuyin: "ㄨㄣˋ ㄊㄧˊ", pinyin: "wèntí" },
  "回答": { zhuyin: "ㄏㄨㄟˊ ㄉㄚˊ", pinyin: "huídá" },
  "學習": { zhuyin: "ㄒㄩㄝˊ ㄒㄧˊ", pinyin: "xuéxí" },
  "請問": { zhuyin: "ㄑㄧㄥˇ ㄨㄣˋ", pinyin: "qǐngwèn" },
  "不好意思": { zhuyin: "ㄅㄨˋ ㄏㄠˇ ㄧˋ ㄙ˙", pinyin: "bù hǎoyìsi" },
  "火車站": { zhuyin: "ㄏㄨㄛˇ ㄔㄜ ㄓㄢˋ", pinyin: "huǒchēzhàn" },
  "特色菜": { zhuyin: "ㄊㄜˋ ㄙㄜˋ ㄘㄞˋ", pinyin: "tèsècài" },
  "在地": { zhuyin: "ㄗㄞˋ ㄉㄧˋ", pinyin: "zàidì" },
  "當地": { zhuyin: "ㄉㄤ ㄉㄧˋ", pinyin: "dāngdì" },
  "餐廳": { zhuyin: "ㄘㄢ ㄊㄧㄥ", pinyin: "cāntīng" },
  "好吃": { zhuyin: "ㄏㄠˇ ㄔ", pinyin: "hǎochī" },
  "美味": { zhuyin: "ㄇㄟˇ ㄨㄟˋ", pinyin: "měiwèi" },
  "多少錢": { zhuyin: "ㄉㄨㄛ ㄕㄠˇ ㄑㄧㄢˊ", pinyin: "duōshǎo qián" },
  "捷運站": { zhuyin: "ㄐㄧㄝˊ ㄩㄣˋ ㄓㄢˋ", pinyin: "jiéyùnzhàn" },
  "公車站": { zhuyin: "ㄍㄨㄥ ㄔㄜ ㄓㄢˋ", pinyin: "gōngchēzhàn" },
  "是不是": { zhuyin: "ㄕˋ ㄅㄨˊ ㄕˋ", pinyin: "shì bù shì" },
  "有沒有": { zhuyin: "ㄧㄡˇ ㄇㄟˊ ㄧㄡˇ", pinyin: "yǒu méi yǒu" },
  "能不能": { zhuyin: "ㄋㄥˊ ㄅㄨˋ ㄋㄥˊ", pinyin: "néng bù néng" },
  "可不可以": { zhuyin: "ㄎㄜˇ ㄅㄨˋ ㄎㄜˇ ㄧˇ", pinyin: "kě bù kěyǐ" },
  "什麼": { zhuyin: "ㄕㄣˊ ˙ㄇㄜ", pinyin: "shénme" },
  "怎麼": { zhuyin: "ㄗㄣˇ ˙ㄇㄜ", pinyin: "zěnme" },
  "哪裡": { zhuyin: "ㄋㄚˇ ㄌㄧˇ", pinyin: "nǎlǐ" },
  "那裡": { zhuyin: "ㄋㄚˋ ㄌㄧˇ", pinyin: "nàlǐ" },
  "這裡": { zhuyin: "ㄓㄜˋ ㄌㄧˇ", pinyin: "zhèlǐ" },
  "這本書": { zhuyin: "ㄓㄜˋ ㄅㄣˇ ㄕㄨ", pinyin: "zhè běn shū" },
};

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

    // Check if raw contains both zhuyin and pinyin (e.g. "ㄕˋ / shì" or "ㄕㄡˇ ㄐㄧ / shǒujī")
    const parts = raw.split(/[\/|]/).map((s) => s.trim());
    let zhuyinPart = parts.find((p) => /[\u3100-\u312F\u31A0-\u31BF]/.test(p));
    let pinyinPart = parts.find((p) => /[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p));

    // If zhuyinPart has broken mix (e.g. "ㄒuesheng"), clean it
    if (zhuyinPart && /[a-zA-Z]/.test(zhuyinPart)) {
      zhuyinPart = pinyinToZhuyin(zhuyinPart);
    }

    if (aidMode === "zhuyin") {
      // 1. If valid clean zhuyin exists, return it
      if (zhuyinPart && !/[a-zA-Z]/.test(zhuyinPart)) {
        return zhuyinPart;
      }

      // 2. Convert pinyin part to Zhuyin
      if (pinyinPart) {
        return pinyinToZhuyin(pinyinPart);
      }

      // 3. Convert raw string
      if (raw) {
        return pinyinToZhuyin(raw);
      }

      // 4. Check dictionary lookup for targetItem
      const cleanTarget = (targetItem || "").replace(/[^\u4e00-\u9fa5]/g, "").trim();
      if (cleanTarget && HANZI_PHONETIC_DICT[cleanTarget]) {
        return HANZI_PHONETIC_DICT[cleanTarget].zhuyin;
      }

      // 5. Check if target item has embedded pinyin like "是 (shì)"
      const bracketMatch = targetItem.match(/\(([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+)\)/);
      if (bracketMatch) {
        return pinyinToZhuyin(bracketMatch[1]);
      }

      return null;
    }

    if (aidMode === "pinyin") {
      if (pinyinPart) return pinyinPart;

      // Extract from targetItem if available e.g. "是 (shì)"
      const bracketMatch = targetItem.match(/\(([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+)\)/);
      if (bracketMatch) {
        return bracketMatch[1];
      }

      const cleanTarget = (targetItem || "").replace(/[^\u4e00-\u9fa5]/g, "").trim();
      if (cleanTarget && HANZI_PHONETIC_DICT[cleanTarget]) {
        return HANZI_PHONETIC_DICT[cleanTarget].pinyin;
      }

      if (raw && !/[\u3100-\u312F]/.test(raw)) return raw;
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

  // Spanish, French, German, Italian and other languages
  const raw = (rawPhonetic || "").trim();
  return raw || null;
}
