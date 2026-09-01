import React, { useState, useEffect, useRef } from "react";
import { SupportedLanguage, QuickAssistResult, QuickAssistQueryType } from "../types";
import { playTextAloud } from "../utils/speech";
import { formatPronunciation } from "../utils/pronunciation";
import { AlignedTranslation } from "./AlignedTranslation";
import { AiEngineBadge } from "./AiEngineBadge";
import {
  Bot,
  Search,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Plus,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  X,
  Languages,
  BookOpen,
  BrainCircuit,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
  Table,
  Split,
  Workflow,
  RotateCcw,
} from "lucide-react";

export interface LinguisticCopilotProps {
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  pronunciationAid?: string;
  onInsertText?: (text: string) => void;
  initialQuery?: string;
  isOpen?: boolean;
  onClose?: () => void;
  variant?: "drawer" | "card" | "inline" | "modal";
  title?: string;
  subtitle?: string;
  className?: string;
  idPrefix?: string;
  showCloseButton?: boolean;
  defaultTab?: QuickAssistQueryType;
}

export const LinguisticCopilot: React.FC<LinguisticCopilotProps> = ({
  targetLang,
  knownLang,
  pronunciationAid = "romanized",
  onInsertText,
  initialQuery = "",
  isOpen = true,
  onClose,
  variant = "card",
  title = "AI Linguistic Co-Pilot",
  subtitle,
  className = "",
  idPrefix = "copilot",
  showCloseButton = true,
  defaultTab = "how_to_say",
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [queryType, setQueryType] = useState<QuickAssistQueryType>(defaultTab);
  
  // Specific conjugation sub-mode: "inflect" (verb + form -> conjugated word) vs "deconjugate" (word -> base + form)
  const [conjugateSubMode, setConjugateSubMode] = useState<"inflect" | "deconjugate">("inflect");
  const [verbBaseInput, setVerbBaseInput] = useState<string>("");
  const [verbFormInput, setVerbFormInput] = useState<string>("Present (yo / I)");
  const [conjugatedWordInput, setConjugatedWordInput] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<QuickAssistResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query if it changes
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  if (!isOpen && variant !== "modal") {
    return null;
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleInsert = (text: string) => {
    if (onInsertText) {
      onInsertText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const handleSearch = async (overrideQuery?: string, overrideType?: QuickAssistQueryType) => {
    let q = (overrideQuery ?? query).trim();
    let type = overrideType ?? queryType;

    // Build specific query for conjugation modes if in conjugate tab
    if (type === "conjugate") {
      if (conjugateSubMode === "inflect") {
        if (!overrideQuery) {
          const v = verbBaseInput.trim();
          const f = verbFormInput.trim();
          if (!v) return;
          q = `Verb: "${v}", Desired Form / Tense: "${f || "Present"}"`;
        }
      } else {
        if (!overrideQuery) {
          const w = conjugatedWordInput.trim();
          if (!w) return;
          q = `Deconjugate and identify: "${w}"`;
          type = "deconjugate";
        }
      }
    }

    if (!q) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/quick-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          queryType: type,
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to query linguistic co-pilot (${res.status})`);
      }

      const data: QuickAssistResult = await res.json();
      setResult(data);

      // Add to search history (deduped, max 5)
      setHistory((prev) => [q, ...prev.filter((item) => item !== q)].slice(0, 5));
    } catch (err: any) {
      console.error("Co-Pilot lookup failed:", err);
      setError("Could not retrieve linguistic advice right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const formPresets = [
    { label: "Present (yo/I)", value: "Present indicative (yo / 1st person singular)" },
    { label: "Preterite / Past", value: "Past / Pretérito (completed past)" },
    { label: "Imperfect (was doing)", value: "Imperfect (used to / was doing)" },
    { label: "Future", value: "Future simple" },
    { label: "Subjunctive", value: "Present Subjunctive" },
    { label: "Conditional (would)", value: "Conditional (would do)" },
    { label: "Imperative (Command)", value: "Imperative / Command form" },
    { label: "Te-form / Polite", value: "Te-form / Polite standard (ます/아/어요)" },
  ];

  const quickSuggestionChips: { label: string; query: string; type: QuickAssistQueryType }[] = [
    {
      label: `How to say "Thank you very much"`,
      query: "Thank you very much",
      type: "how_to_say",
    },
    {
      label: `How to say "Could you please help me?"`,
      query: "Could you please help me?",
      type: "how_to_say",
    },
    {
      label: `How to say "In my opinion"`,
      query: "In my opinion / from my point of view",
      type: "how_to_say",
    },
    {
      label: `Nuance: Casual vs Polite`,
      query: "What is the difference between casual and polite forms for expressing gratitude?",
      type: "check_nuance",
    },
  ];

  const getPlaceholder = () => {
    switch (queryType) {
      case "how_to_say":
        return `e.g., "Can you make it less spicy?", "I'm looking forward to..."`;
      case "lookup_word":
        return `e.g., Type a ${targetLang.name} word or phrase to analyze...`;
      case "check_nuance":
        return `e.g., "Is this too formal?", "Difference between word A and B"`;
      case "conjugate":
        return `e.g., "hablar in past preterite", "comer subjunctive"`;
      default:
        return `Ask anything in or about ${targetLang.name}...`;
    }
  };

  const renderContent = () => (
    <div className="space-y-3.5">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900">{title}</h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                {targetLang.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {subtitle || `Instant translation, nuance check & conjugation for ${targetLang.name}`}
            </p>
          </div>
        </div>

        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Close Co-Pilot"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
        {[
          { id: "how_to_say", label: "How to Say", icon: "🎯" },
          { id: "lookup_word", label: "Lookup", icon: "📖" },
          { id: "conjugate", label: "Conjugate", icon: "⚡" },
          { id: "check_nuance", label: "Nuance", icon: "💡" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setQueryType(tab.id as QuickAssistQueryType);
              inputRef.current?.focus();
            }}
            className={`py-1.5 px-1 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer truncate ${
              queryType === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONJUGATE MODE SPECIAL UI */}
      {queryType === "conjugate" ? (
        <div className="space-y-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
          {/* Sub-mode switcher: Verb+Form vs Deconjugate */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-white rounded-xl border border-indigo-100 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setConjugateSubMode("inflect")}
              className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                conjugateSubMode === "inflect"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Verb + Form → Conjugated</span>
            </button>
            <button
              type="button"
              onClick={() => setConjugateSubMode("deconjugate")}
              className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                conjugateSubMode === "deconjugate"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Word → Base + Form</span>
            </button>
          </div>

          {conjugateSubMode === "inflect" ? (
            /* Mode 1: Verb + Form -> Conjugated Word */
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Base Verb (Infinitive)
                  </label>
                  <input
                    type="text"
                    value={verbBaseInput}
                    onChange={(e) => setVerbBaseInput(e.target.value)}
                    placeholder={`e.g., hablar, comer, aller, 食べる...`}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Target Form / Tense
                  </label>
                  <input
                    type="text"
                    value={verbFormInput}
                    onChange={(e) => setVerbFormInput(e.target.value)}
                    placeholder={`e.g., Preterite yo, Subjunctive, Past...`}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              {/* Form Quick Preset Chips */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Quick Tense / Form Presets:
                </span>
                <div className="flex flex-wrap gap-1">
                  {formPresets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setVerbFormInput(preset.value);
                        if (verbBaseInput.trim()) {
                          handleSearch(`Verb: "${verbBaseInput.trim()}", Form: "${preset.value}"`, "conjugate");
                        }
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        verbFormInput === preset.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white hover:bg-indigo-50 text-slate-600 border-slate-200 hover:border-indigo-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isLoading || !verbBaseInput.trim()}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
                    <span>Conjugating Verb...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Conjugate Verb Form</span>
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* Mode 2: Word -> Base Verb + Form (Deconjugate) */
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Conjugated Word in {targetLang.name}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={conjugatedWordInput}
                    onChange={(e) => setConjugatedWordInput(e.target.value)}
                    placeholder={`e.g., hablaron, comiese, 食べた, 먹었습니다...`}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-20 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(undefined, "deconjugate")}
                  />
                  <button
                    type="button"
                    onClick={() => handleSearch(undefined, "deconjugate")}
                    disabled={isLoading || !conjugatedWordInput.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {isLoading ? "..." : "Split Form"}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Enter any conjugated verb form to automatically extract the root lemma infinitive, grammatical tense, person/mood, and stem breakdown.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD QUERY SEARCH INPUT FORM FOR OTHER TABS */
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              id={`${idPrefix}-query-input`}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-16 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </span>
              ) : (
                "Ask"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Quick Suggestion Chips (when no result yet or idle, non-conjugate mode) */}
      {!result && !isLoading && queryType !== "conjugate" && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Quick Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(chip.query);
                  setQueryType(chip.type);
                  handleSearch(chip.query, chip.type);
                }}
                className="text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg px-2.5 py-1 transition cursor-pointer text-left"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2.5 bg-indigo-50/40 rounded-2xl border border-indigo-100">
          <BrainCircuit className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="font-semibold text-slate-700">
            Consulting linguistic database for {targetLang.name}...
          </p>
          <p className="text-[11px] text-slate-400">
            Generating native phrasing, formality variants, and grammar analysis.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="text-[11px] font-bold underline hover:text-rose-900 cursor-pointer ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && !isLoading && (
        <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
          {/* Primary Recommended Target Expression */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-slate-50 border border-indigo-200 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                    {result.conjugationAnalysis ? "Conjugated / Analyzed Form" : "Recommended Expression"}
                  </span>
                  <AiEngineBadge
                    isFallback={result.isFallback}
                    engineSource={result.engineSource}
                    modelUsed={result.modelUsed}
                    compact
                  />
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {result.targetExpression}
                </h4>
                {formatPronunciation(
                  result.targetExpression,
                  result.phonetic,
                  targetLang.code,
                  pronunciationAid
                ) && (
                  <p className="text-xs font-serif text-indigo-700 font-medium">
                    {formatPronunciation(
                      result.targetExpression,
                      result.phonetic,
                      targetLang.code,
                      pronunciationAid
                    )}
                  </p>
                )}
                <p className="text-xs text-slate-600 font-semibold pt-0.5">
                  {result.meaningInKnown}
                </p>
              </div>

              {/* Quick Actions: Audio & Copy */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => playTextAloud(result.targetExpression, targetLang.code)}
                  className="p-2 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-2xs"
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(result.targetExpression)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs"
                  title="Copy to clipboard"
                >
                  {copiedText === result.targetExpression ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 1-Tap Insert Button (if onInsertText is wired) */}
            {onInsertText && (
              <button
                type="button"
                onClick={() => handleInsert(result.targetExpression)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert into Text</span>
              </button>
            )}
          </div>

          {/* Conjugation Breakdown & Morphology Card (if present) */}
          {result.conjugationAnalysis && (
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-200/70">
                <div className="flex items-center gap-1.5 text-purple-900 font-extrabold">
                  <Table className="w-3.5 h-3.5 text-purple-700" />
                  <span>Grammar & Conjugation Breakdown</span>
                </div>
                {result.conjugationAnalysis.infinitive && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900">
                    Base Lemma: {result.conjugationAnalysis.infinitive}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-purple-950">
                {result.conjugationAnalysis.form && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-purple-600 block">Form / Tense</span>
                    <span className="font-bold">{result.conjugationAnalysis.form}</span>
                  </div>
                )}
                {result.conjugationAnalysis.personOrRegister && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-purple-600 block">Subject / Register</span>
                    <span className="font-bold">{result.conjugationAnalysis.personOrRegister}</span>
                  </div>
                )}
              </div>

              {result.conjugationAnalysis.ruleExplanation && (
                <div className="p-2 rounded-xl bg-white/90 border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
                  <span className="font-bold text-purple-950">Formation Rule: </span>
                  {result.conjugationAnalysis.ruleExplanation}
                </div>
              )}

              {/* Related forms pills */}
              {result.conjugationAnalysis.relatedForms && result.conjugationAnalysis.relatedForms.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-purple-600 block">
                    Other Conjugated Forms of this Verb:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {result.conjugationAnalysis.relatedForms.map((rf, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (onInsertText) handleInsert(rf.conjugated);
                          else handleCopy(rf.conjugated);
                        }}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-purple-600 hover:text-white border border-purple-200 text-purple-900 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title={onInsertText ? `Click to insert "${rf.conjugated}"` : `Click to copy "${rf.conjugated}"`}
                      >
                        <span className="text-purple-600 group-hover:text-purple-200">{rf.form}:</span>
                        <span>{rf.conjugated}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formality Variants */}
          {result.formalityVariants && result.formalityVariants.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Formality & Register Variants:
              </span>
              <div className="space-y-1.5">
                {result.formalityVariants.map((v, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 transition flex items-center justify-between gap-2 shadow-2xs group"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{v.phrase}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                          {v.register}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{v.note}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => playTextAloud(v.phrase, targetLang.code)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition"
                        title="Listen"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(v.phrase)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                        title="Copy"
                      >
                        {copiedText === v.phrase ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {onInsertText && (
                        <button
                          type="button"
                          onClick={() => handleInsert(v.phrase)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                          title="Insert variant"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insert</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Word-by-Word Morpheme Breakdown */}
          {result.wordBreakdown && result.wordBreakdown.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Word / Stem Breakdown:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.wordBreakdown.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (onInsertText) handleInsert(w.word);
                      else handleCopy(w.word);
                    }}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition cursor-pointer"
                    title={onInsertText ? `Click to insert "${w.word}"` : `Click to copy "${w.word}"`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{w.word}</span>
                    <span className="text-[10px] text-slate-500 block">{w.meaning}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Practical Example Sentence with Morphological Alignment */}
          {result.exampleSentence && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/90 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider block">
                Aligned Example in Context:
              </span>
              <AlignedTranslation
                targetText={result.exampleSentence.target}
                translationText={result.exampleSentence.translation || result.exampleSentence.meaning || ""}
                targetLangCode={targetLang.code}
                phonetic={result.exampleSentence.phonetic}
                pronunciationAid={pronunciationAid}
                idPrefix={`copilot-ex-${result.targetExpression}`}
                onSpeak={(text) => playTextAloud(text, targetLang.code)}
                size="sm"
              />
            </div>
          )}

          {/* Linguistic Nuance / Cultural Tip */}
          {result.nuanceTip && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Linguistic Nuance Tip</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900">
                {result.nuanceTip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (variant === "modal") {
    if (!isOpen) return null;
    return (
      <div
        id={`${idPrefix}-modal`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {renderContent()}
        </div>
      </div>
    );
  }

  if (variant === "drawer") {
    return (
      <div
        id={`${idPrefix}-drawer`}
        className={`bg-white rounded-3xl p-5 border border-indigo-200 shadow-md ${className}`}
      >
        {renderContent()}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        id={`${idPrefix}-inline`}
        className={`bg-white rounded-2xl p-4 border border-indigo-200 shadow-xs space-y-3 ${className}`}
      >
        {renderContent()}
      </div>
    );
  }

  // Default card variant
  return (
    <div
      id={`${idPrefix}-card`}
      className={`bg-white rounded-3xl p-5 border border-slate-200 shadow-sm ${className}`}
    >
      {renderContent()}
    </div>
  );
};

// Reusable Consistent Trigger Button
export interface CopilotTriggerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  label?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  id?: string;
  title?: string;
}

export const CopilotTriggerButton: React.FC<CopilotTriggerButtonProps> = ({
  isOpen,
  onClick,
  label = "AI Co-Pilot",
  size = "sm",
  className = "",
  id,
  title = "Open AI Linguistic Co-Pilot for phrasing help, nuance, translation & conjugation",
}) => {
  const sizeClasses = {
    xs: "px-2.5 py-1 text-[11px] rounded-lg gap-1",
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-3.5 py-2 text-xs font-bold rounded-2xl gap-2",
  }[size];

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`flex items-center font-bold transition border cursor-pointer active:scale-95 shadow-2xs ${sizeClasses} ${
        isOpen
          ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100"
          : "bg-white hover:bg-indigo-50/60 text-slate-700 border-slate-200 hover:border-indigo-200 hover:text-indigo-700"
      } ${className}`}
      title={title}
    >
      <Bot className={`w-3.5 h-3.5 ${isOpen ? "fill-white text-white" : "text-indigo-600"}`} />
      <span>{label}</span>
      {isOpen ? (
        <ChevronUp className="w-3 h-3 opacity-80" />
      ) : (
        <ChevronDown className="w-3 h-3 opacity-60" />
      )}
    </button>
  );
};
