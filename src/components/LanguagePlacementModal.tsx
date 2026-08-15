import React, { useState } from "react";
import {
  SupportedLanguage,
  PlacementQuestion,
  PlacementTestResult,
  Deck,
  Flashcard,
} from "../types";
import { playTextAloud } from "../utils/speech";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  Brain,
  Layers,
  ArrowRight,
  RotateCcw,
  Award,
  AlertTriangle,
  Flame,
  Zap,
  BookOpen,
  HelpCircle,
} from "lucide-react";

interface LanguagePlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onDeckCalibrated: (newDeck: Deck) => void;
  isOnline?: boolean;
}

export const LanguagePlacementModal: React.FC<LanguagePlacementModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  knownLang,
  onDeckCalibrated,
  isOnline = true,
}) => {
  const [step, setStep] = useState<"intro" | "loading_questions" | "testing" | "evaluating" | "results">("intro");
  const [testType, setTestType] = useState<"quick" | "comprehensive">("comprehensive");
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PlacementTestResult | null>(null);
  const [isRegeneratingDeck, setIsRegeneratingDeck] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestionIndex] || "" : "";

  // 1. Fetch Diagnostic Test from AI
  const handleStartTest = async (type: "quick" | "comprehensive") => {
    if (!isOnline) {
      setErrorMessage("Placement Test requires an active internet connection to generate adaptive questions with the AI model.");
      return;
    }

    setTestType(type);
    setStep("loading_questions");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-placement-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          testType: type,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No test questions generated.");
      }

      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setStep("testing");
    } catch (err: any) {
      console.error("Test start failed:", err);
      setErrorMessage(err.message || "Failed to load placement test. Please try again.");
      setStep("intro");
    }
  };

  // 2. Submit Answers for AI Diagnostic Evaluation
  const handleSubmitTest = async () => {
    setStep("evaluating");
    setErrorMessage(null);

    try {
      const submissions = questions.map((q, idx) => ({
        questionId: q.id,
        userAnswer: answers[idx] || "",
        cefrLevel: q.cefrLevel,
        questionType: q.questionType,
      }));

      const response = await fetch("/api/evaluate-placement-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          submissions,
          testQuestions: questions,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Evaluation failed with status ${response.status}`);
      }

      const evalData: PlacementTestResult = await response.json();
      setResult(evalData);
      setStep("results");
    } catch (err: any) {
      console.error("Evaluation failed:", err);
      setErrorMessage(err.message || "Evaluation failed. Please try submitting again.");
      setStep("testing");
    }
  };

  // 3. Regenerate & Calibrate Flashcard Deck based on Placement Results
  const handleRegenerateDeck = async () => {
    if (!result) return;
    setIsRegeneratingDeck(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/regenerate-level-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          cefrLevel: result.overallCEFR,
          recommendedStartingRank: result.recommendedStartingRank || 1,
          identifiedErrors: result.identifiedErrors || [],
          cardCount: 15,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Failed to generate calibrated deck: status ${response.status}`);
      }

      const data = await response.json();
      const newDeckId = `deck-${targetLang.code}-calibrated-${result.overallCEFR.toLowerCase()}-${Date.now()}`;

      const formattedCards: Flashcard[] = (data.cards || []).map((c: any, idx: number) => ({
        ...c,
        id: `card-${newDeckId}-${idx + 1}`,
        deckId: newDeckId,
        frequencyRank: c.frequencyRank || (c.isCommonError ? 0 : result.recommendedStartingRank + idx),
        srs: {
          repetition: 0,
          interval: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
          history: [],
          masteryScore: 0,
          status: "new",
          consecutiveSuccesses: 0,
        },
      }));

      const newDeck: Deck = {
        id: newDeckId,
        title: data.deckTitle || `${targetLang.name} — CEFR ${result.overallCEFR} Calibrated Track`,
        description: data.deckDescription || `Calibrated placement deck starting at rank #${result.recommendedStartingRank} with error remediation.`,
        targetLang: targetLang.name,
        targetLangCode: targetLang.code,
        knownLang: knownLang.name,
        knownLangCode: knownLang.code,
        level: `CEFR ${result.overallCEFR} (Standardized)`,
        createdAt: new Date().toISOString(),
        cards: formattedCards,
      };

      onDeckCalibrated(newDeck);
      onClose();
    } catch (err: any) {
      console.error("Failed to calibrate deck:", err);
      setErrorMessage(err.message || "Failed to generate calibrated deck.");
      setIsRegeneratingDeck(false);
    }
  };

  const handlePlayPromptAudio = (text: string) => {
    playTextAloud(text, targetLang.code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col">
        {/* Modal Top Banner */}
        <div className="p-6 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Language Placement & CEFR Evaluation</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                Multi-Skill Diagnostic for <span className="font-bold underline">{targetLang.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              ✕
            </button>
          </div>
        )}

        {/* STEP 1: INTRO & METHODOLOGY SELECTION */}
        {step === "intro" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Calibrate Your Starting Point & Standardized Level
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Whether you are beginning from scratch or already have pre-existing language knowledge, this test evaluates your active sentence formulation, grammar precision, and listening comprehension to pinpoint your exact CEFR level (A1–C1) and recommend the ideal starting frequency tier.
              </p>
            </div>

            {/* Test Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleStartTest("quick")}
                className="p-5 rounded-3xl border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/40 text-left transition space-y-3 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    ⚡
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    ~3 Mins
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                    Quick Diagnostic
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    5 adaptive questions assessing core lexical recall, verb tenses, and opinion phrasing.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleStartTest("comprehensive")}
                className="p-5 rounded-3xl border-2 border-indigo-600 bg-indigo-50/20 text-left transition space-y-3 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    🎯
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Recommended (~6 Mins)
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                    Comprehensive Placement Exam
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    7 multi-skill challenges: Active sentence production, error identification, grammar transformation, and audio listening.
                  </p>
                </div>
              </button>
            </div>

            {/* Methodology Note */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>Standardized Multi-Factor Triangulation</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                Rather than passive multiple-choice guessing, this test evaluates <strong>generative grammatical production</strong> and <strong>error fingerprinting</strong> to calibrate your personalized starting frequency bracket.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: LOADING QUESTIONS */}
        {step === "loading_questions" && (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">
              Synthesizing Adaptive Placement Test...
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Gemini is generating standardized diagnostic challenges tailored to {targetLang.name} linguistic milestones.
            </p>
          </div>
        )}

        {/* STEP 3: TESTING INTERFACE */}
        {step === "testing" && currentQuestion && (
          <div className="p-6 sm:p-8 space-y-6 flex-1">
            {/* Header with question indicator & CEFR target */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-100">
                  Target: CEFR {currentQuestion.cefrLevel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  {currentQuestion.questionType.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Prompt Box */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Challenge Prompt:
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">
                    {currentQuestion.prompt}
                  </p>
                </div>

                {currentQuestion.contextOrAudioText && (
                  <button
                    onClick={() => handlePlayPromptAudio(currentQuestion.contextOrAudioText!)}
                    className="p-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer shrink-0"
                    title="Listen to audio prompt"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {currentQuestion.targetItem && (
                <div className="text-xs text-slate-600 font-medium">
                  <span className="text-slate-400 font-bold">Concept Focus: </span>
                  <span className="font-bold text-indigo-700">"{currentQuestion.targetItem}"</span>
                </div>
              )}
            </div>

            {/* Answer Input Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">Your Response in {targetLang.name}:</label>
              </div>

              {/* Multiple Choice or Open Input */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: opt }))
                      }
                      className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        currentAnswer === opt
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  id="placement-answer-input"
                  rows={3}
                  value={currentAnswer}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestionIndex]: e.target.value,
                    }))
                  }
                  placeholder={`Write your sentence in ${targetLang.name}...`}
                  className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition resize-none"
                  autoFocus
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-100 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Submit & Diagnose Level</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: EVALUATING SUBMISSIONS */}
        {step === "evaluating" && (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">
              Scoring Grammar, Lexicon & Synthesizing Diagnostics...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Analyzing generative sentence accuracy, error fingerprints, and computing standardized certification equivalencies.
            </p>
          </div>
        )}

        {/* STEP 5: COMPREHENSIVE DIAGNOSTIC RESULTS */}
        {step === "results" && result && (
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Main Level Result Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border border-indigo-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-wider">
                      CEFR Level {result.overallCEFR}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Score: {result.percentageScore}%
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {result.standardizedEquivalency.estimatedScoreOrGrade}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.cefrDescription}
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Recommended Start
                  </span>
                  <span className="text-2xl font-black text-indigo-600">
                    Rank #{result.recommendedStartingRank}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    ~{result.estimatedActiveVocabularySize} words active capacity
                  </span>
                </div>
              </div>

              {/* Standardized Framework Details */}
              <div className="p-4 rounded-2xl bg-white border border-indigo-100 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>{result.standardizedEquivalency.frameworkName}</span>
                  </span>
                  <span className="text-indigo-600">
                    ACTFL: {result.standardizedEquivalency.actflEquivalent}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {result.standardizedEquivalency.description}
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Demonstrated Strengths</span>
                </span>
                <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                <span className="font-extrabold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Identified Gaps & Focus Areas</span>
                </span>
                <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                  {result.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Errors Identified for Remedy Cards */}
            {result.identifiedErrors && result.identifiedErrors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Identified Errors ({result.identifiedErrors.length}) — Pre-Loaded for Flashcard Remedy</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {result.identifiedErrors.map((err, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-white border border-rose-100 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-rose-600 font-mono">Slip: "{err.originalMistake}"</span>
                        <span className="text-emerald-700 font-mono">→ "{err.correctedForm}"</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{err.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-Question Detailed Review Accordion */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Question-by-Question Diagnostic Review</span>
              </span>
              <div className="space-y-2">
                {result.perQuestionReview.map((rev, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      rev.isCorrect ? "bg-emerald-50/20 border-emerald-100" : "bg-rose-50/20 border-rose-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Q{i + 1} (CEFR {rev.cefrLevel})
                        </span>
                        <p className="font-bold text-slate-900">{rev.prompt}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          rev.isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {rev.isCorrect ? "✓ Mastered" : "✗ Needs Review"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold block">Your Answer:</span>
                        <span className="font-medium text-slate-800 italic">"{rev.userAnswer || "(No answer)"}"</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 font-bold block">Ideal Native Form:</span>
                        <span className="font-bold text-emerald-900">"{rev.idealAnswer}"</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-slate-100">
                      <strong>Feedback: </strong> {rev.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION: 1-CLICK DECK REGENERATION & CALIBRATION */}
            <div className="p-6 rounded-3xl bg-indigo-600 text-white space-y-4 shadow-lg shadow-indigo-200">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold">
                    Calibrate Deck to CEFR {result.overallCEFR} (Starting Rank #{result.recommendedStartingRank})
                  </h4>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Instantly synthesizes 15 targeted practice cards starting at rank #{result.recommendedStartingRank}, plus dedicated remedy flashcards for any slips you made during this test.
                  </p>
                </div>
                <Zap className="w-6 h-6 text-amber-300 shrink-0" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleRegenerateDeck}
                  disabled={isRegeneratingDeck}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-indigo-700 text-xs font-black transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isRegeneratingDeck ? (
                    <>
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Calibrating & Synthesizing Deck...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Regenerate & Start Level {result.overallCEFR} Track</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep("intro")}
                  className="px-4 py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Retake Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
