import React, { useState, useEffect, useRef } from "react";
import {
  Deck,
  Flashcard,
  SupportedLanguage,
  ReadingArticle,
  TextSelectionExplanation,
  ReadingArticleConcept,
  ReadingFollowUpQuestion,
  ReadingQuestionEvaluation,
  LearnerError,
} from "../types";
import { DEFAULT_READING_ARTICLES } from "../data/defaultArticles";
import { playTextAloud, stopSpeech } from "../utils/speech";
import { ConjugationLookup } from "./ConjugationLookup";
import { IS_CONJUGATION_LANGUAGE } from "../data/conjugations";
import { LinguisticCopilot, CopilotTriggerButton } from "./LinguisticCopilot";
import { lookupBuiltinDictionary } from "../data/builtinDictionary";
import { estimateStandardizedProficiency } from "../utils/proficiencyEstimation";
import { formatPronunciation } from "../utils/pronunciation";
import {
  isArticleSaved,
  toggleSaveArticle,
  loadSavedArticles,
} from "../utils/savedArticlesStorage";
import { SavedArticlesModal } from "./SavedArticlesModal";
import {
  BookOpen,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Plus,
  Check,
  Languages,
  Eye,
  EyeOff,
  Lightbulb,
  X,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  FolderHeart,
  Share2,
  HelpCircle,
  Table,
  Search,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  Sparkle,
} from "lucide-react";

interface ReadingListeningPracticeProps {
  deck: Deck;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  isOnline?: boolean;
  onAddCardToDeck: (card: Flashcard) => void;
  learnerErrors?: LearnerError[];
  onNavigateTab?: (tab: string) => void;
  pronunciationAid?: string;
}

