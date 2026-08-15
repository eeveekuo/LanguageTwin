import React, { useState, useEffect, useRef } from "react";
import { Flashcard, SupportedLanguage, EvaluationResult, CardExplanation, DailyProgress, LearnerError } from "../types";
import { calculateNextSRS } from "../utils/srs";
import { playTextAloud, stopSpeech, isSpeechRecognitionSupported, createSpeechRecognizer } from "../utils/speech";
import { getActiveFrequencyBracket } from "../utils/frequencyProgression";
import { ConjugationLookup } from "./ConjugationLookup";
import { IS_CONJUGATION_LANGUAGE } from "../data/conjugations";
import confetti from "canvas-confetti";
import {
  Volume2,
  Mic,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Lightbulb,
  Check,
  Flame,
  Clock,
  TrendingUp,
  Award,
  Target,
  AlertTriangle,
  Zap,
  BrainCircuit,
  Layers,
  Eye,
  EyeOff,
  Shuffle,
  Lock,
  Unlock,
  WifiOff,
  Table,
} from "lucide-react";

interface StudySessionProps {
  cards: Flashcard[];
  allDeckCards?: Flashcard[];
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  deckTitle: string;
  dailyProgress: DailyProgress;
  learnerErrors?: LearnerError[];
  onCardUpdated: (updatedCard: Flashcard) => void;
  onSentenceEvaluated?: (card: Flashcard, evaluation: EvaluationResult, userSentence: string) => void;
  onFinishSession?: () => void;
  onUnlockNextBatch?: (startRank: number, endRank: number) => void;
  isGeneratingBatch?: boolean;
  isOnline?: boolean;
}

