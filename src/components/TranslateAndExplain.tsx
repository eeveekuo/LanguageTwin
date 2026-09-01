import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  Layers,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Globe,
  Share2,
  Mic,
  MicOff,
} from "lucide-react";
import { SupportedLanguage, Flashcard } from "../types";
import { AlignedTranslation } from "./AlignedTranslation";
import { formatPronunciation, getPronunciationOptions } from "../utils/pronunciation";
import { playTextAloud } from "../utils/speech";
import { AiEngineBadge } from "./AiEngineBadge";

interface TranslationResult {
  translatedText: string;
  phonetic?: string;
  literalTranslation?: string;
  summaryExplanation: string;
  structuralFormula: string;
  formalityVariants: Array<{
    register: string;
    phrase: string;
    explanation: string;
  }>;
  tokenBreakdown: Array<{
    token: string;
    translatedToken: string;
    partOfSpeech: string;
    roleOrNuance?: string;
  }>;
  grammarPoints: Array<{
    pattern: string;
    meaning: string;
    rule: string;
    exampleSentence?: {
      target: string;
      translation: string;
    };
  }>;
  culturalOrIdiomNote?: string;
  isFallback?: boolean;
  engineSource?: "gemini" | "fallback" | string;
  modelUsed?: string;
}

interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  sourceText: string;
  sourceLangCode: string;
  targetLangCode: string;
  result: TranslationResult;
}

interface TranslateAndExplainProps {
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  isOnline?: boolean;
  onAddCardToDeck?: (card: Partial<Flashcard>) => void;
  pronunciationAid: string;
  onLogPracticeActivity?: (activity: {
    mechanism: "translate";
    title: string;
    details: string;
    score?: number;
    targetItem?: string;
  }) => void;
}

