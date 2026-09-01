import React from "react";
import { Sparkles, Cpu, Info } from "lucide-react";

interface AiEngineBadgeProps {
  isFallback?: boolean;
  engineSource?: "gemini" | "fallback" | string;
  modelUsed?: string;
  className?: string;
  compact?: boolean;
}

export const AiEngineBadge: React.FC<AiEngineBadgeProps> = ({
  isFallback,
  engineSource,
  modelUsed,
  className = "",
  compact = false,
}) => {
  const isFallbackEngine = isFallback === true || engineSource === "fallback" || modelUsed === "deterministic-rules";

  if (isFallbackEngine) {
    return (
      <div
        id="engine-badge-fallback"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs transition-colors ${className}`}
        title="Offline resilience engine: Generated instantly via deterministic linguistic rules and frequency tables (zero API latency or downtime)."
      >
        <Cpu className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{compact ? "Fallback Engine" : "Deterministic Fallback Engine"}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 font-mono"
        >
          Rules
        </span>
      </div>
    );
  }

  const displayModel = modelUsed || "gemini-3.7-flash";

  return (
    <div
      id="engine-badge-llm"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs transition-colors ${className}`}
      title={`Live Generative AI active: Response generated using Google Gemini (${displayModel}).`}
    >
      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>{compact ? "Gemini AI" : "Gemini LLM Active"}</span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200 font-mono"
      >
        {displayModel.replace("gemini-", "v")}
      </span>
    </div>
  );
};
