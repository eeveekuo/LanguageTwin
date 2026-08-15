import { SupportedLanguage } from "../types";

export const SUPPORTED_TARGET_LANGUAGES: SupportedLanguage[] = [
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    speechLocale: "es-ES",
    specialChars: ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡", "Á", "É", "Í", "Ó", "Ú", "Ñ"],
    defaultVoices: ["es-ES", "es-MX", "es-US"],
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    speechLocale: "ko-KR",
    specialChars: ["〜", "·", "「", "」"],
    defaultVoices: ["ko-KR"],
  },
  {
    code: "zh-TW",
    name: "Traditional Chinese",
    nativeName: "繁體中文",
    flag: "🇹🇼",
    speechLocale: "zh-TW",
    specialChars: ["，", "。", "！", "？", "：", "「", "」", "《", "》", "、"],
    defaultVoices: ["zh-TW"],
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    speechLocale: "ja-JP",
    specialChars: ["ー", "〜", "「", "」", "、", "。", "・"],
    defaultVoices: ["ja-JP"],
  },
  {
    code: "nan",
    name: "Taiwanese Hokkien",
    nativeName: "臺灣話 (臺語)",
    flag: "🇹🇼",
    speechLocale: "zh-TW",
    specialChars: ["ā", "á", "à", "â", "ā", "a̍", "ê", "î", "ô", "ṳ", "ⁿ"],
    defaultVoices: ["zh-TW"],
  },
];

export const SUPPORTED_KNOWN_LANGUAGES: SupportedLanguage[] = [
  {
    code: "zh-TW",
    name: "Traditional Chinese",
    nativeName: "繁體中文",
    flag: "🇹🇼",
    speechLocale: "zh-TW",
    specialChars: ["，", "。", "！", "？", "：", "「", "」", "《", "》", "、"],
    defaultVoices: ["zh-TW"],
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    speechLocale: "en-US",
    specialChars: ["'", "\"", "-", "—"],
    defaultVoices: ["en-US", "en-GB"],
  },
];

// All supported languages union
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  ...SUPPORTED_TARGET_LANGUAGES,
  ...SUPPORTED_KNOWN_LANGUAGES.filter((k) => !SUPPORTED_TARGET_LANGUAGES.some((t) => t.code === k.code)),
];

export const getLanguageByCode = (code: string): SupportedLanguage => {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ||
    SUPPORTED_TARGET_LANGUAGES.find((lang) => lang.code === code) ||
    SUPPORTED_KNOWN_LANGUAGES.find((lang) => lang.code === code) || {
      code,
      name: code === "zh" ? "Traditional Chinese" : code.toUpperCase(),
      nativeName: code === "zh" ? "繁體中文" : code.toUpperCase(),
      flag: "🌐",
      speechLocale: `${code}-${code.toUpperCase()}`,
      specialChars: [],
    }
  );
};

export const getTargetLanguageByCode = (code: string): SupportedLanguage => {
  return (
    SUPPORTED_TARGET_LANGUAGES.find((lang) => lang.code === code) ||
    getLanguageByCode(code)
  );
};

export const getKnownLanguageByCode = (code: string): SupportedLanguage => {
  return (
    SUPPORTED_KNOWN_LANGUAGES.find((lang) => lang.code === code) ||
    getLanguageByCode(code)
  );
};