export const StudySession: React.FC<StudySessionProps> = ({
  cards,
  allDeckCards = [],
  targetLang,
  knownLang,
  deckTitle,
  dailyProgress,
  learnerErrors = [],
  onCardUpdated,
  onSentenceEvaluated,
  onFinishSession,
  onUnlockNextBatch,
  isGeneratingBatch = false,
  isOnline = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userSentence, setUserSentence] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [overcomeCelebration, setOvercomeCelebration] = useState<string | null>(null);

  // Active recall mode: "target_word" shows word, "recall_from_meaning" shows translation/meaning
  const [promptMode, setPromptMode] = useState<"target_word" | "recall_from_meaning">("target_word");
  const [showRecallHint, setShowRecallHint] = useState<boolean>(false);

  // Reveal-on-demand state: initially false (definition, usage format & examples are hidden until requested or evaluated)
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Audio playing state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // "I Don't Know This" / Help state
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  const [explanationData, setExplanationData] = useState<CardExplanation | null>(null);
  const [showConjugationLookup, setShowConjugationLookup] = useState<boolean>(false);

  // Session stats
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [sessionScoreHistory, setSessionScoreHistory] = useState<number[]>([]);
  const [nextDueNotice, setNextDueNotice] = useState<string>("");

  const activeCard: Flashcard | undefined = cards[currentIndex];
  const isConjugationLang = IS_CONJUGATION_LANGUAGE[targetLang.code] ?? false;

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Reset states when changing card
  useEffect(() => {
    setUserSentence("");
    setEvaluation(null);
    setIsRevealed(false);
    setShowRecallHint(false);
    setExplanationData(null);
    setErrorMsg(null);
    setNextDueNotice("");
    setOvercomeCelebration(null);
    setShowConjugationLookup(false);
    stopSpeech();
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    // Pure random challenge mode per card (50% Meaning Recall, 50% Word Display)
    if (activeCard) {
      setPromptMode(Math.random() < 0.5 ? "recall_from_meaning" : "target_word");
    }
  }, [currentIndex, activeCard?.id]);

  const handlePlayAudio = (text: string, id: string) => {
    if (playingAudioId === id) {
      stopSpeech();
      setPlayingAudioId(null);
      return;
    }
    setPlayingAudioId(id);
    playTextAloud(
      text,
      targetLang.code,
      () => setPlayingAudioId(id),
      () => setPlayingAudioId(null),
      () => setPlayingAudioId(null)
    );
  };

  // Toggle Voice Input
  const toggleRecording = () => {
    if (!speechSupported) {
      setErrorMsg("Voice speech recognition is not supported in this browser. Please type your sentence.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setErrorMsg(null);
      const recognizer = createSpeechRecognizer(targetLang.code, {
        onStart: () => setIsRecording(true),
        onResult: (transcript) => {
          setUserSentence(transcript);
        },
        onError: (err) => {
          setErrorMsg(err);
          setIsRecording(false);
        },
        onEnd: () => setIsRecording(false),
      });

      if (recognizer) {
        recognitionRef.current = recognizer;
        try {
          recognizer.start();
        } catch (e) {
          console.warn("Speech recognizer start error:", e);
        }
      }
    }
  };

  // Self-Reported Mastery Rating (SM-2 based: 1=Again, 2=Hard, 4=Good, 5=Easy)
  const handleSelfReportRating = (grade: number, score: number, label: string) => {
    if (!activeCard) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const masteryLevel: "mastered" | "good" | "developing" | "incorrect" =
      score >= 90 ? "mastered" : score >= 75 ? "good" : score >= 50 ? "developing" : "incorrect";
    const feedbackSummary = `Self-reported mastery: ${label} (${score}%)`;

    // Check if this resolved an existing error
    const hadPreviousError = learnerErrors.some(
      (e) =>
        !e.isResolved &&
        (e.targetItem.toLowerCase() === activeCard.targetItem.toLowerCase() ||
          e.cardId === activeCard.id ||
          e.id === activeCard.errorId)
    );

    if (score >= 80) {
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.65 },
      });

      if (hadPreviousError) {
        setOvercomeCelebration(
          `🎉 Previous mistake avoided! You self-reported solid mastery on "${activeCard.targetItem}".`
        );
      }
    }

    const defaultExample = activeCard.examples?.[0];

    // Update Spaced Repetition SRS parameters
    const { updatedSRS, nextDueDateDisplay } = calculateNextSRS(
      activeCard.srs,
      grade,
      score,
      masteryLevel,
      userSentence.trim() || activeCard.targetItem,
      feedbackSummary,
      defaultExample?.target || activeCard.targetItem,
      isRecording ? "spoken" : "typed"
    );

    setNextDueNotice(nextDueDateDisplay);

    const updatedCard: Flashcard = {
      ...activeCard,
      srs: updatedSRS,
    };

    onCardUpdated(updatedCard);

    // Build structured synthetic evaluation
    const syntheticEval: EvaluationResult = {
      score,
      grade,
      masteryLevel,
      isTargetUsed: true,
      isGrammaticallyCorrect: grade >= 3,
      feedbackSummary,
      correctedSentence: defaultExample?.target || activeCard.targetItem,
      correctedSentenceTranslation: defaultExample?.translation || activeCard.definition,
      detailedExplanation: `Self-reported score of ${score}% recorded to SRS schedule.`,
      breakdown: [
        {
          type: grade >= 3 ? "positive" : "grammar",
          message: `Self-reported mastery: ${label}`,
        },
      ],
      naturalAlternatives: [],
      identifiedErrors: [],
    };

    setEvaluation(syntheticEval);
    setIsRevealed(true);
    setSessionScoreHistory((prev) => [...prev, score]);

    // Notify parent to record daily cards reviewed and sync IndexedDB
    onSentenceEvaluated?.(
      updatedCard,
      syntheticEval,
      userSentence.trim() || `[Self-Report: ${label}]`
    );
  };

  // Submit User Sentence for AI Evaluation
  const handleEvaluateSentence = async () => {
    if (!activeCard || !userSentence.trim()) {
      setErrorMsg("Please write or speak a sentence first.");
      return;
    }

    if (!isOnline) {
      // Offline fallback: prompt self-reporting
      setIsRevealed(true);
      setErrorMsg("Offline Mode: AI server is currently offline. Please rate your mastery using the self-report buttons below.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/evaluate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetItem: activeCard.targetItem,
          cardType: activeCard.type,
          partOfSpeech: activeCard.partOfSpeech,
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          definition: activeCard.definition,
          userSentence: userSentence.trim(),
          inputMethod: isRecording ? "spoken" : "typed",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result: EvaluationResult = await response.json();
      setEvaluation(result);
      setIsRevealed(true); // Automatically reveal full references upon evaluation
      setSessionScoreHistory((prev) => [...prev, result.score]);

      // Check if this resolved an existing error
      const hadPreviousError = learnerErrors.some(
        (e) =>
          !e.isResolved &&
          (e.targetItem.toLowerCase() === activeCard.targetItem.toLowerCase() ||
            e.cardId === activeCard.id ||
            e.id === activeCard.errorId)
      );

      if (result.score >= 85) {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.65 },
        });

        if (hadPreviousError) {
          setOvercomeCelebration(`🎉 Previous mistake avoided! You successfully overcame an error on "${activeCard.targetItem}".`);
        }
      }

      // Update Spaced Repetition SRS parameters
      const { updatedSRS, nextDueDateDisplay } = calculateNextSRS(
        activeCard.srs,
        result.grade,
        result.score,
        result.masteryLevel,
        userSentence.trim(),
        result.feedbackSummary,
        result.correctedSentence,
        isRecording ? "spoken" : "typed"
      );

      setNextDueNotice(nextDueDateDisplay);

      const updatedCard: Flashcard = {
        ...activeCard,
        srs: updatedSRS,
      };

      onCardUpdated(updatedCard);

      // Notify parent of evaluation to update error ledger and daily goals
      onSentenceEvaluated?.(activeCard, result, userSentence.trim());
    } catch (err: any) {
      console.error("Evaluation failed:", err);
      setErrorMsg("Failed to evaluate sentence with AI. You can still self-rate your mastery below.");
      setIsRevealed(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  // "I Don't Know This" / Request Detailed Explanation
  const handleFetchExplanation = async () => {
    if (!activeCard) return;
    setIsRevealed(true);

    if (activeCard.examples && activeCard.examples.length >= 2 && activeCard.usageNotes) {
      setExplanationData({
        targetItem: activeCard.targetItem,
        definition: activeCard.definition,
        phonetic: activeCard.phonetic || "",
        usageFormat: activeCard.usageNotes,
        ruleExplanation: activeCard.definition,
        examples: activeCard.examples,
        collocations: activeCard.tags || [],
        mnemonicTip: `Associate "${activeCard.targetItem}" with natural phrases in ${targetLang.name}.`,
        commonMistakes: [`Pay close attention to word order and conjugation for ${activeCard.partOfSpeech}.`],
      });
    }

    if (isOnline) {
      setIsLoadingExplanation(true);
      try {
        const res = await fetch("/api/explain-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetItem: activeCard.targetItem,
            cardType: activeCard.type,
            partOfSpeech: activeCard.partOfSpeech,
            targetLanguage: targetLang.name,
            knownLanguage: knownLang.name,
            frequencyRank: activeCard.frequencyRank,
          }),
        });

        if (res.ok) {
          const data: CardExplanation = await res.json();
          setExplanationData(data);
        }
      } catch (e) {
        console.warn("Could not fetch enriched explanation:", e);
      } finally {
        setIsLoadingExplanation(false);
      }
    }

    // Record a "Don't know" review (Grade 0) in SRS
    const { updatedSRS, nextDueDateDisplay } = calculateNextSRS(
      activeCard.srs,
      0,
      0,
      "incorrect",
      "I don't know this (viewed definition & examples)",
      "Card reviewed in help mode. Scheduled for immediate retention practice.",
      activeCard.examples?.[0]?.target || activeCard.targetItem,
      "typed"
    );
    setNextDueNotice(nextDueDateDisplay);

    const updatedCard: Flashcard = {
      ...activeCard,
      srs: updatedSRS,
    };
    onCardUpdated(updatedCard);
    onSentenceEvaluated?.(
      activeCard,
      {
        score: 0,
        grade: 0,
        masteryLevel: "incorrect",
        isTargetUsed: false,
        isGrammaticallyCorrect: false,
        feedbackSummary: "Reviewed definition and structure in reference mode.",
        correctedSentence: activeCard.examples?.[0]?.target || activeCard.targetItem,
        correctedSentenceTranslation: activeCard.examples?.[0]?.translation || activeCard.definition,
        detailedExplanation: "Card reviewed in reference mode to build initial foundation.",
        breakdown: [{ type: "vocab", message: "Initial concept review required." }],
        naturalAlternatives: [],
      },
      "I don't know this yet"
    );
  };

  // Advance to Next Card
  const handleNextCard = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 },
      });
      onFinishSession?.();
    }
  };

  // Restart Study Session
  const handleRestart = () => {
    setCurrentIndex(0);
    setSessionCompleted(false);
    setSessionScoreHistory([]);
    setEvaluation(null);
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center text-slate-800">
        <BookOpen className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Cards Available in This Queue</h3>
        <p className="text-slate-500 text-sm mb-6">
          Your review queue is clear, or this deck needs cards generated!
        </p>
      </div>
    );
  }

  // Check frequency bracket status for progression
  const fullDeckCards = allDeckCards.length > 0 ? allDeckCards : cards;
  const { currentBracket, nextBracketStart, nextBracketEnd, isCurrentTierMastered, needsNextBatchGeneration } =
    getActiveFrequencyBracket(fullDeckCards, 10);

  // Session Completed View
  if (sessionCompleted) {
    const avgScore =
      sessionScoreHistory.length > 0
        ? Math.round(sessionScoreHistory.reduce((a, b) => a + b, 0) / sessionScoreHistory.length)
        : 0;

    return (
      <div className="max-w-2xl mx-auto my-8 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Study Session Complete!</h2>
          <p className="text-slate-500 text-sm">
            You actively constructed sentences for {cards.length} frequency & error remedy items in {targetLang.name}.
          </p>
        </div>

        {/* Daily Goal Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Daily Target Progress</p>
              <p className="text-sm font-extrabold text-indigo-900">
                {dailyProgress.reviewedToday} / {dailyProgress.target} Cards Today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs bg-white px-3.5 py-1.5 rounded-xl border border-indigo-100 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Active Target Goal</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Practiced</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{cards.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Average Score</p>
            <p className={`text-2xl font-black mt-0.5 ${avgScore >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
              {avgScore}%
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left col-span-2 sm:col-span-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Memory Retention</p>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">SM-2 Synced</p>
          </div>
        </div>

        {/* Next Frequency Batch Unlock / Next Step Banner */}
        {isCurrentTierMastered && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-extrabold text-emerald-900">
                Frequency Tier #{currentBracket.startRank}–#{currentBracket.endRank} Mastered!
              </p>
            </div>
            <p className="text-xs text-emerald-800">
              You've demonstrated consistent sentence mastery for ranks {currentBracket.startRank}–{currentBracket.endRank}.
              Ready to advance to Ranks #{nextBracketStart}–#{nextBracketEnd}!
            </p>
            {needsNextBatchGeneration && onUnlockNextBatch && (
              <button
                onClick={() => onUnlockNextBatch(nextBracketStart, nextBracketEnd)}
                disabled={isGeneratingBatch}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isGeneratingBatch ? (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Cards #{nextBracketStart}–#{nextBracketEnd}...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Generate & Unlock Tier #{nextBracketStart}–#{nextBracketEnd}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            id="session-restart-btn"
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 text-xs sm:text-sm transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Session Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!activeCard) return null;

  // Calculate deck mastery percentage for Bento tile
  const masteredCount = fullDeckCards.filter((c) => c.srs.status === "mastered").length;
  const masteryPercent = Math.round((masteredCount / fullDeckCards.length) * 100) || activeCard.srs.masteryScore;

  // Active errors on this specific card
  const activeCardErrors = learnerErrors.filter(
    (e) =>
      !e.isResolved &&
      (e.targetItem.toLowerCase() === activeCard.targetItem.toLowerCase() ||
        e.cardId === activeCard.id ||
        e.id === activeCard.errorId)
  );

  const isCommonErrorCard = activeCard.isCommonError || activeCard.type === "common_error";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-4">
      {/* Session Progress Header Strip */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 gap-3 flex-wrap bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-800 font-bold">{deckTitle}</span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-600 font-bold">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-slate-300">•</span>
          {isCommonErrorCard ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>User-Tailored Error Remedy</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              Frequency Rank: #{activeCard.frequencyRank}
            </span>
          )}
        </div>

        {/* Daily Goal Pill & Randomized Mode Indicator */}
        <div className="flex items-center gap-2.5">
          <div
            id="random-mode-badge"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-2xs"
            title="Challenge mode randomly chosen for this card"
          >
            <Shuffle className="w-3 h-3 text-indigo-600" />
            <span>
              {promptMode === "target_word" ? "Mode: Word Display" : "Mode: Meaning Recall"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 font-medium">Goal:</span>
            <span className="text-slate-900 font-bold">
              {dailyProgress.reviewedToday}/{dailyProgress.target}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 font-bold text-slate-800">
            <span>{targetLang.flag}</span>
            <span>{targetLang.name}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Overcome Celebration Alert */}
      {overcomeCelebration && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{overcomeCelebration}</span>
        </div>
      )}

      {/* Active Mistake Warning for regular cards with past errors */}
      {!evaluation && !isCommonErrorCard && activeCardErrors.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Watch out for your previous slip on "{activeCard.targetItem}":</span>
          </div>
          <p className="text-[11px] text-amber-900 ml-6">
            Avoid: <span className="font-mono font-bold line-through text-rose-700">"{activeCardErrors[0].originalMistake}"</span> →{" "}
            Use: <span className="font-mono font-bold text-emerald-800">"{activeCardErrors[0].correctedForm}"</span>
          </p>
        </div>
      )}

      {/* MAIN BENTO GRID */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* TILE 1: PRIMARY PRACTICE CARD (Col-span-12 lg:col-span-8) */}
        <section
          className={`col-span-12 lg:col-span-8 rounded-3xl border shadow-sm p-6 sm:p-8 flex flex-col relative overflow-hidden transition-all ${
            isCommonErrorCard
              ? "bg-gradient-to-br from-white via-amber-50/20 to-rose-50/20 border-amber-200"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Top Right Frequency / Error Pill */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            {isCommonErrorCard ? (
              <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase border border-amber-300 flex items-center gap-1.5 shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Common Slip Card</span>
              </span>
            ) : (
              <span
                id="freq-badge"
                className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-xs font-bold tracking-widest uppercase border border-indigo-100/80 flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
                <span>Rank #{activeCard.frequencyRank}</span>
              </span>
            )}
          </div>

          {/* Top Left Card Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isCommonErrorCard
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {isCommonErrorCard ? "Error Remedy" : activeCard.type}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              {activeCard.partOfSpeech}
            </span>
            {activeCard.srs.status === "mastered" && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Mastered
              </span>
            )}
          </div>

          {/* Center Presentation: Only shows Word or Meaning at first (definition & examples hidden) */}
          <div className="flex-grow flex flex-col items-center justify-center text-center py-4">
            {/* INSTRUCTION HEADER */}
            <span className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest flex items-center gap-1.5">
              {promptMode === "target_word"
                ? "Construct an original sentence using this target item"
                : `Active Recall: Produce the target in ${targetLang.name} & write a sentence`}
            </span>

            {/* COMMON ERROR SPECIFIC PRESENTATION */}
            {isCommonErrorCard ? (
              <div className="w-full max-w-xl my-2 p-4 rounded-2xl bg-white border border-amber-200 shadow-xs text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                    Slip to Avoid:
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {activeCard.srs.consecutiveSuccesses}/2 Correct to Phase Out
                  </span>
                </div>
                <p className="text-base font-bold text-rose-900 line-through font-mono">
                  "{activeCard.originalMistake}"
                </p>

                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                    Target Correct Pattern:
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-lg font-black text-emerald-900 font-mono">
                      {promptMode === "recall_from_meaning" && !showRecallHint && !isRevealed
                        ? "[ ? ? ? - Recall Correct Form ]"
                        : `"${activeCard.correctedForm || activeCard.targetItem}"`}
                    </p>
                    {promptMode === "recall_from_meaning" && !showRecallHint && !isRevealed ? (
                      <button
                        onClick={() => setShowRecallHint(true)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                      >
                        Show Hint
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handlePlayAudio(
                            activeCard.correctedForm || activeCard.targetItem,
                            `card-audio-${activeCard.id}`
                          )
                        }
                        className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                        title="Listen"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD FREQUENCY CARD PRESENTATION */
              <div className="my-2">
                {promptMode === "target_word" ? (
                  /* DIRECT TARGET WORD DISPLAY */
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <h2
                      id="target-item-heading"
                      className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900"
                    >
                      {activeCard.targetItem}
                    </h2>

                    <button
                      id="audio-target-btn"
                      onClick={() => handlePlayAudio(activeCard.targetItem, `target-${activeCard.id}`)}
                      className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        playingAudioId === `target-${activeCard.id}`
                          ? "bg-indigo-600 text-white border-indigo-600 scale-110 shadow-md shadow-indigo-200"
                          : "bg-slate-50 border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                      }`}
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  /* REVERSE RECALL DISPLAY: Show translated meaning in known language */
                  <div className="space-y-2 mb-3">
                    <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/80 border border-indigo-100 max-w-lg mx-auto">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block mb-1">
                        Recall the {targetLang.name} word for:
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
                        "{activeCard.definition}"
                      </h3>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs">
                      {showRecallHint || isRevealed ? (
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                          Target: {activeCard.targetItem}
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowRecallHint(true)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                        >
                          Need a hint? Reveal target word
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Conjugation Lookup Toggle for Conjugation-Based Languages */}
            {isConjugationLang && (
              <div className="w-full max-w-xl mx-auto my-1 flex flex-col items-center">
                <button
                  type="button"
                  id="active-card-conjugation-btn"
                  onClick={() => setShowConjugationLookup(!showConjugationLookup)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 mb-2"
                >
                  <Table className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    {showConjugationLookup
                      ? "Hide Conjugation Lookup"
                      : `Conjugation Form Lookup (${activeCard.targetItem.replace(/\(.*?\)/g, "").trim().split(/[\s—\/:;,]/)[0].trim()})`}
                  </span>
                </button>

                {showConjugationLookup && (
                  <div className="w-full text-left p-4 bg-white rounded-3xl border-2 border-purple-200 shadow-md transition-all animate-fade-in mb-3">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-purple-100">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                          Verb Conjugation Table & Forms
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConjugationLookup(false)}
                        className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                      >
                        Close ✕
                      </button>
                    </div>
                    <ConjugationLookup
                      targetLang={targetLang}
                      knownLang={knownLang}
                      initialVerb={activeCard.targetItem.replace(/\(.*?\)/g, "").trim().split(/[\s—\/:;,]/)[0].trim()}
                      isOnline={isOnline}
                      onAddConjugationToDeck={(newCard) => onCardUpdated(newCard)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* If NOT evaluated -> Show sentence input textarea & Self-Reporting Controls */}
            {!evaluation && (
              <div className="w-full max-w-xl text-left space-y-3 mt-2">
                {!isOnline && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-bold">Offline Study: Self-Reported Mastery Active</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-semibold">AI evaluation offline</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="block text-left text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">
                    Your Sentence in {targetLang.name}
                  </label>
                  {!isRevealed && (
                    <button
                      type="button"
                      onClick={() => setIsRevealed(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      Show Answer & Reference
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    id="sentence-input"
                    rows={3}
                    value={userSentence}
                    onChange={(e) => setUserSentence(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (isOnline) {
                          handleEvaluateSentence();
                        } else {
                          setIsRevealed(true);
                        }
                      }
                    }}
                    placeholder={
                      isCommonErrorCard
                        ? `Formulate a sentence using the correct form "${activeCard.correctedForm || activeCard.targetItem}"...`
                        : promptMode === "target_word"
                        ? `Type an original sentence incorporating "${activeCard.targetItem}"...`
                        : `Recall and write a sentence in ${targetLang.name}...`
                    }
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 pr-12 text-base sm:text-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none"
                    disabled={isEvaluating}
                    autoFocus
                  />

                  {/* Mic STT Button inside textarea */}
                  <button
                    id="mic-record-btn"
                    type="button"
                    onClick={toggleRecording}
                    className={`absolute right-3 bottom-3 p-2 rounded-xl transition cursor-pointer ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                        : "bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 shadow-xs"
                    }`}
                    title={isRecording ? "Stop speaking" : "Speak your sentence"}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 text-xs text-red-500 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>Listening in {targetLang.name}... Speak clearly.</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Self-Reported Mastery Bar: ONLY shown when detected to be offline with tooltip/banner */}
                {!isOnline && (
                  <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                        <span className="uppercase tracking-wider">Offline Mode: Self-Reported Recall</span>
                      </div>
                      <span className="text-amber-800 text-[10px] bg-amber-100 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                        SM-2 Spaced Repetition
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Due to being offline, self-reported mastery is enabled so you can continue advancing your spaced repetition schedule without an active server connection.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <button
                        type="button"
                        id="rate-again-btn"
                        onClick={() => handleSelfReportRating(1, 20, "Again / Needs Review")}
                        className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/90 hover:bg-rose-100 text-rose-800 text-xs font-bold transition flex flex-col items-center cursor-pointer shadow-2xs"
                        title="Offline recall: Schedule for reset tomorrow"
                      >
                        <span>Again (1)</span>
                        <span className="text-[10px] text-rose-600 font-medium">1 Day Reset</span>
                      </button>
                      <button
                        type="button"
                        id="rate-hard-btn"
                        onClick={() => handleSelfReportRating(2, 60, "Hard / Hesitant")}
                        className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/90 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex flex-col items-center cursor-pointer shadow-2xs"
                        title="Offline recall: Short interval step"
                      >
                        <span>Hard (2)</span>
                        <span className="text-[10px] text-amber-700 font-medium">Short Interval</span>
                      </button>
                      <button
                        type="button"
                        id="rate-good-btn"
                        onClick={() => handleSelfReportRating(4, 85, "Good / Accurate")}
                        className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex flex-col items-center cursor-pointer shadow-2xs"
                        title="Offline recall: Standard SRS interval"
                      >
                        <span>Good (4)</span>
                        <span className="text-[10px] text-emerald-700 font-medium">+Interval</span>
                      </button>
                      <button
                        type="button"
                        id="rate-easy-btn"
                        onClick={() => handleSelfReportRating(5, 100, "Easy / Fluent")}
                        className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition flex flex-col items-center cursor-pointer shadow-2xs"
                        title="Offline recall: Bonus long jump interval"
                      >
                        <span>Easy (5)</span>
                        <span className="text-[10px] text-indigo-700 font-medium">Long Jump</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If in EVALUATION result mode */}
            {evaluation && (
              <div className="w-full text-left space-y-4 mt-2">
                {/* Result header banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        evaluation.score >= 85
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                          : evaluation.score >= 65
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {evaluation.score}%
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 capitalize">
                        {evaluation.masteryLevel} Production Mastery
                      </p>
                      <p className="text-xs text-slate-600">{evaluation.feedbackSummary}</p>
                    </div>
                  </div>

                  {nextDueNotice && (
                    <div className="text-right text-xs">
                      <span className="text-slate-400 font-medium">SRS Schedule: </span>
                      <span className="font-bold text-indigo-700">{nextDueNotice}</span>
                    </div>
                  )}
                </div>

                {/* Submitted vs Corrected Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Your Submission</p>
                    <p className="text-sm font-medium text-slate-800 italic">"{userSentence}"</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-emerald-700 uppercase text-[10px]">Natural Corrected</p>
                      <button
                        onClick={() => handlePlayAudio(evaluation.correctedSentence, "corrected")}
                        className="p-1 rounded-full bg-white text-emerald-700 hover:bg-emerald-700 hover:text-white transition cursor-pointer"
                        title="Listen"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-emerald-900">"{evaluation.correctedSentence}"</p>
                    {evaluation.correctedSentenceTranslation && (
                      <p className="text-[11px] text-emerald-700 italic mt-0.5">
                        {evaluation.correctedSentenceTranslation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Identified Errors Box (if any) */}
                {evaluation.identifiedErrors && evaluation.identifiedErrors.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Errors Logged to Intelligence Tracker:</span>
                    </div>
                    <div className="space-y-1.5">
                      {evaluation.identifiedErrors.map((err, idx) => (
                        <div key={idx} className="bg-white/80 p-2.5 rounded-xl border border-rose-100 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-rose-800 font-bold line-through">"{err.originalMistake}"</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-emerald-800 font-bold">"{err.correctedForm}"</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 ml-auto">
                              {err.errorType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{err.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Card Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    id="next-card-btn"
                    onClick={handleNextCard}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-100 transition active:scale-95 cursor-pointer"
                  >
                    <span>{currentIndex + 1 < cards.length ? "Next Flashcard" : "Finish Session"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer (Input mode) */}
          {!evaluation && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 flex-wrap gap-2">
              <button
                id="dont-know-btn"
                onClick={handleFetchExplanation}
                className="text-slate-500 font-bold text-xs hover:text-indigo-600 uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>I DON'T KNOW THIS YET</span>
              </button>

              <div className="flex items-center gap-2">
                {!isRevealed && (
                  <button
                    type="button"
                    onClick={() => setIsRevealed(true)}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Reveal Reference
                  </button>
                )}

                <button
                  id="submit-sentence-btn"
                  onClick={handleEvaluateSentence}
                  disabled={!isOnline || isEvaluating || !userSentence.trim()}
                  className={`px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider transition ${
                    isOnline && userSentence.trim() && !isEvaluating
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
                      : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
                  }`}
                  title={
                    isOnline
                      ? "Submit sentence for AI linguistic evaluation"
                      : "Requires online connection to evaluate with AI model (Use self-reported rating buttons above)"
                  }
                >
                  {isEvaluating
                    ? "EVALUATING..."
                    : isOnline
                    ? "SUBMIT MASTERY CHECK"
                    : "AI CHECK (ONLINE ONLY)"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* TILE 2: CURRENT MASTERY & SRS ENGINE (Col-span-12 lg:col-span-4) */}
        <section className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Mastery
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                SM-2 Engine
              </span>
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-slate-900">{masteryPercent}%</span>
              <span className="text-emerald-600 text-xs font-bold mb-1.5 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Active Track</span>
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-6">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(12, masteryPercent)}%` }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Items Mastered</span>
                <span className="font-bold text-slate-900">
                  {masteredCount} / {fullDeckCards.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Item Status</span>
                <span className="font-bold text-slate-900 capitalize">
                  {activeCard.srs.status === "mastered" ? "Mastered" : activeCard.srs.status}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Category</span>
                <span className="font-bold text-indigo-600">
                  {activeCard.partOfSpeech || activeCard.type}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Target Language</span>
                <span className="font-bold text-slate-900">{targetLang.name}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Daily Target Progress</span>
              <span className="font-bold text-slate-900">
                {dailyProgress.reviewedToday} / {dailyProgress.target}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((dailyProgress.reviewedToday / dailyProgress.target) * 100))}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* TILE 3: USAGE, GRAMMAR FORMAT & AUDIO EXAMPLES (Col-span-12) */}
        {/* REVEAL-ON-DEMAND: Hidden at first to encourage active recall, unlocked when user requests or submits sentence */}
        <section className="col-span-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {!isRevealed && !evaluation ? (
            /* LOCKED / COLLAPSED STATE (Active Recall Mode) */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Definition, Grammar Formula & Examples are Hidden for Active Recall
                  </h4>
                  <p className="text-xs text-slate-500">
                    Formulate your original sentence above to test memory retention. If you don't know the item, click reveal.
                  </p>
                </div>
              </div>

              <button
                id="reveal-guide-btn"
                onClick={handleFetchExplanation}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-xs transition cursor-pointer shrink-0"
              >
                <Unlock className="w-4 h-4" />
                <span>Reveal Definition & Examples</span>
              </button>
            </div>
          ) : (
            /* REVEALED STATE: Full Definition, Usage notes, and Audio Example Sentences */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Definition, Usage Format & Audio Examples
                  </h3>
                </div>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100">
                  Unlocked Reference
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Definition & Usage Formula */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Meaning / Translation:
                    </span>
                    <p className="text-base font-extrabold text-slate-900">
                      {explanationData?.definition || activeCard.definition}
                    </p>
                    {activeCard.phonetic && (
                      <p className="text-xs text-slate-400 font-serif mt-0.5">{activeCard.phonetic}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                      Usage Pattern / Structure:
                    </span>
                    <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {explanationData?.usageFormat || activeCard.usageNotes}
                    </p>
                  </div>

                  {explanationData?.mnemonicTip && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Mnemonic Tip: </span>
                        <span>{explanationData.mnemonicTip}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Native Audio Example Sentences */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Example Sentences (Click Audio to Read Aloud):
                  </span>

                  {(explanationData?.examples || activeCard.examples || []).map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-indigo-950">{ex.target}</p>
                        <button
                          onClick={() => handlePlayAudio(ex.target, `ex-audio-${idx}`)}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            playingAudioId === `ex-audio-${idx}`
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white"
                          }`}
                          title="Read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 italic">{ex.translation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conjugation Form Selector & Lookup for Verbs */}
              {IS_CONJUGATION_LANGUAGE[targetLang.code] && (
                <div className="pt-4 border-t border-slate-100">
                  <ConjugationLookup
                    targetLang={targetLang}
                    knownLang={knownLang}
                    initialVerb={activeCard.targetItem.split(/[\s(—\/:;,]/)[0].trim()}
                    isOnline={isOnline}
                    onAddConjugationToDeck={(newCard) => onCardUpdated(newCard)}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
