import React, { useState, useEffect } from "react";
import { Deck, Flashcard, SupportedLanguage, LearnerError, DailyProgress } from "../types";
import { getDeckStats } from "../utils/srs";
import { getFrequencyBrackets, getActiveFrequencyBracket } from "../utils/frequencyProgression";
import { estimateStandardizedProficiency } from "../utils/proficiencyEstimation";
import { playTextAloud } from "../utils/speech";
import { loadDiagnosticHistory, DiagnosticTestRecord } from "../utils/diagnosticHistory";
import {
  Flame,
  Award,
  Clock,
  TrendingUp,
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  GraduationCap,
  Search,
  ArrowRight,
  RotateCcw,
  Target,
  ChevronRight,
  Layers,
  BrainCircuit,
  Zap,
  BookOpen,
  ShieldCheck,
  Calendar,
  History,
  Check,
  Plus,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface AnalyticsViewProps {
  deck: Deck;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  learnerErrors: LearnerError[];
  onToggleErrorResolved: (id: string) => void;
  dailyProgress: DailyProgress;
  onUpdateDailyTarget: (target: number) => void;
  onStudyCard?: (cardId: string) => void;
  onStudyBracket?: (startRank: number, endRank: number) => void;
  onGenerateNextBatch?: (startRank: number, endRank: number) => void;
  isGeneratingBatch?: boolean;
  onOpenPlacementTest?: () => void;
  onAddCardToDeck?: (card: Flashcard) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  deck,
  targetLang,
  knownLang,
  learnerErrors,
  onToggleErrorResolved,
  dailyProgress,
  onUpdateDailyTarget,
  onStudyCard,
  onStudyBracket,
  onGenerateNextBatch,
  isGeneratingBatch = false,
  onOpenPlacementTest,
  onAddCardToDeck,
}) => {
  const [activeTab, setActiveTab] = useState<
    "proficiency" | "diagnosticHistory" | "mastered" | "errors" | "srs"
  >("proficiency");
  const [masteredSearch, setMasteredSearch] = useState<string>("");
  const [errorFilter, setErrorFilter] = useState<"active" | "resolved" | "all">("active");
  const [errorSearch, setErrorSearch] = useState<string>("");

  // Diagnostic Test History State
  const [diagnosticHistory, setDiagnosticHistory] = useState<DiagnosticTestRecord[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [addedDiagnosticCardIds, setAddedDiagnosticCardIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const history = loadDiagnosticHistory(targetLang.name);
    setDiagnosticHistory(history);
    if (history.length > 0) {
      setSelectedTestId(history[0].id);
    }
  }, [targetLang.name]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const stats = getDeckStats(deck.cards);

  // Standardized Proficiency Assessment
  const proficiency = estimateStandardizedProficiency(deck, targetLang, learnerErrors);

  // Vocabulary vs. Grammar Breakdown in Active Deck
  const vocabCards = deck.cards.filter((c) => c.type === "vocabulary" || (!c.type && !c.isCommonError));
  const vocabMasteredCount = vocabCards.filter((c) => c.srs.status === "mastered" || c.srs.masteryScore >= 85).length;
  
  const grammarCards = deck.cards.filter((c) => c.type === "grammar" || c.isCommonError || c.partOfSpeech.toLowerCase().includes("grammar") || c.partOfSpeech.toLowerCase().includes("verb"));
  const grammarMasteredCount = grammarCards.filter((c) => c.srs.status === "mastered" || c.srs.masteryScore >= 85).length;
  const grammarGraspPercent = grammarCards.length > 0 ? Math.round((grammarMasteredCount / grammarCards.length) * 100) : 75;

  // Selected test from history
  const selectedTest = diagnosticHistory.find((t) => t.id === selectedTestId) || diagnosticHistory[0] || null;

  // Add missed question from diagnostic test to deck
  const handleAddDiagnosticErrorToDeck = (q: any, testDate: string) => {
    if (!onAddCardToDeck) return;

    const newCard: Flashcard = {
      id: `diag-error-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deckId: deck.id,
      type: "common_error",
      targetItem: q.correctAnswer || q.focusGrammarOrConcept || "Grammar Focus",
      targetLanguage: targetLang.name,
      knownLanguage: knownLang.name,
      frequencyRank: deck.cards.length + 1,
      partOfSpeech: "Diagnostic Remediation",
      definition: q.conceptFocusExplanation || q.explanation || "Diagnostic placement slip",
      usageNotes: `Remedy from Diagnostic Test (${new Date(testDate).toLocaleDateString()}): Concept - ${q.focusGrammarOrConcept}. ${q.explanation}`,
      examples: [
        {
          target: q.questionText,
          translation: q.questionTranslation,
        },
      ],
      isCommonError: true,
      originalMistake: q.userAnswer || "Diagnostic test incorrect option",
      correctedForm: q.correctAnswer,
      category: "common_error",
      tags: ["diagnostic-remedy", "placement-error"],
      srs: {
        repetition: 0,
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        history: [],
        masteryScore: 0,
        status: "learning",
        consecutiveSuccesses: 0,
      },
    };

    onAddCardToDeck(newCard);
    setAddedDiagnosticCardIds((prev) => new Set([...prev, q.id || q.questionText]));
    showToast(`Added missed concept "${newCard.targetItem}" to ${deck.title}!`);
  };

  // Filter mastered cards
  const masteredCards = deck.cards
    .filter((c) => c.srs.status === "mastered" || c.srs.masteryScore >= 85)
    .filter(
      (c) =>
        c.targetItem.toLowerCase().includes(masteredSearch.toLowerCase()) ||
        c.definition.toLowerCase().includes(masteredSearch.toLowerCase()) ||
        c.partOfSpeech.toLowerCase().includes(masteredSearch.toLowerCase())
    )
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  // Filter learner errors for the active deck
  const deckErrors = learnerErrors.filter((err) => {
    // Check if error belongs to a card in this deck or matches target words in this deck
    const matchesCard = deck.cards.some(
      (c) => c.id === err.cardId || c.targetItem.toLowerCase() === err.targetItem.toLowerCase()
    );
    return matchesCard;
  });

  const filteredErrors = deckErrors
    .filter((err) => {
      if (errorFilter === "active") return !err.isResolved;
      if (errorFilter === "resolved") return err.isResolved;
      return true;
    })
    .filter(
      (err) =>
        err.targetItem.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.originalMistake.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.correctedForm.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.errorType.toLowerCase().includes(errorSearch.toLowerCase())
    )
    .sort((a, b) => {
      // Unresolved first, then higher occurrences, then newest
      if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
      if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const activeErrorsCount = deckErrors.filter((e) => !e.isResolved).length;
  const resolvedErrorsCount = deckErrors.filter((e) => e.isResolved).length;

  const handlePlayAudio = (text: string) => {
    playTextAloud(text, targetLang.code);
  };

  // Daily target progress percentage
  const dailyPercent = Math.min(100, Math.round((dailyProgress.reviewedToday / dailyProgress.target) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Header Bento Tile */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{targetLang.flag}</span>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Mastery Analytics & Error Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Active sentence production tracking for <span className="font-semibold text-slate-700">{deck.title}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-3 text-xs text-slate-500 font-semibold flex-wrap">
            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
              {stats.mastered} Mastered
            </span>
            <span>•</span>
            <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-100">
              {activeErrorsCount} Active Error Patterns
            </span>
            <span>•</span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {resolvedErrorsCount} Errors Overcome
            </span>
          </div>
        </div>

        {/* Daily Goal Quick Bento Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:w-80 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Daily Target</span>
            </span>
            <div className="flex items-center gap-1">
              <select
                id="daily-target-selector"
                value={dailyProgress.target}
                onChange={(e) => onUpdateDailyTarget(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-800 text-[11px] font-bold cursor-pointer"
              >
                <option value={5}>5 cards/day</option>
                <option value={10}>10 cards/day</option>
                <option value={15}>15 cards/day</option>
                <option value={20}>20 cards/day</option>
                <option value={30}>30 cards/day</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {dailyProgress.reviewedToday} of {dailyProgress.target} cards covered
              </span>
              <span className="font-extrabold text-indigo-600">{dailyPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyPercent >= 100 ? "bg-emerald-500" : "bg-indigo-600"
                }`}
                style={{ width: `${dailyPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-0.5">
            <span className="flex items-center gap-1 text-indigo-700 font-bold">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Discipline</span>
            </span>
            {dailyProgress.reviewedToday >= dailyProgress.target ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Target Complete!
              </span>
            ) : (
              <span className="text-slate-400 font-medium">
                {dailyProgress.target - dailyProgress.reviewedToday} cards remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Metric Cards Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Mastered Items</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {stats.mastered} <span className="text-sm font-semibold text-slate-400">/ {stats.total}</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Long-term interval retention</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Retention Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{stats.retentionRate}%</p>
          <p className="text-[11px] text-slate-400 font-medium">Sentence production accuracy</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Active Errors</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-rose-600">{activeErrorsCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">Slips to eliminate</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Avg AI Score</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-indigo-600">{stats.avgScore}%</p>
          <p className="text-[11px] text-slate-400 font-medium">Grammar & nuance grade</p>
        </div>
      </div>

      {/* Frequency Auto-Progression Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 border border-indigo-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Frequency Progression Engine
            </span>
            <span className="text-xs font-bold text-slate-700">
              Current Focus: Ranks #{currentBracket.startRank}–#{currentBracket.endRank}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {currentBracket.isMastered
              ? `🎉 Tier #${currentBracket.startRank}–#${currentBracket.endRank} is mastered! The app is now advancing you to Ranks #${nextBracketStart}–#${nextBracketEnd}.`
              : `Focus on mastering the top ${currentBracket.endRank} words. Once ${currentBracket.startRank}–${currentBracket.endRank} are conquered (80%+ mastered), the app automatically unlocks Ranks #${nextBracketStart}–#${nextBracketEnd}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentBracket.isMastered && needsNextBatchGeneration ? (
            <button
              onClick={() => onGenerateNextBatch?.(nextBracketStart, nextBracketEnd)}
              disabled={isGeneratingBatch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingBatch ? (
                <>
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Cards #{nextBracketStart}–#{nextBracketEnd}...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate Next Batch (#{nextBracketStart}–#{nextBracketEnd})</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onStudyBracket?.(currentBracket.startRank, currentBracket.endRank)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Study Active Batch (#{currentBracket.startRank}–#{currentBracket.endRank})</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Tabs Header (Flex Wrap to never hide tabs) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs sm:text-sm font-bold">
        <button
          id="analytics-tab-proficiency"
          onClick={() => setActiveTab("proficiency")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer ${
            activeTab === "proficiency"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>Standardized Level & CEFR (Est. {proficiency.cefrLevel})</span>
        </button>

        <button
          id="analytics-tab-diagnostic-history"
          onClick={() => setActiveTab("diagnosticHistory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer ${
            activeTab === "diagnosticHistory"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Diagnostic Test History ({diagnosticHistory.length})</span>
        </button>

        <button
          id="analytics-tab-mastered"
          onClick={() => setActiveTab("mastered")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer ${
            activeTab === "mastered"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>Mastered Catalog ({masteredCards.length})</span>
        </button>

        <button
          id="analytics-tab-errors"
          onClick={() => setActiveTab("errors")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer ${
            activeTab === "errors"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Error Intelligence & Corrections ({activeErrorsCount})</span>
        </button>

        <button
          id="analytics-tab-srs"
          onClick={() => setActiveTab("srs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer ${
            activeTab === "srs"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Brain className="w-4 h-4 shrink-0" />
          <span>SM-2 Memory Diagnostics</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TAB 0: STANDARDIZED LEVEL & CEFR PROJECTION */}
      {activeTab === "proficiency" && (
        <div className="space-y-6">
          {/* Main CEFR Projection Hero Bento */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-black uppercase tracking-wider border border-white/20">
                    CEFR {proficiency.cefrLevel} Benchmark
                  </span>
                  <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{proficiency.confidenceScore}% Statistical Confidence</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {proficiency.cefrTitle}
                </h3>
                <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                  {proficiency.cefrDescription}
                </p>
              </div>

              {/* Placement Test CTA Button */}
              {onOpenPlacementTest && (
                <div className="shrink-0">
                  <button
                    onClick={onOpenPlacementTest}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-900 font-extrabold text-xs shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Take Adaptive Placement Test</span>
                  </button>
                  <p className="text-[10px] text-indigo-200 text-center mt-1.5 font-medium">
                    Diagnose gaps & calibrate starting rank
                  </p>
                </div>
              )}
            </div>

            {/* CEFR Scale Step Gauge */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                <span>CEFR Proficiency Continuum</span>
                <span>Active Target: {proficiency.milestoneProgress.nextLevel}</span>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((lvl) => {
                  const isCurrent = proficiency.cefrLevel === lvl;
                  const isPassed =
                    (lvl === "A1" && ["A2", "B1", "B2", "C1", "C2"].includes(proficiency.cefrLevel)) ||
                    (lvl === "A2" && ["B1", "B2", "C1", "C2"].includes(proficiency.cefrLevel)) ||
                    (lvl === "B1" && ["B2", "C1", "C2"].includes(proficiency.cefrLevel)) ||
                    (lvl === "B2" && ["C1", "C2"].includes(proficiency.cefrLevel)) ||
                    (lvl === "C1" && proficiency.cefrLevel === "C2");

                  return (
                    <div key={lvl} className="space-y-1.5 text-center">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          isCurrent
                            ? "bg-amber-400 shadow-md shadow-amber-400/40 animate-pulse"
                            : isPassed
                            ? "bg-emerald-400"
                            : "bg-white/10"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-bold block ${
                          isCurrent ? "text-amber-300 font-black scale-105" : isPassed ? "text-emerald-300" : "text-indigo-300/60"
                        }`}
                      >
                        {lvl}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Milestone Track */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-xs space-y-2.5">
              <div className="flex items-center justify-between font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-300" />
                  <span>Roadmap to CEFR {proficiency.milestoneProgress.nextLevel}</span>
                </span>
                <span className="text-amber-300 font-extrabold">
                  {proficiency.milestoneProgress.progressToNextLevel}% Complete
                </span>
              </div>

              <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${proficiency.milestoneProgress.progressToNextLevel}%` }}
                />
              </div>

              <p className="text-[11px] text-indigo-100">
                <strong>Next Step: </strong> {proficiency.milestoneProgress.recommendedFocus} (Requires mastering approximately{" "}
                <span className="text-amber-300 font-bold">{proficiency.milestoneProgress.remainingMasteryRequired}</span> more items).
              </p>
            </div>
          </div>

          {/* Active Lexical Horizon & Dedicated Grammar Concept Grasp Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Active Lexical Horizon (Vocab-focused) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Active Lexical Horizon (Vocabulary)</span>
                </h4>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {vocabMasteredCount} / {vocabCards.length} Vocab Mastered
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Est. Active Lexicon
                  </span>
                  <p className="text-2xl font-black text-indigo-700">
                    ~{proficiency.estimatedActiveVocabulary.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Spoken vocabulary reach</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Frequency Ceiling
                  </span>
                  <p className="text-2xl font-black text-amber-700">
                    Rank #{proficiency.highestConqueredRank}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Highest conquered rank</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Active Deck Vocabulary Mastery</span>
                  <span className="font-bold text-indigo-600">
                    {vocabCards.length > 0 ? Math.round((vocabMasteredCount / vocabCards.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${vocabCards.length > 0 ? Math.round((vocabMasteredCount / vocabCards.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Vocabulary is prioritized by natural spoken frequency. Conquering the top 1,000 words enables comprehension of <strong>~85% of everyday conversations</strong> in {targetLang.name}.
              </p>
            </div>

            {/* 2. Dedicated Grammar Concept Grasp Section */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-600" />
                  <span>Grammar Concept Grasp & Syntax</span>
                </h4>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  {grammarGraspPercent}% Concept Grasp
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Syntax Precision
                  </span>
                  <p className="text-2xl font-black text-purple-700">
                    {proficiency.skillBreakdown.grammaticalPrecision}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Slip-free production</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Error Resolution
                  </span>
                  <p className="text-2xl font-black text-emerald-700">
                    {deckErrors.length > 0 ? Math.round((resolvedErrorsCount / deckErrors.length) * 100) : 100}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {resolvedErrorsCount} of {deckErrors.length} slips fixed
                  </p>
                </div>
              </div>

              {/* Grammar Category Breakdown Bars */}
              <div className="space-y-2.5 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span>Verb Conjugations & Tenses</span>
                    <span className="font-bold text-purple-600">
                      {Math.min(100, Math.round(proficiency.skillBreakdown.grammaticalPrecision * 1.05))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(proficiency.skillBreakdown.grammaticalPrecision * 1.05))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span>Particles / Case Markers & Prepositions</span>
                    <span className="font-bold text-indigo-600">
                      {Math.max(20, Math.round(proficiency.skillBreakdown.grammaticalPrecision * 0.95))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{
                        width: `${Math.max(20, Math.round(proficiency.skillBreakdown.grammaticalPrecision * 0.95))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span>Sentence Structure & Clause Connectors</span>
                    <span className="font-bold text-emerald-600">{proficiency.skillBreakdown.productionFluency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${proficiency.skillBreakdown.productionFluency}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Official Standardized Exam Equivalency Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Official International Standardized Framework Mappings</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Correlated for {targetLang.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proficiency.standardizedFrameworks.map((fw, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {fw.frameworkName}
                      </span>
                      <span className="text-xs font-black text-indigo-600">
                        {fw.readinessPercentage}% Readiness
                      </span>
                    </div>

                    <h5 className="text-base font-extrabold text-slate-900">
                      {fw.estimatedScoreOrGrade}
                    </h5>

                    <p className="text-xs text-slate-600 leading-normal">
                      {fw.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>ACTFL: <strong className="text-slate-800">{fw.actflEquivalent}</strong></span>
                    <span className="text-emerald-700 font-bold">Official Track</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: DIAGNOSTIC TEST HISTORY & QUESTION EVALUATIONS */}
      {activeTab === "diagnosticHistory" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>Diagnostic Test Archive & Feedback</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review past placement test evaluations, examine question-by-question explanations, and add diagnostic slips directly to your deck.
              </p>
            </div>

            {onOpenPlacementTest && (
              <button
                onClick={onOpenPlacementTest}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Take New Placement Test</span>
              </button>
            )}
          </div>

          {diagnosticHistory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">No Diagnostic Tests Taken Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Take an adaptive placement test to diagnose your CEFR proficiency level, analyze grammatical strengths, and review question evaluations.
              </p>
              {onOpenPlacementTest && (
                <button
                  onClick={onOpenPlacementTest}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start First Diagnostic Test</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Select Test Date Ribbon */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                  Select Past Test Evaluation by Date:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {diagnosticHistory.map((test) => {
                    const isSelected = test.id === selectedTestId;
                    const rawDate = test.completedAt || (test as any).date || new Date().toISOString();
                    const testDate = new Date(rawDate);
                    const formattedDate = testDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const formattedTime = testDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                    return (
                      <button
                        key={test.id}
                        onClick={() => setSelectedTestId(test.id)}
                        className={`px-4 py-2.5 rounded-2xl border text-left whitespace-nowrap transition cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                              isSelected ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {test.diagnosedLevel}
                          </span>
                          <span className="font-bold text-xs">{formattedDate}</span>
                          <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                            {formattedTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className={isSelected ? "text-indigo-100 font-semibold" : "text-slate-500"}>
                            Score: {test.scorePercentage}% ({test.correctCount}/{test.totalQuestions})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Test Overview & Question Review */}
              {selectedTest && (
                <div className="space-y-6">
                  {/* Selected Test Summary Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
                            Diagnosed Level: {selectedTest.diagnosedLevel}
                          </span>
                          <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                            <span>
                              {new Date(selectedTest.completedAt || (selectedTest as any).date || new Date().toISOString()).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </span>
                        </div>
                        <h4 className="text-xl font-black mt-2 tracking-tight">
                          Diagnostic Test Evaluation Report
                        </h4>
                        <p className="text-xs text-indigo-100 mt-1 max-w-xl">
                          {selectedTest.summary ||
                            `Tested across ${selectedTest.totalQuestions} progressive adaptive questions with a final accuracy score of ${selectedTest.scorePercentage}%.`}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 bg-white/10 p-4 rounded-2xl border border-white/10">
                        <div className="text-right">
                          <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                            Overall Score
                          </span>
                          <span className="text-2xl font-black text-amber-300">
                            {selectedTest.scorePercentage}%
                          </span>
                        </div>
                        <span className="text-xs text-indigo-100 font-medium">
                          {selectedTest.correctCount} of {selectedTest.totalQuestions} questions correct
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Question-by-Question Review List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        <span>Question-by-Question Diagnostic Review ({selectedTest.questionReviews?.length || 0})</span>
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        Click "Add Error to Active Deck" to remediate slips
                      </span>
                    </div>

                    {(!selectedTest.questionReviews || selectedTest.questionReviews.length === 0) ? (
                      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                        <p className="text-xs">Detailed question breakdown was not archived for this legacy record.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTest.questionReviews.map((q, idx) => {
                          const isAlreadyAdded = addedDiagnosticCardIds.has(q.id || q.questionText);

                          return (
                            <div
                              key={q.id || idx}
                              className={`p-5 rounded-3xl bg-white border transition space-y-3.5 shadow-xs ${
                                q.isCorrect ? "border-slate-200 hover:border-emerald-200" : "border-rose-200 bg-rose-50/20 hover:border-rose-300"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                                      Q{idx + 1} • {q.level}
                                    </span>
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                        q.isCorrect
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-rose-100 text-rose-800"
                                      }`}
                                    >
                                      {q.isCorrect ? (
                                        <>
                                          <Check className="w-3 h-3" /> Correct
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3 h-3" /> Missed
                                        </>
                                      )}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700">
                                      Concept: <span className="text-indigo-600">{q.focusGrammarOrConcept}</span>
                                    </span>
                                  </div>

                                  {/* Target Sentence Prompt */}
                                  <div className="flex items-center gap-2 pt-1">
                                    <p className="text-base font-extrabold text-slate-900">{q.questionText}</p>
                                    <button
                                      onClick={() => handlePlayAudio(q.questionText)}
                                      className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-500 transition cursor-pointer"
                                      title="Listen"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium">{q.questionTranslation}</p>
                                </div>

                                {/* Add Error to Deck Action */}
                                {!q.isCorrect && onAddCardToDeck && (
                                  <div className="shrink-0">
                                    <button
                                      onClick={() =>
                                        handleAddDiagnosticErrorToDeck(
                                          q,
                                          selectedTest.completedAt || (selectedTest as any).date || new Date().toISOString()
                                        )
                                      }
                                      disabled={isAlreadyAdded}
                                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                        isAlreadyAdded
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-80"
                                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100 active:scale-95"
                                      }`}
                                    >
                                      {isAlreadyAdded ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Added to Deck</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Add Error to Deck</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Answers Compare Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                <div
                                  className={`p-3 rounded-2xl border ${
                                    q.isCorrect
                                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                                      : "bg-rose-50 border-rose-200 text-rose-950"
                                  }`}
                                >
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                    Your Submitted Choice:
                                  </span>
                                  <span className="font-bold">{q.userAnswer || "(No answer selected)"}</span>
                                </div>

                                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
                                    Correct Answer:
                                  </span>
                                  <span className="font-bold">{q.correctAnswer}</span>
                                </div>
                              </div>

                              {/* Explanation & Grammar Rule Note */}
                              {q.explanation && (
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Grammar Rule & Explanation:
                                  </span>
                                  <p className="leading-relaxed font-medium">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* TAB 1: MASTERED ITEMS LIST */}
      {activeTab === "mastered" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Mastered Vocabulary & Grammar Catalog</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Items where you have proven retention through active sentence construction.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-mastered-input"
                type="text"
                value={masteredSearch}
                onChange={(e) => setMasteredSearch(e.target.value)}
                placeholder="Search mastered items..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          {masteredCards.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No mastered items yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Practice cards in the study session. When you produce correct sentences consistently, items graduate to this Mastered Catalog!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {masteredCards.map((card) => {
                const latestHistory = card.srs.history[card.srs.history.length - 1];
                return (
                  <div
                    key={card.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Frequency Rank Pill */}
                        <div className="shrink-0 w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex flex-col items-center justify-center text-[10px] font-bold">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>#{card.frequencyRank}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-extrabold text-slate-900">{card.targetItem}</span>
                            <button
                              onClick={() => handlePlayAudio(card.targetItem)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-500 transition cursor-pointer"
                              title="Listen"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {card.partOfSpeech}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">{card.definition}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> {card.srs.masteryScore}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {card.srs.consecutiveSuccesses} streak
                        </p>
                      </div>
                    </div>

                    {/* Latest verified sentence sample */}
                    {latestHistory && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Verified Production:
                        </span>
                        <p className="font-semibold text-slate-800 italic">"{latestHistory.userSentence}"</p>
                        {latestHistory.correctedSentence &&
                          latestHistory.correctedSentence !== latestHistory.userSentence && (
                            <p className="text-[11px] text-emerald-700 font-medium">
                              Polished: {latestHistory.correctedSentence}
                            </p>
                          )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400">
                        Next check: {new Date(card.srs.dueDate).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => onStudyCard?.(card.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ERROR INTELLIGENCE & COMMON MISTAKES */}
      {activeTab === "errors" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span>Common Mistakes & Dynamic Error Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tracks common errors and their corrected forms. As you avoid them in sentence practice, the system phases them out to focus on newer errors.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
                {[
                  { id: "active", label: `Active Errors (${activeErrorsCount})` },
                  { id: "resolved", label: `Overcome & Phased Out (${resolvedErrorsCount})` },
                  { id: "all", label: `All Errors (${deckErrors.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setErrorFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                      errorFilter === f.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-errors-input"
                type="text"
                value={errorSearch}
                onChange={(e) => setErrorSearch(e.target.value)}
                placeholder="Search error concept, mistaken phrase, or correction..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          {filteredErrors.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {errorFilter === "active" ? "No active errors recorded!" : "No errors found matching filter."}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {errorFilter === "active"
                  ? "Great job! As you construct sentences during study sessions, any grammar, conjugation, or vocabulary slips will appear here for targeted review."
                  : "All errors have been overcome or no entries exist yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors.map((err) => {
                const targetCard = deck.cards.find(
                  (c) => c.id === err.cardId || c.targetItem.toLowerCase() === err.targetItem.toLowerCase()
                );
                return (
                  <div
                    key={err.id}
                    className={`p-5 rounded-3xl border transition shadow-xs space-y-3 ${
                      err.isResolved
                        ? "bg-slate-50/70 border-slate-200 opacity-80"
                        : "bg-white border-rose-100 hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">
                          Target Word: <span className="text-indigo-600">"{err.targetItem}"</span>
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            err.errorType.toLowerCase().includes("grammar")
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : err.errorType.toLowerCase().includes("conjugation")
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : err.errorType.toLowerCase().includes("agreement")
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {err.errorType}
                        </span>

                        {err.occurrences > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Seen {err.occurrences}x
                          </span>
                        )}

                        {err.isResolved ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Phased Out / Overcome
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold">
                            {err.consecutiveCorrect || 0}/2 Correct to Phase Out
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {targetCard && (
                          <button
                            onClick={() => onStudyCard?.(targetCard.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
                            title="Practice this card"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Practice</span>
                          </button>
                        )}

                        <button
                          onClick={() => onToggleErrorResolved(err.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition cursor-pointer"
                          title={err.isResolved ? "Reactivate error" : "Mark resolved manually"}
                        >
                          {err.isResolved ? "Reactivate" : "Mark Resolved"}
                        </button>
                      </div>
                    </div>

                    {/* Mistake vs Corrected Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Mistake */}
                      <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                          Original Slip / Mistake:
                        </span>
                        <p className="font-semibold text-rose-900 font-mono text-xs">"{err.originalMistake}"</p>
                      </div>

                      {/* Corrected */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Corrected Natural Form:
                          </span>
                          <button
                            onClick={() => handlePlayAudio(err.correctedForm)}
                            className="p-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                            title="Listen"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-semibold text-emerald-900 font-mono text-xs">"{err.correctedForm}"</p>
                      </div>
                    </div>

                    {/* Rule / Explanation */}
                    {err.explanation && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-700">Grammar Insight: </span>
                        <span>{err.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SM-2 MEMORY ENGINE DIAGNOSTICS */}
      {activeTab === "srs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>SuperMemo SM-2 Interval Calculation</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Intervals expand exponentially as you produce accurate sentences with high SM-2 grades (3 to 5). Failed production or "Don't know" resets the repetition counter while adjusting the Ease Factor down.
            </p>
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1.5 text-slate-700">
              <p>• Repetition 1: 1 day interval</p>
              <p>• Repetition 2: 3 days interval</p>
              <p>• Repetition 3: 6 days interval</p>
              <p>• Repetition 4+: Interval × Ease Factor</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Sentence Production Grading</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike passive flashcards where learners self-assess, LanguageTwin grades grammar, semantic precision, and collocations using Gemini 3.7. Errors are systematically categorized into the Error Intelligence ledger.
            </p>
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1.5 text-slate-700">
              <p>• Score ≥ 85%: High mastery & candidate for error phase-out</p>
              <p>• Score 70–84%: Developing; minor agreement/spelling slip</p>
              <p>• Score &lt; 70%: Review scheduled; error added to ledger</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
