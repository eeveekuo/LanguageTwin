import React, { useState, useEffect, useRef } from "react";
import { SupportedLanguage, QuickAssistResult, QuickAssistQueryType } from "../types";
import { playTextAloud } from "../utils/speech";
import { formatPronunciation } from "../utils/pronunciation";
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
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [queryType, setQueryType] = useState<QuickAssistQueryType>("how_to_say");
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
    const q = (overrideQuery ?? query).trim();
    const type = overrideType ?? queryType;

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
      label: `How to say "Although / Even though"`,
      query: "Although / Even though",
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
        return `e.g., "Conjugate to go in past tense", "Subjunctive forms"`;
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
              {subtitle || `Instant translation, nuance check & phrases for ${targetLang.name}`}
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
          { id: "check_nuance", label: "Nuance", icon: "💡" },
          { id: "conjugate", label: "Conjugate", icon: "⚡" },
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

      {/* Query Search Input Form */}
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

      {/* Quick Suggestion Chips (when no result yet or idle) */}
      {!result && !isLoading && (
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
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
                  Recommended Expression
                </span>
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
                Word Breakdown:
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

          {/* Practical Example Sentence */}
          {result.exampleSentence && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Example in Context:
              </span>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {result.exampleSentence.target}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    {result.exampleSentence.meaning}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    playTextAloud(result.exampleSentence!.target, targetLang.code)
                  }
                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition shrink-0"
                  title="Listen to example"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
        className={`bg-white rounded-3xl p-5 border-2 border-indigo-500 shadow-md ${className}`}
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
  title = "Open AI Linguistic Co-Pilot for phrasing help, nuance and translation",
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