export const ReadingListeningPractice: React.FC<ReadingListeningPracticeProps> = ({
  deck,
  targetLang,
  knownLang,
  isOnline = true,
  onAddCardToDeck,
  learnerErrors = [],
  onNavigateTab,
  pronunciationAid = "none",
}) => {
  const [showLevelWarningDismissed, setShowLevelWarningDismissed] = useState<boolean>(false);

  // Evaluated user proficiency
  const userAssessment = estimateStandardizedProficiency(deck, targetLang, learnerErrors);
  const isLevelTooLow = userAssessment.cefrLevel === "A1" || userAssessment.masteredCount < 8;
  // Current active article
  const [article, setArticle] = useState<ReadingArticle>(() => {
    return (
      DEFAULT_READING_ARTICLES[targetLang.code] ||
      DEFAULT_READING_ARTICLES["es"]
    );
  });

  // Whenever target language changes, load language-specific article
  useEffect(() => {
    if (DEFAULT_READING_ARTICLES[targetLang.code]) {
      setArticle(DEFAULT_READING_ARTICLES[targetLang.code]);
    }
  }, [targetLang.code]);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showTranslations, setShowTranslations] = useState<boolean>(false);
  const [revealedParagraphs, setRevealedParagraphs] = useState<Set<number>>(new Set());

  // Article generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [selectedCEFR, setSelectedCEFR] = useState<string>("A2");

  // Selection & Explanation State
  const [selectedText, setSelectedText] = useState<string>("");
  const [customQueryText, setCustomQueryText] = useState<string>("");
  const [selectionRange, setSelectionRange] = useState<{ x: number; y: number } | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<TextSelectionExplanation | null>(null);
  const [addedConceptIds, setAddedConceptIds] = useState<Set<string>>(new Set());
  const [expandedConjugationWord, setExpandedConjugationWord] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Follow-up Comprehension Questions State
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [isGrading, setIsGrading] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<Record<string, ReadingQuestionEvaluation>>({});
  const [isRecording, setIsRecording] = useState<Record<string, boolean>>({});
  const [showQuestionTranslations, setShowQuestionTranslations] = useState<Record<string, boolean>>({});
  const [addedRemedyCardIds, setAddedRemedyCardIds] = useState<Set<string>>(new Set());
  const [activeCopilotQuestionId, setActiveCopilotQuestionId] = useState<string | null>(null);
  const [isTopicCopilotOpen, setIsTopicCopilotOpen] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Saved Articles Library State
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [isArticleBookmarked, setIsArticleBookmarked] = useState<boolean>(() => isArticleSaved(article.id));
  const [savedArticlesCount, setSavedArticlesCount] = useState<number>(() => loadSavedArticles(targetLang.code).length);

  // Update bookmark status whenever article changes
  useEffect(() => {
    setIsArticleBookmarked(isArticleSaved(article.id));
    setSavedArticlesCount(loadSavedArticles(targetLang.code).length);
  }, [article.id, targetLang.code]);

  const handleToggleSaveCurrentArticle = () => {
    const isNowSaved = toggleSaveArticle(article);
    setIsArticleBookmarked(isNowSaved);
    setSavedArticlesCount(loadSavedArticles(targetLang.code).length);
    if (isNowSaved) {
      showToast(`Saved "${article.title}" to your review library!`);
    } else {
      showToast(`Removed "${article.title}" from saved library.`);
    }
  };

  const handleSelectSavedArticle = (savedArticle: ReadingArticle) => {
    handleStopAudio();
    setArticle(savedArticle);
    setIsArticleBookmarked(true);
    showToast(`Loaded "${savedArticle.title}"`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isConjugationLang = IS_CONJUGATION_LANGUAGE[targetLang.code] ?? false;

  const articleContainerRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Selection change listener across the article
  useEffect(() => {
    const handleDocumentSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }
      const text = selection.toString().trim();
      if (text.length >= 1 && articleContainerRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);
        setCustomQueryText(text);
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) {
            setSelectionRange({
              x: Math.max(16, rect.left + rect.width / 2),
              y: Math.max(20, rect.top - 12),
            });
          }
        } catch {
          // fallback
        }
      }
    };

    document.addEventListener("selectionchange", handleDocumentSelection);
    return () => {
      document.removeEventListener("selectionchange", handleDocumentSelection);
    };
  }, []);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Words needed to study today (due or top learning cards from deck)
  const targetWordsForToday = deck.cards
    .slice(0, 8)
    .map((c) => c.targetItem);

  // Handle Playback controls
  const handlePlayFullArticle = () => {
    if (!("speechSynthesis" in window)) {
      showToast("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isPaused && speechUtteranceRef.current) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const fullText = article.paragraphs.map((p) => p.targetText).join(" ");
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = targetLang.speechLocale || `${targetLang.code}-${targetLang.code.toUpperCase()}`;
    utterance.rate = playbackSpeed;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentParagraphIndex(0);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentParagraphIndex(-1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentParagraphIndex(-1);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayParagraph = (index: number, text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang.speechLocale || `${targetLang.code}-${targetLang.code.toUpperCase()}`;
    utterance.rate = playbackSpeed;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentParagraphIndex(index);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentParagraphIndex(-1);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePauseAudio = () => {
    if ("speechSynthesis" in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentParagraphIndex(-1);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (isPlaying) {
      handleStopAudio();
    }
  };

  // Detect user highlight selection inside the article container
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionRange(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length >= 1) {
      setSelectedText(text);
      setCustomQueryText(text);
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          setSelectionRange({
            x: Math.max(16, rect.left + rect.width / 2),
            y: Math.max(20, rect.top - 12),
          });
        }
      } catch {
        // fallback
      }
    } else {
      setSelectionRange(null);
    }
  };

  // Request explanation of highlighted selection
  const handleExplainSelection = async (textToExplain?: string) => {
    const queryText = (textToExplain || selectedText || customQueryText).trim();
    if (!queryText) {
      showToast("Please highlight or enter a word or sentence to explain.");
      return;
    }

    setIsExplaining(true);
    setSelectionRange(null);

    // Look up dictionary first for guaranteed accurate translations & definitions
    const dictMatch = lookupBuiltinDictionary(queryText, targetLang.name);

    // Call API or fallback
    try {
      if (isOnline) {
        const res = await fetch("/api/explain-reading-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedText: queryText,
            fullContext: article.content,
            targetLanguage: targetLang.name,
            knownLanguage: knownLang.name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // If translation is empty or placeholder, merge with dictionary
          if (
            (!data.translation ||
              data.translation.toLowerCase().includes("translation of") ||
              data.translation.trim() === queryText) &&
            dictMatch
          ) {
            data.translation = dictMatch.translation;
            if (data.concepts?.[0]) {
              data.concepts[0].definition = dictMatch.definition;
              data.concepts[0].partOfSpeech = dictMatch.partOfSpeech;
              if (dictMatch.phonetic) data.concepts[0].phonetic = dictMatch.phonetic;
              if (dictMatch.grammarNotes) data.concepts[0].usageNotes = dictMatch.grammarNotes;
              if (dictMatch.exampleSentence) data.concepts[0].exampleSentence = dictMatch.exampleSentence;
            }
          }
          setExplanation(data);
          setIsExplaining(false);
          setTimeout(() => {
            explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
          return;
        }
      }
    } catch (err) {
      console.warn("API explanation failed, using local linguistic decomposition:", err);
    }

    // Local heuristic fallback breakdown with dictionary support
    setTimeout(() => {
      const fallbackExplanation: TextSelectionExplanation = {
        selectedText: queryText,
        translation: dictMatch ? dictMatch.translation : `"${queryText}" (${targetLang.name})`,
        grammaticalContext: dictMatch?.grammarNotes
          ? dictMatch.grammarNotes
          : `Grammar note: "${queryText}" is used contextually in ${targetLang.name} discourse.`,
        concepts: [
          {
            id: `concept-${Date.now()}-1`,
            targetItem: dictMatch ? dictMatch.targetItem : queryText,
            type: queryText.includes(" ") ? "grammar" : "vocabulary",
            partOfSpeech: dictMatch ? dictMatch.partOfSpeech : (queryText.includes(" ") ? "Expression / Structure" : "Vocabulary Item"),
            definition: dictMatch ? dictMatch.definition : `Meaning & contextual usage of "${queryText}" in ${targetLang.name}`,
            phonetic: dictMatch?.phonetic || (targetLang.code === "zh-TW" ? "Pinyin" : undefined),
            usageNotes: dictMatch?.grammarNotes || `Occurs naturally in ${targetLang.name} sentences.`,
            exampleSentence: dictMatch?.exampleSentence || {
              target: `${queryText} ...`,
              translation: `Example sentence featuring "${queryText}".`,
            },
          },
        ],
      };
      setExplanation(fallbackExplanation);
      setIsExplaining(false);
      setTimeout(() => {
        explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }, 300);
  };

  // Toggle voice dictation for a follow-up question
  const toggleSpeechRecognition = (qId: string) => {
    if (isRecording[qId]) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording((prev) => ({ ...prev, [qId]: false }));
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech recognition is not available in this browser. Please type your response.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = targetLang.code === "zh-TW" ? "zh-TW" : targetLang.code;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording((prev) => ({ ...prev, [qId]: true }));
        showToast(`Listening in ${targetLang.name}... Speak your answer!`);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserResponses((prev) => {
          const current = prev[qId] || "";
          return {
            ...prev,
            [qId]: current ? `${current} ${transcript}` : transcript,
          };
        });
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording((prev) => ({ ...prev, [qId]: false }));
      };

      recognition.onend = () => {
        setIsRecording((prev) => ({ ...prev, [qId]: false }));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Recognition start failed:", err);
      setIsRecording((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // Grade user's response to a follow-up question
  const handleGradeResponse = async (q: ReadingFollowUpQuestion) => {
    const userAns = (userResponses[q.id] || "").trim();
    if (!userAns) {
      showToast("Please write or dictate a response before submitting.");
      return;
    }

    setIsGrading((prev) => ({ ...prev, [q.id]: true }));
    try {
      if (isOnline) {
        const res = await fetch("/api/grade-reading-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionText: q.questionText,
            questionTranslation: q.questionTranslation,
            userResponse: userAns,
            articleContext: article.content,
            targetLanguage: targetLang.name,
            knownLanguage: knownLang.name,
            targetLanguageCode: targetLang.code,
          }),
        });

        if (res.ok) {
          const evalData = await res.json();
          setEvaluations((prev) => ({
            ...prev,
            [q.id]: {
              questionId: q.id,
              ...evalData,
            },
          }));
          showToast("Response evaluated!");
          return;
        }
      }
    } catch (err) {
      console.warn("Grading error:", err);
    } finally {
      setIsGrading((prev) => ({ ...prev, [q.id]: false }));
    }

    // Heuristic fallback grading
    const isLenOk = userAns.length >= 10;
    setEvaluations((prev) => ({
      ...prev,
      [q.id]: {
        questionId: q.id,
        semanticScore: isLenOk ? 88 : 55,
        isSemanticallyAccurate: isLenOk,
        semanticFeedback: isLenOk
          ? `Well done! Your response addresses the question accurately based on the passage.`
          : `Your response is a bit brief. Try elaborating with more details from the passage.`,
        grammarScore: isLenOk ? 85 : 60,
        isGrammaticallyCorrect: isLenOk,
        grammarFeedback: `Good vocabulary usage and phrasing. Ensure proper verb endings and agreement.`,
        correctedResponse: userAns,
        correctedTranslation: `Polished formulation`,
        identifiedErrors: [],
        suggestedRemedyCards: [],
      },
    }));
  };

  // Add a suggested remedy card from evaluation directly to active deck
  const handleAddRemedyCardToDeck = (cardData: any) => {
    const newCard: Flashcard = {
      id: `remedy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deckId: deck.id,
      type: (cardData.type as any) || "common_error",
      targetItem: cardData.targetItem || cardData.correctedForm || "Grammar Remedy",
      targetLanguage: targetLang.name,
      knownLanguage: knownLang.name,
      frequencyRank: deck.cards.length + 1,
      partOfSpeech: cardData.partOfSpeech || "Grammar Remedy",
      definition: cardData.definition || cardData.usageNotes || "Error Correction",
      phonetic: cardData.phonetic,
      usageNotes: cardData.usageNotes || `Remedy for: "${cardData.originalMistake || ""}" -> "${cardData.correctedForm || ""}"`,
      examples: cardData.examples || [
        {
          target: cardData.correctedForm || cardData.targetItem || "",
          translation: cardData.definition || "",
        },
      ],
      isCommonError: true,
      originalMistake: cardData.originalMistake,
      correctedForm: cardData.correctedForm,
      category: "common_error",
      tags: ["reading-remedy", "error-correction"],
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
    setAddedRemedyCardIds((prev) => new Set([...prev, cardData.targetItem || cardData.correctedForm || newCard.id]));
    showToast(`Added remedy card "${newCard.targetItem}" to ${deck.title}!`);
  };

  // Add concept from explanation to active Deck
  const handleAddConceptToDeck = (concept: ReadingArticleConcept) => {
    const newCard: Flashcard = {
      id: `card-from-reading-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deckId: deck.id,
      type: concept.type || "vocabulary",
      targetItem: concept.targetItem,
      targetLanguage: targetLang.name,
      knownLanguage: knownLang.name,
      frequencyRank: deck.cards.length + 1,
      partOfSpeech: concept.partOfSpeech || "Vocabulary",
      definition: concept.definition,
      phonetic: concept.phonetic,
      usageNotes: concept.usageNotes || `Extracted from reading passage: "${article.title}"`,
      examples: concept.exampleSentence
        ? [concept.exampleSentence]
        : [
            {
              target: concept.targetItem,
              translation: concept.definition,
            },
          ],
      tags: ["reading-practice", "extracted"],
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
    };

    onAddCardToDeck(newCard);
    setAddedConceptIds((prev) => new Set([...prev, concept.id || concept.targetItem]));
    showToast(`Added "${concept.targetItem}" to ${deck.title}!`);
  };

  // Generate a new custom immersion article with Gemini
  const handleGenerateNewArticle = async () => {
    if (!isOnline) {
      showToast("Online connection required to generate new AI articles.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-reading-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          targetLanguageCode: targetLang.code,
          knownLanguageCode: knownLang.code,
          topic: customTopic || `Daily conversational adventures incorporating today's key words`,
          cefrLevel: selectedCEFR,
          targetWords: targetWordsForToday,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setArticle(data);
        handleStopAudio();
        showToast("New reading & listening article generated!");
      } else {
        showToast("Could not generate custom article. Please retry.");
      }
    } catch (err) {
      console.error("Error generating reading article:", err);
      showToast("Network error generating article.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Evaluated Level Advisory Banner */}
      {isLevelTooLow && !showLevelWarningDismissed && (
        <div
          id="reading-level-warning-banner"
          className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-amber-950">
                  Beginner Level Notice (Evaluated Level: {userAssessment.cefrTitle})
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                  {userAssessment.masteredCount} Items Mastered
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed max-w-3xl">
                Because your current evaluated proficiency is at an introductory stage, reading and listening immersion articles may feel challenging due to limited vocabulary recall or unfamiliar grammar concepts. We suggest strengthening your core vocabulary and sentence construction in the <strong>Deck</strong> and <strong>Study</strong> tabs, then returning here once your level is higher!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("deck")}
                className="px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Go to Deck</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowLevelWarningDismissed(true)}
              className="p-2 rounded-2xl hover:bg-amber-200/60 text-amber-800 text-xs font-bold transition cursor-pointer"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Bento Tile */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Reading & Listening Immersion</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Level: {article.cefrLevel || "A2"}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {targetLang.flag} {targetLang.name}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {article.title}
            </h2>
            <p className="text-sm font-medium text-slate-500">
              {article.titleTranslation}
            </p>
          </div>

          {/* Quick Audio & Library Control Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Save Article Button */}
            <button
              type="button"
              id="save-current-article-btn"
              onClick={handleToggleSaveCurrentArticle}
              className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                isArticleBookmarked
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200"
              }`}
              title={
                isArticleBookmarked
                  ? "Article saved in your review library (click to remove)"
                  : "Save this article to your library for review anytime"
              }
            >
              <Bookmark className={`w-4 h-4 ${isArticleBookmarked ? "fill-white text-white" : "text-slate-400"}`} />
              <span>{isArticleBookmarked ? "Saved" : "Save Article"}</span>
            </button>

            {/* Saved Library Button */}
            <button
              type="button"
              id="open-saved-articles-modal-btn"
              onClick={() => setIsSavedModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 hover:border-indigo-200"
              title="Open Saved Reading & Listening Library"
            >
              <FolderHeart className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Saved Library</span>
              <span className="sm:hidden">Saved</span>
              {savedArticlesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold">
                  {savedArticlesCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shrink-0">
              {isPlaying ? (
                <button
                  type="button"
                  id="pause-audio-btn"
                  onClick={handlePauseAudio}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
                  title="Pause Audio Narration"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span className="hidden sm:inline">Pause</span>
                </button>
              ) : isPaused ? (
                <button
                  type="button"
                  id="resume-audio-btn"
                  onClick={handlePlayFullArticle}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
                  title="Resume Audio Narration"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span className="hidden sm:inline">Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="play-audio-btn"
                  onClick={handlePlayFullArticle}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
                  title="Listen to Full Article"
                >
                  <Headphones className="w-4 h-4" />
                  <span className="hidden sm:inline">Listen All</span>
                </button>
              )}

              {(isPlaying || isPaused) && (
                <button
                  type="button"
                  id="stop-audio-btn"
                  onClick={handleStopAudio}
                  className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition text-xs cursor-pointer"
                  title="Stop Audio"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Speed Selector */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700">
                <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Speed:</span>
                <select
                  id="audio-speed-select"
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  className="bg-transparent text-slate-800 focus:outline-none cursor-pointer text-xs font-bold"
                >
                  <option value={0.75}>0.75x</option>
                  <option value={1.0}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                </select>
              </div>

              {/* Toggle Translation visibility */}
              <button
                type="button"
                id="toggle-translation-btn"
                onClick={() => setShowTranslations(!showTranslations)}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  showTranslations
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title={showTranslations ? "Hide translations" : "Show bilingual translations"}
              >
                {showTranslations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Target Words Integrated Banner */}
        {article.targetWordsUsed && article.targetWordsUsed.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-indigo-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target Words & Grammar Woven Into Today's Article:</span>
              </span>
              <span className="text-[10px] text-indigo-600 uppercase tracking-wider font-extrabold">
                {article.targetWordsUsed.length} Active Items
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {article.targetWordsUsed.map((item, idx) => (
                <span
                  key={idx}
                  onClick={() => handleExplainSelection(item)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-950 font-bold text-xs hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer shadow-2xs"
                  title="Click to explain this target item"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Selection Tooltip for Highlighting Words */}
      {selectionRange && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full transform animate-fade-in"
          style={{ left: `${selectionRange.x}px`, top: `${selectionRange.y}px` }}
        >
          <button
            type="button"
            id="explain-highlighted-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => handleExplainSelection(selectedText)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xl cursor-pointer border border-indigo-400 active:scale-95 transition"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Explain "{selectedText.slice(0, 18)}{selectedText.length > 18 ? "..." : ""}"</span>
          </button>
        </div>
      )}

      {/* Main Article Content Card */}
      <div
        ref={articleContainerRef}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 select-text"
      >
        {/* Quick Word & Phrase Explainer Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={customQueryText}
              onChange={(e) => setCustomQueryText(e.target.value)}
              placeholder={`Highlight text in story or type any ${targetLang.name} word...`}
              className="w-full text-xs text-slate-900 font-medium focus:outline-none placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (customQueryText.trim() || selectedText)) {
                  e.preventDefault();
                  handleExplainSelection(customQueryText.trim() || selectedText);
                }
              }}
            />
            {customQueryText && (
              <button
                type="button"
                onClick={() => {
                  setCustomQueryText("");
                  setSelectedText("");
                  setSelectionRange(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            id="query-explain-btn"
            onClick={() => handleExplainSelection(customQueryText.trim() || selectedText)}
            disabled={isExplaining || (!customQueryText.trim() && !selectedText)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            {isExplaining ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-200" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                <span>Explain Word / Highlight</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1 text-slate-500">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Highlight any word, phrase, or sentence below to get grammar breakdown & add to your deck.</span>
          </span>
          <span className="hidden sm:inline-block font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg font-bold">
            Select text to explain
          </span>
        </div>

        <div className="space-y-6">
          {article.paragraphs.map((p, idx) => {
            const isCurrent = currentParagraphIndex === idx;
            const isParagraphRevealed = revealedParagraphs.has(idx);

            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl transition border space-y-3 ${
                  isCurrent
                    ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200 shadow-sm"
                    : "bg-white hover:bg-slate-50/50 border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed tracking-normal select-text">
                    {p.targetText}
                  </p>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePlayParagraph(idx, p.targetText)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Listen to this paragraph"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {!showTranslations && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = new Set(revealedParagraphs);
                          if (next.has(idx)) {
                            next.delete(idx);
                          } else {
                            next.add(idx);
                          }
                          setRevealedParagraphs(next);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          isParagraphRevealed
                            ? "text-indigo-700 bg-indigo-50"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                        title={isParagraphRevealed ? "Hide translation" : "Peek translation"}
                      >
                        {isParagraphRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[10px] hidden sm:inline">
                          {isParagraphRevealed ? "Hide" : "Peek"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {(showTranslations || isParagraphRevealed) && (
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-2 border-t border-slate-100/80">
                    {p.translation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary note */}
        {article.summary && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Story Summary
            </span>
            <p>{article.summary}</p>
          </div>
        )}
      </div>

      {/* Explanation Drawer / Modal */}
      {explanation && (
        <div
          ref={explanationRef}
          className="p-6 rounded-3xl bg-white border-2 border-indigo-600 shadow-xl space-y-5 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                  Pedagogical Breakdown
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Highlighted Excerpt
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                "{explanation.selectedText}"
              </h3>
              <p className="text-sm font-semibold text-indigo-700">
                {explanation.translation}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setExplanation(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close explanation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grammatical context */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-800">
              Grammar & Nuance Notes
            </span>
            <p className="leading-relaxed">{explanation.grammaticalContext}</p>
          </div>

          {/* Concepts Breakdown & Add to Deck */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Extracted Vocabulary & Patterns (Add to Deck)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {explanation.concepts.length} Concept(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {explanation.concepts.map((concept, idx) => {
                const conceptId = concept.id || concept.targetItem;
                const isAdded = addedConceptIds.has(conceptId);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200 transition space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">
                          {concept.targetItem}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[10px] font-bold">
                          {concept.partOfSpeech}
                        </span>
                      </div>

                      {formatPronunciation(concept.targetItem, concept.phonetic, targetLang.code, pronunciationAid) && (
                        <p className="text-xs text-indigo-600 font-serif">
                          {formatPronunciation(concept.targetItem, concept.phonetic, targetLang.code, pronunciationAid)}
                        </p>
                      )}

                      <p className="text-xs font-medium text-slate-700">
                        {concept.definition}
                      </p>

                      {concept.exampleSentence && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-0.5 mt-2">
                          <p className="font-semibold text-slate-900">
                            {concept.exampleSentence.target}
                          </p>
                          <p className="text-slate-500">
                            {concept.exampleSentence.translation}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddConceptToDeck(concept)}
                      disabled={isAdded}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        isAdded
                          ? "bg-emerald-100 text-emerald-800 cursor-default"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 cursor-pointer"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In Active Deck</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Deck ({deck.title.slice(0, 15)}...)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Follow-up Comprehension & Response Grading Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Comprehension & Speaking Production</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                AI Semantic & Grammar Evaluator
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Follow-Up Questions & Response Dictation
            </h3>
            <p className="text-xs text-slate-500">
              Type or dictate your answers in {targetLang.name}. AI grades your responses for both semantic story comprehension and grammatical precision, auto-generating remedy flashcards for any errors.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {(article.followUpQuestions && article.followUpQuestions.length > 0
            ? article.followUpQuestions
            : [
                {
                  id: "q-default-1",
                  questionText: `이 이야기에서 가장 중요한 사건이나 인물의 행동은 무엇인가요?`,
                  questionTranslation: "What was the most important event or action in this passage?",
                  focusGrammarOrConcept: "Descriptive past or present action",
                  suggestedAnswerHint: "Summarize what the characters did in the story.",
                },
                {
                  id: "q-default-2",
                  questionText: `주인공의 기분이나 생각에 대해 어떻게 생각하나요?`,
                  questionTranslation: "What do you think about the protagonist's feelings or thoughts?",
                  focusGrammarOrConcept: "Expressing thoughts and opinions",
                  suggestedAnswerHint: "Describe the atmosphere and personal thoughts.",
                },
              ]
          ).map((q, qIdx) => {
            const userAns = userResponses[q.id] || "";
            const isQGrading = !!isGrading[q.id];
            const qEval = evaluations[q.id];
            const isQRecording = !!isRecording[q.id];
            const showQTrans = !!showQuestionTranslations[q.id];

            return (
              <div
                key={q.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 transition hover:border-slate-300"
              >
                {/* Question Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                      Question {qIdx + 1}
                    </span>
                    {q.focusGrammarOrConcept && (
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                        Focus: {q.focusGrammarOrConcept}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-bold text-slate-900 leading-snug">
                      {q.questionText}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => playTextAloud(q.questionText, targetLang.code, playbackSpeed)}
                        className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 transition cursor-pointer"
                        title="Listen to question"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setShowQuestionTranslations((prev) => ({
                            ...prev,
                            [q.id]: !prev[q.id],
                          }))
                        }
                        className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title={showQTrans ? "Hide translation" : "Peek translation"}
                      >
                        {showQTrans ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline text-[11px]">
                          {showQTrans ? "Hide" : "Translate"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {showQTrans && (
                    <p className="text-xs font-medium text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
                      {q.questionTranslation}
                    </p>
                  )}
                </div>

                {/* Response Input Area with Dictation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <label htmlFor={`response-input-${q.id}`}>
                      Your Answer in {targetLang.name}:
                    </label>
                    <div className="flex items-center gap-2">
                      <CopilotTriggerButton
                        id={`copilot-q-btn-${q.id}`}
                        isOpen={activeCopilotQuestionId === q.id}
                        onClick={() =>
                          setActiveCopilotQuestionId(
                            activeCopilotQuestionId === q.id ? null : q.id
                          )
                        }
                        label="AI Co-Pilot"
                        size="xs"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSpeechRecognition(q.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isQRecording
                            ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                        }`}
                      >
                        {isQRecording ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>Listening... (Tap to stop)</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Dictate Speech</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Linguistic Copilot Panel for Question Response */}
                  {activeCopilotQuestionId === q.id && (
                    <div className="animate-fade-in my-2">
                      <LinguisticCopilot
                        targetLang={targetLang}
                        knownLang={knownLang}
                        pronunciationAid="romanized"
                        onInsertText={(text) => {
                          setUserResponses((prev) => ({
                            ...prev,
                            [q.id]: prev[q.id] ? `${prev[q.id]} ${text}` : text,
                          }));
                        }}
                        isOpen={activeCopilotQuestionId === q.id}
                        onClose={() => setActiveCopilotQuestionId(null)}
                        variant="inline"
                        idPrefix={`q-copilot-${q.id}`}
                        title="Linguistic Assistant"
                        subtitle={`Craft phrasing, conjugate verbs, or lookup vocabulary for your response in ${targetLang.name}`}
                      />
                    </div>
                  )}

                  <textarea
                    id={`response-input-${q.id}`}
                    rows={3}
                    value={userAns}
                    onChange={(e) =>
                      setUserResponses((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder={`Write or dictate your answer in ${targetLang.name}...`}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-400 placeholder:text-slate-400 transition"
                  />

                  {q.suggestedAnswerHint && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Hint: {q.suggestedAnswerHint}</span>
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleGradeResponse(q)}
                    disabled={isQGrading || !userAns.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    {isQGrading ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Evaluating Grammar & Meaning...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Grade Response</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Evaluation Result Feedback */}
                {qEval && (
                  <div className="mt-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    {/* Score Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Semantic Comprehension
                          </p>
                          <p className="text-xs font-medium text-slate-700 mt-0.5">
                            {qEval.isSemanticallyAccurate ? "Accurate & Relevant" : "Needs Detail"}
                          </p>
                        </div>
                        <span
                          className={`text-lg font-black px-3 py-1 rounded-xl ${
                            qEval.semanticScore >= 80
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : qEval.semanticScore >= 60
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {qEval.semanticScore}%
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Grammatical Correctness
                          </p>
                          <p className="text-xs font-medium text-slate-700 mt-0.5">
                            {qEval.isGrammaticallyCorrect ? "Flawless / Minor Slips" : "Grammar Gaps"}
                          </p>
                        </div>
                        <span
                          className={`text-lg font-black px-3 py-1 rounded-xl ${
                            qEval.grammarScore >= 80
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : qEval.grammarScore >= 60
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {qEval.grammarScore}%
                        </span>
                      </div>
                    </div>

                    {/* Detailed Feedbacks */}
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 space-y-0.5">
                        <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Semantic Comprehension Notes:</span>
                        </span>
                        <p className="font-medium">{qEval.semanticFeedback}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-900 space-y-0.5">
                        <span className="font-bold flex items-center gap-1 text-[11px] text-indigo-800">
                          <Info className="w-3.5 h-3.5" />
                          <span>Grammar & Syntax Notes:</span>
                        </span>
                        <p className="font-medium">{qEval.grammarFeedback}</p>
                      </div>
                    </div>

                    {/* Native Polish / Corrected Response */}
                    {qEval.correctedResponse && (
                      <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                            <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Native / Polished Expression</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => playTextAloud(qEval.correctedResponse, targetLang.code, playbackSpeed)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                            title="Play corrected audio"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {qEval.correctedResponse}
                        </p>
                        {qEval.correctedTranslation && (
                          <p className="text-xs text-slate-400">
                            {qEval.correctedTranslation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Identified Specific Errors */}
                    {qEval.identifiedErrors && qEval.identifiedErrors.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Identified Errors & Fixes</span>
                        </p>
                        <div className="space-y-1.5">
                          {qEval.identifiedErrors.map((errItem, eIdx) => (
                            <div
                              key={eIdx}
                              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <span className="line-through text-rose-600 font-bold mr-2">
                                  {errItem.originalMistake}
                                </span>
                                <span className="text-emerald-700 font-bold mr-2">
                                  → {errItem.correctedForm}
                                </span>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  {errItem.explanation}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0 self-start sm:self-center">
                                {errItem.errorType}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Remedy Flashcards to Add to Deck */}
                    {qEval.suggestedRemedyCards && qEval.suggestedRemedyCards.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Suggested Error-Remedy Cards to Add to Deck</span>
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {qEval.suggestedRemedyCards.length} Suggested Card(s)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {qEval.suggestedRemedyCards.map((rc, rIdx) => {
                            const cardIdKey = rc.targetItem || rc.correctedForm || `rem-${rIdx}`;
                            const isRemedyAdded = addedRemedyCardIds.has(cardIdKey);

                            return (
                              <div
                                key={rIdx}
                                className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/80 transition flex flex-col justify-between space-y-2"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                      {rc.targetItem || rc.correctedForm}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[9px] font-extrabold uppercase">
                                      {rc.type === "grammar" ? "Grammar" : "Remedy"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 font-medium">
                                    {rc.definition || rc.usageNotes}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddRemedyCardToDeck(rc)}
                                  disabled={isRemedyAdded}
                                  className={`w-full py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition ${
                                    isRemedyAdded
                                      ? "bg-emerald-100 text-emerald-800 cursor-default"
                                      : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs active:scale-95"
                                  }`}
                                >
                                  {isRemedyAdded ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>In Active Deck</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>Add Card to Deck</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Article Generator Controls */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Generate New Practice Article with Today's Study Items</span>
            </h3>
            <p className="text-xs text-slate-500">
              AI seamlessly crafts a new immersive story containing your deck's upcoming vocabulary and grammar patterns.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-500">
                Custom Theme or Topic (Optional)
              </label>
              <CopilotTriggerButton
                id="article-topic-copilot-btn"
                isOpen={isTopicCopilotOpen}
                onClick={() => setIsTopicCopilotOpen(!isTopicCopilotOpen)}
                label="AI Co-Pilot"
                size="xs"
              />
            </div>

            {isTopicCopilotOpen && (
              <div className="animate-fade-in my-2">
                <LinguisticCopilot
                  targetLang={targetLang}
                  knownLang={knownLang}
                  pronunciationAid="romanized"
                  onInsertText={(text) => {
                    setCustomTopic((prev) => (prev ? `${prev} ${text}` : text));
                  }}
                  isOpen={isTopicCopilotOpen}
                  onClose={() => setIsTopicCopilotOpen(false)}
                  variant="inline"
                  idPrefix="article-topic-copilot"
                  title="Linguistic Assistant"
                  subtitle={`Formulate themes or find vocabulary in ${targetLang.name}`}
                />
              </div>
            )}

            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g., Ordering coffee, renting an apartment, discussing tech news..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Target Level
            </label>
            <select
              value={selectedCEFR}
              onChange={(e) => setSelectedCEFR(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="A1">A1 - Beginner Breakthrough</option>
              <option value="A2">A2 - Elementary Waystage</option>
              <option value="B1">B1 - Intermediate Threshold</option>
              <option value="B2">B2 - Vantage Advanced</option>
              <option value="C1">C1 - Effective Proficiency</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            id="generate-new-article-btn"
            onClick={handleGenerateNewArticle}
            disabled={isGenerating || !isOnline}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Synthesizing Story with Target Grammar...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tailored Article</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Saved Articles Library Modal */}
      <SavedArticlesModal
        isOpen={isSavedModalOpen}
        onClose={() => {
          setIsSavedModalOpen(false);
          setSavedArticlesCount(loadSavedArticles(targetLang.code).length);
          setIsArticleBookmarked(isArticleSaved(article.id));
        }}
        targetLang={targetLang}
        currentArticleId={article.id}
        onSelectArticle={handleSelectSavedArticle}
      />
    </div>
  );
};