export const TranslateAndExplain: React.FC<TranslateAndExplainProps> = ({
  targetLang,
  knownLang,
  isOnline = true,
  onAddCardToDeck,
  pronunciationAid,
  onLogPracticeActivity,
}) => {
  const [direction, setDirection] = useState<"known-to-target" | "target-to-known">(
    "known-to-target"
  );
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [addedCardMap, setAddedCardMap] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [activeSection, setActiveSection] = useState<
    "breakdown" | "variants" | "grammar" | "tokens"
  >("breakdown");

  const sourceLang = direction === "known-to-target" ? knownLang : targetLang;
  const destinationLang = direction === "known-to-target" ? targetLang : knownLang;

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`langtwin_translate_history_${targetLang.code}`);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load translation history:", e);
    }
  }, [targetLang.code]);

  // Save history to localStorage
  const saveToHistory = (source: string, res: TranslationResult) => {
    const newItem: TranslationHistoryItem = {
      id: `trans-${Date.now()}`,
      timestamp: Date.now(),
      sourceText: source,
      sourceLangCode: sourceLang.code,
      targetLangCode: destinationLang.code,
      result: res,
    };
    const updated = [newItem, ...history.filter((h) => h.sourceText !== source)].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem(
        `langtwin_translate_history_${targetLang.code}`,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn("Could not save translation history:", e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(`langtwin_translate_history_${targetLang.code}`);
    } catch (e) {
      console.warn("Could not clear history:", e);
    }
  };

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate !== undefined ? textToTranslate : inputText).trim();
    if (!text) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/translate-and-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLanguage: sourceLang,
          targetLanguage: destinationLang,
          pronunciationAid,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: TranslationResult = await res.json();
      setResult(data);
      saveToHistory(text, data);
      onLogPracticeActivity?.({
        mechanism: "translate",
        title: `Translate: "${text.slice(0, 32)}${text.length > 32 ? "..." : ""}"`,
        details: `Generated aligned structure and grammatical points in ${destinationLang.name}`,
        targetItem: data.translatedText,
      });
    } catch (error: any) {
      console.error("Translation failed:", error);
      // Fallback
      const fallbackResult: TranslationResult = {
        translatedText: text,
        phonetic: "",
        summaryExplanation: "Translation service temporarily offline. Please try again.",
        structuralFormula: "[Subject] + [Verb] + [Object]",
        formalityVariants: [
          {
            register: "Standard",
            phrase: text,
            explanation: "Default contextual phrasing.",
          },
        ],
        tokenBreakdown: [],
        grammarPoints: [],
      };
      setResult(fallbackResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapDirection = () => {
    setDirection((prev) =>
      prev === "known-to-target" ? "target-to-known" : "known-to-target"
    );
    if (result) {
      setInputText(result.translatedText);
      setResult(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPhraseToDeck = (targetText: string, translationText: string, keyId: string) => {
    if (!onAddCardToDeck) return;
    const targetItem = direction === "known-to-target" ? targetText : translationText;
    const def = direction === "known-to-target" ? translationText : targetText;

    onAddCardToDeck({
      type: "sentence",
      targetItem,
      definition: def,
      frequencyRank: 999,
      partOfSpeech: "Sentence / Phrase",
      examples: [
        {
          target: targetItem,
          translation: def,
          phonetic: formatPronunciation(targetItem, undefined, targetLang.code, pronunciationAid) || undefined,
        },
      ],
      tags: ["translation-explainer", "interactive"],
    });

    setAddedCardMap((prev) => ({ ...prev, [keyId]: true }));
  };

  // Sample prompt suggestions based on target language
  const samplePrompts =
    direction === "known-to-target"
      ? [
          "Could you please recommend a popular local dish here?",
          "I have been studying this language for three months.",
          "Excuse me, what is the best way to get to the train station?",
          "Thank you very much for your kind help today!",
          "I think this perspective is quite interesting and unique.",
        ]
      : targetLang.code === "zh-TW"
      ? [
          "請問附近有推薦的在地美食嗎？",
          "我已經學習繁體中文三個月了。",
          "不好意思，請問去火車站怎麼走最快？",
          "非常感謝你今天熱心的協助！",
        ]
      : targetLang.code === "ja"
      ? [
          "すみません、おすすめの料理はどれですか？",
          "日本語を勉強して三ヶ月になります。",
          "駅までどうやって行けばいいですか？",
          "今日はお手伝いいただき、本当にありがとうございました！",
        ]
      : targetLang.code === "ko"
      ? [
          "실례지만 여기서 가장 인기 있는 메뉴가 무엇인가요?",
          "한국어를 공부한 지 3개월 되었습니다.",
          "지하철역으로 가려면 어떻게 가야 하나요?",
        ]
      : [
          "¿Podrías recomendarme un plato típico de aquí?",
          "He estado estudiando este idioma durante tres meses.",
          "Disculpe, ¿cuál es la mejor manera de llegar a la estación?",
        ];

  // Target and translation text for AlignedTranslation component
  const alignedTarget = direction === "known-to-target" ? result?.translatedText || "" : inputText;
  const alignedTranslation = direction === "known-to-target" ? inputText : result?.translatedText || "";

  // Pronunciation formatting: only shown if pronunciationAid is active and not 'none'
  const isPronunciationEnabled = pronunciationAid && pronunciationAid !== "none";
  const formattedPhonetic = isPronunciationEnabled && result
    ? formatPronunciation(
        direction === "known-to-target" ? result.translatedText : inputText,
        result.phonetic,
        targetLang.code,
        pronunciationAid
      )
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bidirectional Alignment & Linguistic Explainer</span>
              </span>
              {isPronunciationEnabled && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  Aid: {pronunciationAid.toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Translate & Explain
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Type or paste any sentence in either {knownLang.name} or {targetLang.name}. AI provides an idiomatic translation with word-by-word hover alignment, grammatical formulas, and social formality variants.
            </p>
          </div>
        </div>

        {/* Direction Switcher Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 flex-wrap gap-3">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-700 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-base">{sourceLang.flag}</span>
              <span>{sourceLang.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({sourceLang.code})</span>
            </span>

            <button
              type="button"
              onClick={handleSwapDirection}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold border border-indigo-200 shadow-2xs active:scale-95"
              title="Swap translation direction"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swap</span>
            </button>

            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-base">{destinationLang.flag}</span>
              <span>{destinationLang.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({destinationLang.code})</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
            Interactive hover-alignment active on results
          </span>
        </div>

        {/* Input Box */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              id="translate-input-box"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleTranslate();
                }
              }}
              rows={3}
              placeholder={`Type or paste a sentence in ${sourceLang.name} (e.g. "${samplePrompts[0]}")...`}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm sm:text-base font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none leading-relaxed"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText("");
                  setResult(null);
                }}
                className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer text-xs font-bold"
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Quick inspiration prompts:</span>
              <span className="font-mono text-[10px]">Ctrl/Cmd + Enter to translate</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(prompt);
                    handleTranslate(prompt);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition cursor-pointer border border-slate-200/80 hover:border-indigo-200"
                >
                  "{prompt.length > 30 ? prompt.slice(0, 30) + "..." : prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              {inputText.length > 0 && <span>{inputText.length} characters</span>}
            </div>

            <button
              type="button"
              id="submit-translate-btn"
              onClick={() => handleTranslate()}
              disabled={isLoading || !inputText.trim()}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Translating & Parsing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate & Explain</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Main Aligned Translation Display Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-600 shadow-md space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                    Interactive Word-by-Word Translation Alignment
                  </span>
                  <AiEngineBadge
                    isFallback={result.isFallback}
                    engineSource={result.engineSource}
                    modelUsed={result.modelUsed}
                    compact
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Hover your cursor over any word in the top or bottom sentence to see the linked part highlighted automatically in both languages.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(result.translatedText)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-xs flex items-center gap-1"
                  title="Copy translation"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span className="text-[11px] hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPhraseToDeck(
                      result.translatedText,
                      inputText,
                      `main-${result.translatedText}`
                    )
                  }
                  disabled={addedCardMap[`main-${result.translatedText}`]}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    addedCardMap[`main-${result.translatedText}`]
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                  title="Add to active study deck"
                >
                  {addedCardMap[`main-${result.translatedText}`] ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Deck</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Deck</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Bidirectional Aligned Translation Component */}
            <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
              <AlignedTranslation
                targetText={alignedTarget}
                translationText={alignedTranslation}
                targetLangCode={direction === "known-to-target" ? targetLang.code : knownLang.code}
                phonetic={result.phonetic}
                pronunciationAid={pronunciationAid}
                tokenBreakdown={result.tokenBreakdown}
                structuralFormula={result.structuralFormula}
                idPrefix="live-trans"
                onSpeak={(text) => playTextAloud(text, direction === "known-to-target" ? targetLang.code : knownLang.code)}
                size="lg"
                layout="stacked"
              />

              {result.literalTranslation && result.literalTranslation !== result.translatedText && (
                <div className="pt-2 border-t border-indigo-100/60 flex items-start gap-2 text-xs text-indigo-900/80">
                  <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    Literal Gloss:
                  </span>
                  <span className="italic">{result.literalTranslation}</span>
                </div>
              )}
            </div>

            {/* Navigation Tabs for Pedagogical Sections */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSection("breakdown")}
                className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSection === "breakdown"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Sentence Structure & Nuance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("variants")}
                className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSection === "variants"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Formality & Register Variants ({result.formalityVariants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("tokens")}
                className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSection === "tokens"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Token-by-Token Table ({result.tokenBreakdown.length})</span>
              </button>

              {result.grammarPoints && result.grammarPoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSection("grammar")}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeSection === "grammar"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Grammar Rules ({result.grammarPoints.length})</span>
                </button>
              )}
            </div>

            {/* TAB 1: Syntax & Nuance Breakdown */}
            {activeSection === "breakdown" && (
              <div className="space-y-4 animate-fade-in">
                {/* Structural Formula Pill */}
                {result.structuralFormula && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>Sentence Structure Formula:</span>
                    </span>
                    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-bold text-indigo-950">
                      <span className="font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        {result.structuralFormula}
                      </span>
                    </div>
                  </div>
                )}

                {/* Linguistic Explanation */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs sm:text-sm text-indigo-950 space-y-1.5 leading-relaxed">
                  <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider">
                    Linguistic & Syntax Analysis:
                  </span>
                  <p>{result.summaryExplanation}</p>
                </div>

                {/* Cultural / Idiomatic Note */}
                {result.culturalOrIdiomNote && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1 leading-relaxed">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3 text-amber-600" />
                      <span>Cultural & Pragmatic Context:</span>
                    </span>
                    <p>{result.culturalOrIdiomNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Formality & Register Variants */}
            {activeSection === "variants" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
                {result.formalityVariants.map((v, idx) => {
                  const variantKey = `variant-${idx}-${v.phrase}`;
                  const isAdded = addedCardMap[variantKey];
                  const pron = isPronunciationEnabled
                    ? formatPronunciation(v.phrase, undefined, targetLang.code, pronunciationAid)
                    : null;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3 hover:bg-white hover:border-indigo-200 transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                            {v.register}
                          </span>
                          <button
                            type="button"
                            onClick={() => playTextAloud(v.phrase, targetLang.code)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition"
                            title="Listen"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-sm sm:text-base font-bold text-slate-900 select-text">
                          {v.phrase}
                        </p>

                        {pron && (
                          <p className="text-xs font-serif text-indigo-600">
                            {pron}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 leading-relaxed">
                          {v.explanation}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleAddPhraseToDeck(v.phrase, inputText, variantKey)
                        }
                        disabled={isAdded}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                          isAdded
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add Variant</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: Token Breakdown Table */}
            {activeSection === "tokens" && (
              <div className="space-y-3 animate-fade-in">
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Component / Word</th>
                        <th className="p-3">Meaning</th>
                        <th className="p-3">Part of Speech</th>
                        <th className="p-3">Role & Nuance</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.tokenBreakdown.map((tok, idx) => {
                        const tokenKey = `tok-${idx}-${tok.token}`;
                        const isAdded = addedCardMap[tokenKey];
                        const pron = isPronunciationEnabled
                          ? formatPronunciation(tok.token, undefined, targetLang.code, pronunciationAid)
                          : null;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-900 select-text">
                              <span>{tok.token}</span>
                              {pron && (
                                <span className="block text-[10px] text-indigo-600 font-serif font-normal">
                                  {pron}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-700 font-medium select-text">
                              {tok.translatedToken}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {tok.partOfSpeech}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 text-[11px] leading-relaxed max-w-xs">
                              {tok.roleOrNuance || "Standard lexical item"}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onAddCardToDeck) {
                                    onAddCardToDeck({
                                      type: "vocabulary",
                                      targetItem: tok.token,
                                      definition: tok.translatedToken,
                                      frequencyRank: 999,
                                      partOfSpeech: tok.partOfSpeech,
                                      examples: [
                                        {
                                          target: result.translatedText,
                                          translation: inputText,
                                          phonetic: formattedPhonetic || undefined,
                                        },
                                      ],
                                      tags: ["vocab-extract"],
                                    });
                                    setAddedCardMap((prev) => ({ ...prev, [tokenKey]: true }));
                                  }
                                }}
                                disabled={isAdded}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isAdded
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                                }`}
                              >
                                {isAdded ? "Added" : "+ Add"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Grammar Points */}
            {activeSection === "grammar" && (
              <div className="space-y-3 animate-fade-in">
                {result.grammarPoints.map((gp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{gp.pattern}</span>
                      </h4>
                      <span className="text-xs font-medium text-slate-500">
                        {gp.meaning}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{gp.rule}</p>

                    {gp.exampleSentence && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <AlignedTranslation
                          targetText={gp.exampleSentence.target}
                          translationText={gp.exampleSentence.translation}
                          targetLangCode={targetLang.code}
                          idPrefix={`gp-example-${idx}`}
                          onSpeak={(t) => playTextAloud(t, targetLang.code)}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Translation History Section */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Recent Translation Queries ({history.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setInputText(item.sourceText);
                  setResult(item.result);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-mono">{item.sourceLangCode} → {item.targetLangCode}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {item.sourceText}
                </p>
                <p className="text-xs text-indigo-700 truncate font-medium">
                  {item.result.translatedText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
