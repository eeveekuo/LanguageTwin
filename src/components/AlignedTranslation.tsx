import React, { useState, useMemo } from "react";
import { getAlignedSentencePair, isNonSpacedCJK, Token } from "../utils/alignment";
import { formatPronunciation } from "../utils/pronunciation";
import { Volume2, Link as LinkIcon, Sparkles } from "lucide-react";

interface AlignedTranslationProps {
  targetText: string;
  translationText: string;
  targetLangCode: string;
  phonetic?: string;
  pronunciationAid?: string;
  tokenBreakdown?: Array<{ token: string; translatedToken: string }>;
  idPrefix?: string;
  onSpeak?: (text: string) => void;
  showAudioButton?: boolean;
  className?: string;
  targetClassName?: string;
  translationClassName?: string;
  size?: "sm" | "md" | "lg";
  layout?: "stacked" | "compact" | "card";
}

export const AlignedTranslation: React.FC<AlignedTranslationProps> = ({
  targetText,
  translationText,
  targetLangCode,
  phonetic,
  pronunciationAid,
  tokenBreakdown,
  idPrefix = "align",
  onSpeak,
  showAudioButton = true,
  className = "",
  targetClassName = "",
  translationClassName = "",
  size = "md",
  layout = "stacked",
}) => {
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [hoveredTranslationId, setHoveredTranslationId] = useState<string | null>(null);

  // Generate or retrieve cached alignment tokens
  const { targetTokens, translationTokens } = useMemo(() => {
    return getAlignedSentencePair(
      targetText || "",
      translationText || "",
      targetLangCode,
      idPrefix,
      tokenBreakdown
    );
  }, [targetText, translationText, targetLangCode, idPrefix, tokenBreakdown]);

  // Determine which target tokens are currently active/highlighted
  const activeTargetTokenIds = useMemo(() => {
    const active = new Set<string>();
    if (hoveredTargetId) {
      active.add(hoveredTargetId);
    }
    if (hoveredTranslationId) {
      const transToken = translationTokens.find((t) => t.id === hoveredTranslationId);
      if (transToken && transToken.alignedIds) {
        transToken.alignedIds.forEach((id) => active.add(id));
      }
    }
    return active;
  }, [hoveredTargetId, hoveredTranslationId, translationTokens]);

  // Determine which translation tokens are currently active/highlighted
  const activeTranslationTokenIds = useMemo(() => {
    const active = new Set<string>();
    if (hoveredTranslationId) {
      active.add(hoveredTranslationId);
    }
    if (hoveredTargetId) {
      const targetToken = targetTokens.find((t) => t.id === hoveredTargetId);
      if (targetToken && targetToken.alignedIds) {
        targetToken.alignedIds.forEach((id) => active.add(id));
      }
    }
    return active;
  }, [hoveredTargetId, hoveredTranslationId, targetTokens]);

  const hasActiveHighlight = activeTargetTokenIds.size > 0 || activeTranslationTokenIds.size > 0;

  // Pronunciation formatting: strictly suppressed if aidMode is 'none'
  const displayPhonetic = useMemo(() => {
    if (!phonetic || pronunciationAid === "none") {
      return null;
    }
    if (pronunciationAid) {
      return formatPronunciation(targetText, phonetic, targetLangCode, pronunciationAid);
    }
    return phonetic;
  }, [phonetic, pronunciationAid, targetText, targetLangCode]);

  // Font sizing maps
  const targetTextSize =
    size === "lg" ? "text-lg sm:text-xl font-black" : size === "sm" ? "text-xs font-bold" : "text-sm sm:text-base font-extrabold";
  const translationTextSize =
    size === "lg" ? "text-sm sm:text-base" : size === "sm" ? "text-[11px]" : "text-xs sm:text-sm";

  return (
    <div
      className={`group relative rounded-2xl transition-all duration-150 ${
        layout === "card"
          ? "p-4 bg-slate-50/80 border border-slate-200/90 hover:border-indigo-200 hover:bg-indigo-50/20"
          : "space-y-1.5"
      } ${className}`}
    >
      {/* Target Language Sentence */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div
            className={`text-slate-900 tracking-tight leading-relaxed select-text flex flex-wrap items-baseline ${
              isNonSpacedCJK(targetText, targetLangCode) ? "gap-x-0.5" : "gap-x-1.5 sm:gap-x-2"
            } ${targetTextSize} ${targetClassName}`}
          >
            {targetTokens.map((token) => {
              const isHighlighted = activeTargetTokenIds.has(token.id);

              if (token.isPunctuation) {
                const isOpeningPunct = /^[(«“‘¿¡\[{<]/.test(token.text);
                const isUnspaced = isNonSpacedCJK(targetText, targetLangCode);
                return (
                  <span
                    key={token.id}
                    className={`text-slate-400 select-none ${
                      isUnspaced ? "" : isOpeningPunct ? "mr-0" : "-ml-1 sm:-ml-1.5"
                    }`}
                  >
                    {token.text}
                  </span>
                );
              }

              return (
                <span
                  key={token.id}
                  onMouseEnter={() => setHoveredTargetId(token.id)}
                  onMouseLeave={() => setHoveredTargetId(null)}
                  className={`inline-block transition-all duration-100 rounded-md px-1 py-0.5 cursor-pointer ${
                    isHighlighted
                      ? "bg-indigo-600 text-white font-black shadow-xs ring-2 ring-indigo-400 scale-[1.02]"
                      : "hover:bg-indigo-100/80 hover:text-indigo-950"
                  }`}
                  title="Hover to view aligned translation"
                >
                  {token.text}
                </span>
              );
            })}
          </div>

          {/* Optional Phonetic Transcription (Only shown when pronunciationAid is enabled) */}
          {displayPhonetic && (
            <p className="text-xs font-serif text-indigo-700/80 mt-0.5 italic">
              {displayPhonetic}
            </p>
          )}
        </div>

        {/* Listen Audio Button */}
        {showAudioButton && onSpeak && (
          <button
            type="button"
            onClick={() => onSpeak(targetText)}
            className="p-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-slate-500 border border-slate-200 hover:border-indigo-600 shadow-2xs transition shrink-0 cursor-pointer"
            title="Listen to native pronunciation"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Translation Sentence with Aligned Tokens */}
      <div className="flex items-start gap-2 pt-0.5">
        <div
          className={`text-slate-600 font-medium leading-relaxed select-text flex flex-wrap items-baseline gap-x-1.5 ${translationTextSize} ${translationClassName}`}
        >
          {translationTokens.map((token) => {
            const isHighlighted = activeTranslationTokenIds.has(token.id);

            if (token.isPunctuation) {
              const isOpeningPunct = /^[(«“‘¿¡\[{<]/.test(token.text);
              return (
                <span
                  key={token.id}
                  className={`text-slate-400 select-none ${
                    isOpeningPunct ? "mr-0" : "-ml-1"
                  }`}
                >
                  {token.text}
                </span>
              );
            }

            return (
              <span
                key={token.id}
                onMouseEnter={() => setHoveredTranslationId(token.id)}
                onMouseLeave={() => setHoveredTranslationId(null)}
                className={`inline-block transition-all duration-100 rounded-md px-1 py-0.5 cursor-pointer ${
                  isHighlighted
                    ? "bg-indigo-100 text-indigo-950 font-bold ring-2 ring-indigo-400/80 shadow-2xs scale-[1.02]"
                    : "hover:bg-slate-200/80 hover:text-slate-900"
                }`}
                title="Hover to view aligned target words"
              >
                {token.text}
              </span>
            );
          })}
        </div>

        {/* Small subtle hover cue indicator */}
        {hasActiveHighlight && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/70 shrink-0 ml-auto animate-fade-in">
            <LinkIcon className="w-2.5 h-2.5" />
            <span>Aligned</span>
          </span>
        )}
      </div>
    </div>
  );
};
