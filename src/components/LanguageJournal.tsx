import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  SupportedLanguage,
  JournalEntry,
  JournalCorrectionResult,
  Deck,
  Flashcard,
} from "../types";
import {
  Search,
  PenTool,
  Sparkles,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Mic,
  MicOff,
  Copy,
  Trash2,
  Heart,
  RefreshCw,
  Plus,
  Tag,
  FileText,
  ChevronRight,
  ChevronDown,
  Download,
  Award,
  ArrowUpDown,
  BookOpen,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  Smile,
  Flame,
  Check,
  RotateCcw,
  BrainCircuit,
  Bot,
  Compass,
  Play,
  Square,
  Pause,
  X,
  Languages,
  Zap,
  Cloud,
  HardDrive,
} from "lucide-react";
import {
  loadJournalEntriesFromLocal,
  saveJournalEntriesToLocal,
} from "../utils/journalStorage";
import { playTextAloud, stopSpeech } from "../utils/speech";

interface LanguageJournalProps {
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  activeDeck: Deck;
  onAddCardToDeck: (card: Partial<Flashcard>) => void;
  isOnline: boolean;
  currentUser?: any;
  isSyncing?: boolean;
  onSyncWithCloud?: (entries: JournalEntry[]) => void;
}

const EMOJI_PALETTE = [
  { emoji: "☀️", label: "Sunny / Happy" },
  { emoji: "🌿", label: "Reflective / Nature" },
  { emoji: "🚀", label: "Motivated / Ambitious" },
  { emoji: "💡", label: "Curious / Insight" },
  { emoji: "☕", label: "Relaxed / Cozy" },
  { emoji: "🌧️", label: "Melancholy / Rainy" },
  { emoji: "🍕", label: "Foodie / Dining" },
  { emoji: "✈️", label: "Travel / Journey" },
  { emoji: "🏆", label: "Proud / Milestone" },
  { emoji: "🌙", label: "Night / Dreams" },
  { emoji: "🎨", label: "Creative / Arts" },
  { emoji: "📖", label: "Study / Books" },
  { emoji: "🎉", label: "Celebration" },
  { emoji: "❤️", label: "Gratitude / Love" },
];

const WRITING_PROMPTS = [
  {
    category: "Daily Life & Routines",
    level: "A1 - A2",
    prompts: [
      "Describe what you did this morning from the moment you woke up.",
      "What is your favorite meal of the day, and how do you prepare it?",
      "Describe the weather today and how it makes you feel.",
      "Write about your favorite place to relax in your neighborhood.",
    ],
  },
  {
    category: "Memories & Storytelling",
    level: "B1 - B2",
    prompts: [
      "Describe a memorable trip or vacation you took in the past.",
      "Write about a person who has inspired you and why.",
      "A funny or unexpected moment that happened to you recently.",
      "Describe a celebration, festival, or holiday you enjoy.",
    ],
  },
  {
    category: "Opinions, Culture & Reflections",
    level: "B2 - C1",
    prompts: [
      "Why are you learning this language, and what is your biggest goal with it?",
      "If you could live anywhere in the world for one year, where would you go?",
      "Discuss a book, movie, or song in your target language that touched you.",
      "What is a cultural habit or tradition from your target language that you admire?",
    ],
  },
];

interface QuickAssistResult {
  targetExpression: string;
  phonetic: string;
  meaningInKnown: string;
  formalityVariants: { register: string; phrase: string; note: string }[];
  wordBreakdown: { word: string; meaning: string; partOfSpeech?: string }[];
  exampleSentence: { target: string; translation: string };
  nuanceTip: string;
}

export const LanguageJournal: React.FC<LanguageJournalProps> = ({
  targetLang,
  knownLang,
  activeDeck,
  onAddCardToDeck,
  isOnline,
  currentUser,
  isSyncing,
  onSyncWithCloud,
}) => {
  // ----------------------------------------------------
  // State
  // ----------------------------------------------------
  const [entries, setEntries] = useState<JournalEntry[]>(() =>
    loadJournalEntriesFromLocal(targetLang, knownLang)
  );

  const [activeEntryId, setActiveEntryId] = useState<string | null>(() => {
    const loaded = loadJournalEntriesFromLocal(targetLang, knownLang);
    return loaded[0]?.id || null;
  });

  // Editor Form State
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("☀️");
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(["daily-life"]);
  const [tagInput, setTagInput] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [correctionResult, setCorrectionResult] =
    useState<JournalCorrectionResult | null>(null);

  // Voice Note Audio State
  const [voiceNoteAudioBase64, setVoiceNoteAudioBase64] = useState<
    string | null
  >(null);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState<number | null>(
    null
  );
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isPlayingVoiceNote, setIsPlayingVoiceNote] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // UI Modes
  const [viewMode, setViewMode] = useState<"editor" | "archive">("editor");
  const [diffViewMode, setDiffViewMode] = useState<
    "side-by-side" | "inline" | "breakdown"
  >("side-by-side");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showPromptMenu, setShowPromptMenu] = useState<boolean>(false);
  const [addedCardIndices, setAddedCardIndices] = useState<Set<number>>(
    new Set()
  );
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // AI Linguistic Co-Pilot State (Reused from Tutor Chat)
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotQuery, setCopilotQuery] = useState<string>("");
  const [copilotQueryType, setCopilotQueryType] = useState<string>("how_to_say");
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);
  const [copilotResult, setCopilotResult] = useState<QuickAssistResult | null>(
    null
  );
  const [copiedCopilotText, setCopiedCopilotText] = useState<string | null>(
    null
  );

  // Archive Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterFavoritesOnly, setFilterFavoritesOnly] =
    useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "words" | "score"
  >("newest");

  // Audio Playback State for text-to-speech
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Textarea Ref for cursor insertion
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ----------------------------------------------------
  // Sync to LocalStorage & Cloud
  // ----------------------------------------------------
  useEffect(() => {
    saveJournalEntriesToLocal(entries);
    if (onSyncWithCloud) {
      onSyncWithCloud(entries);
    }
  }, [entries, onSyncWithCloud]);

  // Load active entry into editor
  useEffect(() => {
    if (activeEntryId) {
      const found = entries.find((e) => e.id === activeEntryId);
      if (found) {
        setTitle(found.title);
        setContent(found.content);
        setSelectedEmoji(found.emoji || "☀️");
        setTags(found.tags || []);
        setIsFavorite(Boolean(found.isFavorite));
        setCorrectionResult(found.correctionResult || null);
        setVoiceNoteAudioBase64(found.voiceNoteAudioBase64 || null);
        setVoiceNoteDuration(found.voiceNoteDuration || null);
        setAddedCardIndices(new Set());
        return;
      }
    }
  }, [activeEntryId, entries]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  // ----------------------------------------------------
  // Actions: New, Save, Delete
  // ----------------------------------------------------
  const handleCreateNewEntry = (promptText?: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newId = `entry-${Date.now()}`;
    const newEntry: JournalEntry = {
      id: newId,
      title: promptText ? `Reflection on: ${promptText.slice(0, 30)}...` : "",
      content: "",
      date: todayStr, // Date is added automatically
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetLangCode: targetLang.code,
      targetLangName: targetLang.name,
      knownLangCode: knownLang.code,
      knownLangName: knownLang.name,
      tags: ["daily-life"],
      wordCount: 0,
      characterCount: 0,
      promptTopic: promptText || undefined,
      mood: "happy",
      emoji: "☀️",
      voiceNoteAudioBase64: null,
      voiceNoteDuration: null,
      isFavorite: false,
      correctionResult: null,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setActiveEntryId(newId);
    setTitle(newEntry.title);
    setContent("");
    setSelectedEmoji("☀️");
    setTags(["daily-life"]);
    setIsFavorite(false);
    setCorrectionResult(null);
    setVoiceNoteAudioBase64(null);
    setVoiceNoteDuration(null);
    setViewMode("editor");
    setShowPromptMenu(false);
  };

  const handleSaveCurrentEntry = () => {
    if (!activeEntryId) {
      handleCreateNewEntry();
      return;
    }

    const trimmedContent = content.trim();
    const words = trimmedContent ? trimmedContent.split(/\s+/).length : 0;
    const chars = trimmedContent.length;

    setEntries((prev) =>
      prev.map((e) => {
        if (e.id === activeEntryId) {
          return {
            ...e,
            title: title.trim() || "Untitled Entry",
            content: trimmedContent,
            emoji: selectedEmoji,
            tags,
            isFavorite,
            voiceNoteAudioBase64,
            voiceNoteDuration,
            wordCount: words,
            characterCount: chars,
            updatedAt: new Date().toISOString(),
            correctionResult,
          };
        }
        return e;
      })
    );

    triggerToast("Entry saved!");
  };

  const handleDeleteEntry = (idToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this journal entry?")) {
      const remaining = entries.filter((e) => e.id !== idToDelete);
      setEntries(remaining);
      if (activeEntryId === idToDelete) {
        if (remaining.length > 0) {
          setActiveEntryId(remaining[0].id);
        } else {
          setActiveEntryId(null);
          setTitle("");
          setContent("");
        }
      }
      triggerToast("Entry deleted");
    }
  };

  const handleToggleFavorite = (idToToggle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEntries((prev) =>
      prev.map((item) => {
        if (item.id === idToToggle) {
          const updatedFav = !item.isFavorite;
          if (item.id === activeEntryId) {
            setIsFavorite(updatedFav);
          }
          return { ...item, isFavorite: updatedFav };
        }
        return item;
      })
    );
  };

  // ----------------------------------------------------
  // Voice Note Audio Recording (MediaRecorder)
  // ----------------------------------------------------
  const startVoiceNoteRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });

        // Convert to base64 for persistent storage
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setVoiceNoteAudioBase64(base64Data);
          setVoiceNoteDuration(recordingSeconds);

          // Update active entry
          if (activeEntryId) {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === activeEntryId
                  ? {
                      ...e,
                      voiceNoteAudioBase64: base64Data,
                      voiceNoteDuration: recordingSeconds,
                      updatedAt: new Date().toISOString(),
                    }
                  : e
              )
            );
          }
          triggerToast("Voice note recorded successfully!");
        };

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsVoiceRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert(
        "Could not access your microphone. Please grant microphone permission to record voice notes."
      );
    }
  };

  const stopVoiceNoteRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsVoiceRecording(false);
  };

  const handleDeleteVoiceNote = () => {
    if (window.confirm("Delete this recorded voice note?")) {
      setVoiceNoteAudioBase64(null);
      setVoiceNoteDuration(null);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setIsPlayingVoiceNote(false);

      if (activeEntryId) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === activeEntryId
              ? {
                  ...e,
                  voiceNoteAudioBase64: null,
                  voiceNoteDuration: null,
                  updatedAt: new Date().toISOString(),
                }
              : e
          )
        );
      }
      triggerToast("Voice note deleted");
    }
  };

  const togglePlayVoiceNote = () => {
    if (!voiceNoteAudioBase64) return;

    if (isPlayingVoiceNote && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingVoiceNote(false);
      return;
    }

    const audio = new Audio(voiceNoteAudioBase64);
    audioPlayerRef.current = audio;
    audio.onended = () => setIsPlayingVoiceNote(false);
    audio.onerror = () => setIsPlayingVoiceNote(false);
    audio.play();
    setIsPlayingVoiceNote(true);
  };

  // ----------------------------------------------------
  // AI Error Checking & Grammar Evaluation
  // ----------------------------------------------------
  const handleCheckGrammarAndProse = async () => {
    if (!content.trim() && !voiceNoteAudioBase64) {
      alert("Please write some text or record a voice note before checking.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/check-journal-prose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || "[Voice Note Entry]",
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          estimatedLevel: activeDeck.level,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: JournalCorrectionResult = await res.json();
      data.checkedAt = new Date().toISOString();

      setCorrectionResult(data);

      // Auto-suggest emoji if provided
      if (data.suggestedEmoji) {
        setSelectedEmoji(data.suggestedEmoji);
      }

      // Also persist to current active entry
      if (activeEntryId) {
        setEntries((prev) =>
          prev.map((e) => {
            if (e.id === activeEntryId) {
              return {
                ...e,
                title: title.trim() || "Untitled Entry",
                content: content.trim(),
                emoji: data.suggestedEmoji || selectedEmoji,
                tags,
                isFavorite,
                wordCount: content.trim().split(/\s+/).length,
                characterCount: content.trim().length,
                updatedAt: new Date().toISOString(),
                correctionResult: data,
              };
            }
            return e;
          })
        );
      }

      triggerToast("AI Error Check & Suggestions ready!");
    } catch (err: any) {
      console.error("Failed to check journal prose:", err);
      setAnalysisError("Error analyzing prose. Using fallback evaluation.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply Corrected Version as current text
  const handleAdoptCorrection = () => {
    if (!correctionResult?.correctedText) return;
    if (
      window.confirm(
        "Would you like to replace your original draft with the fully corrected version?"
      )
    ) {
      setContent(correctionResult.correctedText);
      handleSaveCurrentEntry();
      triggerToast("Updated draft with polished corrections!");
    }
  };

  // Add Extracted Vocabulary to Flashcard Deck
  const handleAddVocabToDeck = (
    vocab: {
      word: string;
      translation: string;
      partOfSpeech: string;
      phonetic?: string;
      exampleSentence?: string;
    },
    index: number
  ) => {
    onAddCardToDeck({
      targetItem: vocab.word,
      definition: vocab.translation,
      partOfSpeech: vocab.partOfSpeech || "Vocabulary",
      phonetic: vocab.phonetic || "",
      usageNotes: `Extracted from Journal entry: "${title || "Language Journal"}"`,
      examples: vocab.exampleSentence
        ? [
            {
              target: vocab.exampleSentence,
              translation: vocab.translation,
            },
          ]
        : [],
      type: "vocabulary",
    });

    setAddedCardIndices((prev) => new Set(prev).add(index));
    triggerToast(`Added "${vocab.word}" to ${activeDeck.title}!`);
  };

  // ----------------------------------------------------
  // AI Linguistic Co-Pilot (Reused from Tutor Chat)
  // ----------------------------------------------------
  const handleCopilotLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!copilotQuery.trim() || isCopilotLoading) return;

    setIsCopilotLoading(true);
    setCopilotResult(null);

    try {
      const res = await fetch("/api/quick-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: copilotQuery.trim(),
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          queryType: copilotQueryType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCopilotResult(data);
      }
    } catch (e) {
      console.error("Co-Pilot lookup failed:", e);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleInsertIntoProse = (textToInsert: string) => {
    if (!textareaRef.current) {
      setContent((prev) => (prev ? prev + " " + textToInsert : textToInsert));
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prev = content;

    const updated =
      prev.substring(0, start) +
      (start > 0 && prev[start - 1] !== " " ? " " : "") +
      textToInsert +
      (end < prev.length && prev[end] !== " " ? " " : "") +
      prev.substring(end);

    setContent(updated);
    triggerToast(`Inserted "${textToInsert}" into your journal draft!`);
  };

  const handleCopyCopilotText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCopilotText(text);
    setTimeout(() => setCopiedCopilotText(null), 2500);
  };

  // Text to Speech playback for written prose
  const handleSpeakText = (textToSpeak: string) => {
    if (!textToSpeak) return;
    playTextAloud(textToSpeak, targetLang.code);
  };

  // Add suggested tag to active tags
  const handleAddSuggestedTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      triggerToast(`Added tag #${clean}`);
    }
  };

  // Export entry as markdown
  const handleExportEntry = (entry: JournalEntry) => {
    const mdContent = `# ${entry.emoji || "📝"} ${entry.title || "Untitled Entry"}
**Date:** ${entry.date}
**Language:** ${entry.targetLangName} (${entry.targetLangCode})
**Tags:** ${entry.tags?.join(", ") || "none"}
**Word Count:** ${entry.wordCount} words
${entry.voiceNoteDuration ? `**Voice Note Duration:** ${Math.floor(entry.voiceNoteDuration / 60)}:${String(entry.voiceNoteDuration % 60).padStart(2, "0")}` : ""}

---

## Original Entry
${entry.content || "[Voice Note Entry]"}

${
  entry.correctionResult
    ? `---

## Corrected Version (CEFR: ${entry.correctionResult.estimatedCEFR} | Score: ${entry.correctionResult.overallScore}/100)
${entry.correctionResult.correctedText}

## Translation (${entry.knownLangName})
${entry.correctionResult.translatedText}

## Summary & Feedback
${entry.correctionResult.summaryFeedback}

## Errors & Corrections
${entry.correctionResult.errors
  ?.map(
    (err, i) =>
      `${i + 1}. **${err.originalText}** ➔ **${err.correctedText}** (${err.errorType})\n   - *Explanation:* ${err.explanation}`
  )
  .join("\n")}
`
    : ""
}
`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-${entry.date}-${entry.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_") || "entry"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast("Exported entry as Markdown!");
  };

  const triggerToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  // ----------------------------------------------------
  // Query & Filter Logic for Archive
  // ----------------------------------------------------
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)) ||
          e.correctionResult?.translatedText?.toLowerCase().includes(q) ||
          e.correctionResult?.correctedText?.toLowerCase().includes(q)
      );
    }

    // 2. Language Filter
    if (filterLanguage !== "all") {
      result = result.filter((e) => e.targetLangCode === filterLanguage);
    }

    // 3. Date Range Filter
    const today = new Date().toISOString().split("T")[0];
    if (filterDateRange === "today") {
      result = result.filter((e) => e.date === today);
    } else if (filterDateRange === "week") {
      const oneWeekAgo = new Date(Date.now() - 7 * 86400000)
        .toISOString()
        .split("T")[0];
      result = result.filter((e) => e.date >= oneWeekAgo);
    } else if (filterDateRange === "month") {
      const oneMonthAgo = new Date(Date.now() - 30 * 86400000)
        .toISOString()
        .split("T")[0];
      result = result.filter((e) => e.date >= oneMonthAgo);
    }

    // 4. Grammar & Type Status Filter
    if (filterStatus === "checked") {
      result = result.filter((e) => Boolean(e.correctionResult));
    } else if (filterStatus === "user_entries") {
      result = result.filter(
        (e) =>
          !e.isExample &&
          !e.id?.startsWith("entry-sample-") &&
          !e.title?.includes("[Example")
      );
    } else if (filterStatus === "examples") {
      result = result.filter(
        (e) =>
          Boolean(e.isExample) ||
          e.id?.startsWith("entry-sample-") ||
          e.title?.includes("[Example")
      );
    } else if (filterStatus === "has_errors") {
      result = result.filter(
        (e) =>
          e.correctionResult &&
          e.correctionResult.errors &&
          e.correctionResult.errors.length > 0
      );
    } else if (filterStatus === "perfect") {
      result = result.filter(
        (e) =>
          e.correctionResult &&
          (!e.correctionResult.errors || e.correctionResult.errors.length === 0)
      );
    } else if (filterStatus === "voice_notes") {
      result = result.filter((e) => Boolean(e.voiceNoteAudioBase64));
    }

    // 5. Tag Filter
    if (filterTag !== "all") {
      result = result.filter((e) => e.tags?.includes(filterTag));
    }

    // 6. Favorites Filter
    if (filterFavoritesOnly) {
      result = result.filter((e) => Boolean(e.isFavorite));
    }

    // 7. Sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.date || b.createdAt).getTime() -
          new Date(a.date || a.createdAt).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.date || a.createdAt).getTime() -
          new Date(b.date || b.createdAt).getTime()
        );
      } else if (sortBy === "words") {
        return (b.wordCount || 0) - (a.wordCount || 0);
      } else if (sortBy === "score") {
        return (
          (b.correctionResult?.overallScore || 0) -
          (a.correctionResult?.overallScore || 0)
        );
      }
      return 0;
    });

    return result;
  }, [
    entries,
    searchQuery,
    filterLanguage,
    filterDateRange,
    filterStatus,
    filterTag,
    filterFavoritesOnly,
    sortBy,
  ]);

  // All unique tags across all entries
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      (e.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Total words written metric
  const totalWordsWritten = useMemo(() => {
    return entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
  }, [entries]);

  // Active Entry Object
  const currentEntry = useMemo(() => {
    return entries.find((e) => e.id === activeEntryId) || null;
  }, [entries, activeEntryId]);

  // Format date nicely
  const formattedActiveDate = useMemo(() => {
    if (!currentEntry?.date) {
      return new Date().toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const [y, m, d] = currentEntry.date.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [currentEntry?.date]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Top Header Card: Title, Stats, Copilot Toggle & View Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Language Journal
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {targetLang.flag} {targetLang.name}
                </span>

                {/* Account Cloud Persistence Status Indicator */}
                {currentUser ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold"
                    title={`All journal entries and audio recordings are saved and synced to your Google Account (${currentUser.email}).`}
                  >
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    <span>Saved to Account</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium"
                    title="Entries are saved locally on this browser. Sign in with Google at the top to sync across all your devices."
                  >
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    <span>Saved Locally</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Freeform immersion writing & voice notes with AI error checking,
                linguistic co-pilot, and searchable entry logs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* AI Co-Pilot Toggle Button */}
          <button
            id="journal-toggle-copilot-btn"
            type="button"
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
              isCopilotOpen
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            }`}
            title="Toggle AI Linguistic Co-Pilot assistant"
          >
            <Bot className="w-4 h-4" />
            <span>AI Co-Pilot</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100/60 text-indigo-900 ml-0.5">
              Assistant
            </span>
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              id="journal-view-editor-btn"
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "editor"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Write & Polish</span>
            </button>

            <button
              id="journal-view-archive-btn"
              onClick={() => setViewMode("archive")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "archive"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Archive ({entries.length})</span>
            </button>
          </div>

          {/* New Entry Button */}
          <button
            id="journal-new-entry-btn"
            onClick={() => handleCreateNewEntry()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EDITOR, VOICE NOTE & PROSE POLISH VIEW */}
      {/* ========================================================================= */}
      {viewMode === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Writing Column */}
          <div
            className={`${
              isCopilotOpen ? "lg:col-span-7" : "lg:col-span-7"
            } space-y-4 transition-all`}
          >
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              {/* Entry Meta Bar: Auto-Date & Emoji Picker & Favorite Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Left: Date Badge & Explicit Example Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Automatic Date Badge (No user date picker) */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{formattedActiveDate}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Auto-logged)
                      </span>
                    </div>

                    {/* Explicit Example Entry Pill Badge */}
                    {Boolean(
                      currentEntry?.isExample ||
                        currentEntry?.id?.startsWith("entry-sample-") ||
                        currentEntry?.title?.includes("[Example") ||
                        title.includes("[Example")
                    ) && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-xs font-black text-amber-900 tracking-wide">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>EXAMPLE ENTRY</span>
                      </div>
                    )}
                  </div>

                  {/* Emoji / Mood Selector & Favorite Toggle */}
                  <div className="flex items-center gap-2">
                    {/* Emoji Selector with Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                        title="Choose entry mood emoji"
                      >
                        <span className="text-base">{selectedEmoji}</span>
                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                          Mood
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {showEmojiPicker && (
                        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 space-y-2 text-xs">
                          <div className="font-bold text-slate-900 pb-1 border-b border-slate-100 flex items-center justify-between text-[11px]">
                            <span>Select Entry Mood Emoji</span>
                            <button
                              onClick={() => setShowEmojiPicker(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {EMOJI_PALETTE.map((item) => (
                              <button
                                key={item.emoji}
                                type="button"
                                onClick={() => {
                                  setSelectedEmoji(item.emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className={`p-2 rounded-xl text-lg hover:bg-indigo-50 hover:scale-110 transition cursor-pointer ${
                                  selectedEmoji === item.emoji
                                    ? "bg-indigo-50 border border-indigo-200 ring-2 ring-indigo-500/20"
                                    : ""
                                }`}
                                title={item.label}
                              >
                                {item.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Favorite Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        isFavorite
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600"
                      }`}
                      title={isFavorite ? "Favorited" : "Mark as favorite"}
                    >
                      <Heart
                        className={`w-4 h-4 ${isFavorite ? "fill-rose-500" : ""}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Example Entry Callout Banner */}
                {Boolean(
                  currentEntry?.isExample ||
                    currentEntry?.id?.startsWith("entry-sample-") ||
                    currentEntry?.title?.includes("[Example") ||
                    title.includes("[Example")
                ) && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-amber-950 flex items-center gap-1.5">
                        <span>📖 Demonstration Example Entry</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase">
                          Sample
                        </span>
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        This entry is a provided starter example demonstrating AI grammar correction, CEFR fluency scoring, vocabulary extraction, and voice notes. You can edit this text freely, or click <strong>"New Entry"</strong> above to write your own thoughts.
                      </p>
                    </div>
                  </div>
                )}

                {/* Entry Title */}
                <input
                  type="text"
                  placeholder={`Entry Title in ${targetLang.name} (e.g. Un día soleado / 今天的反思)...`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg sm:text-xl font-black text-slate-900 placeholder:text-slate-300 border-b border-slate-100 pb-2 focus:outline-hidden focus:border-indigo-500 transition"
                />
              </div>

              {/* Freeform Writing Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="journal-prose-textarea"
                  rows={10}
                  placeholder={`Write freely in ${targetLang.name}... Share your day, describe a memory, express your thoughts, or tell a story.\n\nTip: You can also use the AI Co-Pilot on the right to look up phrases or record a Voice Note below!`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-slate-800 text-sm sm:text-base leading-relaxed p-4 rounded-2xl bg-slate-50/70 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition resize-y font-sans"
                />
              </div>

              {/* Voice Note Audio Recorder / Player Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Voice Note Audio Journal</span>
                  </div>

                  {voiceNoteAudioBase64 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Audio Attached (
                      {voiceNoteDuration
                        ? `${Math.floor(voiceNoteDuration / 60)}:${String(
                            voiceNoteDuration % 60
                          ).padStart(2, "0")}`
                        : "Ready"}
                      )
                    </span>
                  )}
                </div>

                {isVoiceRecording ? (
                  /* Active Recording Bar */
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                      <span className="font-bold text-rose-900">
                        Recording Voice Note...
                      </span>
                      <span className="font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                        {Math.floor(recordingSeconds / 60)}:
                        {String(recordingSeconds % 60).padStart(2, "0")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={stopVoiceNoteRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Stop & Save</span>
                    </button>
                  </div>
                ) : voiceNoteAudioBase64 ? (
                  /* Audio Player Controls */
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlayVoiceNote}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-xs"
                        title={isPlayingVoiceNote ? "Pause" : "Play Voice Note"}
                      >
                        {isPlayingVoiceNote ? (
                          <Pause className="w-3.5 h-3.5 fill-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        )}
                      </button>

                      <div>
                        <div className="font-bold text-slate-800 text-[11px]">
                          {isPlayingVoiceNote ? "Playing Audio..." : "Voice Note Recording"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {voiceNoteDuration
                            ? `${Math.floor(voiceNoteDuration / 60)}:${String(
                                voiceNoteDuration % 60
                              ).padStart(2, "0")}`
                            : "Audio recorded"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={startVoiceNoteRecording}
                        className="px-2.5 py-1 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
                        title="Re-record voice note"
                      >
                        Re-record
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteVoiceNote}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete voice note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Record Voice Note Prompt */
                  <button
                    type="button"
                    onClick={startVoiceNoteRecording}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-indigo-600" />
                    <span>Record Audio Voice Note in {targetLang.name}</span>
                  </button>
                )}
              </div>

              {/* Editor Bottom Tools: Word Count, Prompts & Check Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                {/* Left: Counters & Audio Read-aloud */}
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {content.trim() ? content.trim().split(/\s+/).length : 0}{" "}
                    words
                  </span>
                  <span>·</span>
                  <span>{content.length} chars</span>

                  {/* Audio Listen */}
                  {content.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSpeakText(content)}
                      className={`p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition cursor-pointer ${
                        isPlayingAudio ? "text-indigo-600 bg-indigo-100" : ""
                      }`}
                      title="Listen to your written text"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Right: Prompts Menu, Save & AI Check Buttons */}
                <div className="flex items-center gap-2">
                  {/* Writing Prompts Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPromptMenu(!showPromptMenu)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Prompts</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showPromptMenu && (
                      <div className="absolute right-0 bottom-full mb-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 space-y-3 text-xs">
                        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Writing Inspiration Prompts
                          </span>
                          <button
                            onClick={() => setShowPromptMenu(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        </div>

                        {WRITING_PROMPTS.map((cat, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 uppercase">
                              <span>{cat.category}</span>
                              <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                                {cat.level}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {cat.prompts.map((p, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    handleCreateNewEntry(p);
                                  }}
                                  className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/80 hover:text-indigo-900 border border-slate-100 text-xs text-slate-700 transition cursor-pointer"
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save Draft Button */}
                  <button
                    type="button"
                    onClick={handleSaveCurrentEntry}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition cursor-pointer"
                  >
                    Save Draft
                  </button>

                  {/* AI Check Grammar Button */}
                  <button
                    id="journal-check-prose-btn"
                    type="button"
                    onClick={handleCheckGrammarAndProse}
                    disabled={isAnalyzing || (!content.trim() && !voiceNoteAudioBase64)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm shadow-indigo-200 transition cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Check Grammar & Prose</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tags Section: AI Suggested Tags + Manual Tag Adding */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-500">Tags:</span>

                  {/* Active Tags */}
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        className="hover:text-rose-500 font-bold ml-0.5 cursor-pointer"
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {/* Manual Tag Input */}
                  <input
                    type="text"
                    placeholder="+ Add custom tag (enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault();
                        const clean = tagInput.trim().replace(/^#/, "");
                        if (clean && !tags.includes(clean)) {
                          setTags([...tags, clean]);
                        }
                        setTagInput("");
                      }
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 py-0.5 px-2"
                  />
                </div>

                {/* AI Suggested Tags Bar */}
                {correctionResult?.suggestedTags &&
                  correctionResult.suggestedTags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        AI Suggested:
                      </span>
                      {correctionResult.suggestedTags.map((sTag) => {
                        const clean = sTag.replace(/^#/, "");
                        const isAlreadyAdded = tags.includes(clean);
                        return (
                          <button
                            key={clean}
                            type="button"
                            onClick={() => handleAddSuggestedTag(clean)}
                            disabled={isAlreadyAdded}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                              isAlreadyAdded
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {isAlreadyAdded ? `✓ #${clean}` : `+ #${clean}`}
                          </button>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Co-Pilot Assistant OR Error Analysis Breakdown */}
          <div className="lg:col-span-5 space-y-4">
            {/* ========================================================================= */}
            {/* AI LINGUISTIC CO-PILOT PANEL (Reused from Tutor Chat) */}
            {/* ========================================================================= */}
            {isCopilotOpen && (
              <div className="bg-white rounded-3xl p-5 border-2 border-indigo-500 shadow-md space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        AI Linguistic Co-Pilot
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Instant phrasing assistant for {targetLang.name}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCopilotOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    title="Close Co-Pilot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Copilot Mode Tabs */}
                <div className="grid grid-cols-3 gap-1 text-[11px] font-bold bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "how_to_say", label: "How to Say" },
                    { id: "lookup_word", label: "Word Lookup" },
                    { id: "check_nuance", label: "Nuance" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCopilotQueryType(tab.id)}
                      className={`py-1 px-1.5 rounded-lg transition cursor-pointer text-center ${
                        copilotQueryType === tab.id
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Query Form */}
                <form onSubmit={handleCopilotLookup} className="space-y-2">
                  <div className="relative">
                    <input
                      id="journal-copilot-input"
                      type="text"
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      placeholder={
                        copilotQueryType === "how_to_say"
                          ? "e.g. Can you make it less spicy?"
                          : copilotQueryType === "lookup_word"
                          ? `e.g. ${targetLang.name} word to explain...`
                          : "e.g. Is this phrasing too informal?"
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-16 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={isCopilotLoading || !copilotQuery.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold disabled:opacity-50 transition cursor-pointer"
                    >
                      {isCopilotLoading ? "..." : "Ask"}
                    </button>
                  </div>
                </form>

                {/* Co-Pilot Result Display */}
                {isCopilotLoading && (
                  <div className="p-5 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-600 animate-spin" />
                    <span>Consulting linguistic database for {targetLang.name}...</span>
                  </div>
                )}

                {copilotResult && !isCopilotLoading && (
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {/* Recommended Expression */}
                    <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider block">
                            Recommended Expression:
                          </span>
                          <h4 className="text-base font-extrabold text-indigo-950 mt-0.5">
                            {copilotResult.targetExpression}
                          </h4>
                          {copilotResult.phonetic && (
                            <p className="text-xs font-serif text-indigo-700/80">
                              {copilotResult.phonetic}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-1 font-medium">
                            {copilotResult.meaningInKnown}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              handleSpeakText(copilotResult.targetExpression)
                            }
                            className="p-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 transition cursor-pointer"
                            title="Listen"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleCopyCopilotText(
                                copilotResult.targetExpression
                              )
                            }
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                            title="Copy"
                          >
                            {copiedCopilotText ===
                            copilotResult.targetExpression ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Insert directly into Journal Textarea */}
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertIntoProse(copilotResult.targetExpression)
                        }
                        className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insert into Journal Draft</span>
                      </button>
                    </div>

                    {/* Formality Variants */}
                    {copilotResult.formalityVariants &&
                      copilotResult.formalityVariants.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                            Formality Registers:
                          </span>
                          <div className="space-y-1 text-xs">
                            {copilotResult.formalityVariants.map((v, i) => (
                              <div
                                key={i}
                                onClick={() => handleInsertIntoProse(v.phrase)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition cursor-pointer flex items-center justify-between"
                                title="Click to insert into draft"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">
                                    {v.phrase}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">
                                    {v.note}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                  {v.register}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Nuance Tip */}
                    {copilotResult.nuanceTip && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                        <span className="font-bold block mb-0.5 text-[11px]">
                          💡 Usage Nuance:
                        </span>
                        <p className="text-[11px] leading-relaxed">
                          {copilotResult.nuanceTip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* AI ERROR CHECK & PROSE POLISH CARD */}
            {/* ========================================================================= */}
            {correctionResult ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                {/* Score & CEFR Level Card */}
                <div className="bg-linear-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-4 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                        Prose Evaluation
                      </div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        {correctionResult.overallScore}/100 Overall
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-extrabold text-xs shadow-xs">
                        CEFR {correctionResult.estimatedCEFR}
                      </span>
                      <span className="capitalize text-xs font-bold px-2.5 py-1 rounded-full bg-white text-indigo-800 border border-indigo-200">
                        {correctionResult.fluencyRating.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Summary Feedback */}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {correctionResult.summaryFeedback}
                  </p>

                  {/* Sub-scores metrics bar */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-200/60 text-center">
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        Grammar
                      </div>
                      <div className="text-sm font-black text-indigo-900">
                        {correctionResult.grammarScore}%
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        Vocabulary
                      </div>
                      <div className="text-sm font-black text-indigo-900">
                        {correctionResult.vocabularyScore}%
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        Naturalness
                      </div>
                      <div className="text-sm font-black text-indigo-900">
                        {correctionResult.naturalnessScore}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Switcher for Analysis: Side-by-side vs Inline vs Grammar list */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setDiffViewMode("side-by-side")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        diffViewMode === "side-by-side"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Side-by-Side
                    </button>
                    <button
                      onClick={() => setDiffViewMode("inline")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        diffViewMode === "inline"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Errors ({correctionResult.errors?.length || 0})
                    </button>
                    <button
                      onClick={() => setDiffViewMode("breakdown")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        diffViewMode === "breakdown"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Phrasing & Vocab
                    </button>
                  </div>

                  {/* Adopt Corrected Version Button */}
                  <button
                    type="button"
                    onClick={handleAdoptCorrection}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                    title="Adopt the corrected version into your main text"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Draft</span>
                  </button>
                </div>

                {/* ==================== SUB-VIEW 1: SIDE-BY-SIDE ==================== */}
                {diffViewMode === "side-by-side" && (
                  <div className="space-y-4">
                    {/* Corrected Text Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Polished Version ({targetLang.name})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleSpeakText(correctionResult.correctedText)
                          }
                          className="text-slate-500 hover:text-indigo-600 p-1"
                          title="Listen to corrected audio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {correctionResult.correctedText}
                      </div>
                    </div>

                    {/* Translation Box */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>English Translation</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                        {correctionResult.translatedText}
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== SUB-VIEW 2: DETAILED ERRORS ==================== */}
                {diffViewMode === "inline" && (
                  <div className="space-y-3">
                    {correctionResult.errors &&
                    correctionResult.errors.length > 0 ? (
                      <div className="space-y-2.5">
                        {correctionResult.errors.map((err, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="capitalize font-bold text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {err.errorType}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 font-medium">
                              <span className="line-through text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                {err.originalText}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {err.correctedText}
                              </span>
                            </div>

                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {err.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <div className="font-bold text-emerald-900 text-sm">
                          Flawless Prose!
                        </div>
                        <p className="text-xs text-emerald-700">
                          No grammatical or spelling errors were detected in
                          your writing.
                        </p>
                      </div>
                    )}

                    {/* Positive Highlights */}
                    {correctionResult.positiveHighlights &&
                      correctionResult.positiveHighlights.length > 0 && (
                        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 text-xs">
                          <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>What you did well</span>
                          </div>
                          <ul className="space-y-1 list-disc list-inside text-indigo-800 text-[11px]">
                            {correctionResult.positiveHighlights.map(
                              (pos, pIdx) => (
                                <li key={pIdx}>{pos}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                {/* ==================== SUB-VIEW 3: PHRASING & EXTRACT VOCAB ==================== */}
                {diffViewMode === "breakdown" && (
                  <div className="space-y-4">
                    {/* Natural Phrasings */}
                    {correctionResult.naturalPhrasings &&
                      correctionResult.naturalPhrasings.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>Native Idiomatic Alternatives</span>
                          </div>
                          <div className="space-y-2">
                            {correctionResult.naturalPhrasings.map(
                              (phr, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs space-y-1"
                                >
                                  <div className="text-slate-500 text-[11px]">
                                    Original: "{phr.originalExcerpt}"
                                  </div>
                                  <div className="font-bold text-amber-900">
                                    Native Suggestion: "{phr.suggestedAlternative}"
                                  </div>
                                  <div className="text-slate-600 text-[11px]">
                                    {phr.explanation}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Extracted Vocabulary -> Convert to Flashcards */}
                    {correctionResult.extractedVocabulary &&
                      correctionResult.extractedVocabulary.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-between">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-indigo-600" />
                              <span>Extract Vocabulary to Flashcards</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Active: {activeDeck.title}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {correctionResult.extractedVocabulary.map(
                              (vocab, vIdx) => {
                                const isAdded = addedCardIndices.has(vIdx);
                                return (
                                  <div
                                    key={vIdx}
                                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div>
                                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                                        <span>{vocab.word}</span>
                                        {vocab.phonetic && (
                                          <span className="font-normal text-slate-400 text-[10px]">
                                            {vocab.phonetic}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-slate-600 text-[11px]">
                                        {vocab.translation} ({vocab.partOfSpeech})
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAddVocabToDeck(vocab, vIdx)
                                      }
                                      disabled={isAdded}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                        isAdded
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Added</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Add to Deck</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ) : (
              /* Default state when not analyzed */
              !isCopilotOpen && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Linguistic Proofreader
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Write your prose or record an audio voice note on the left,
                    then click <strong>Check Grammar & Prose</strong> to receive
                    a detailed breakdown of your verb conjugations, grammar
                    accuracy, CEFR score, and native phrasing alternatives.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsCopilotOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Open AI Linguistic Co-Pilot</span>
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEARCHABLE & QUERYABLE ARCHIVE VIEW */}
      {/* ========================================================================= */}
      {viewMode === "archive" && (
        <div className="space-y-4">
          {/* Filter & Query Toolbar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="journal-archive-search"
                type="text"
                placeholder="Search entries by keywords, topics, translation, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">
                  Date:
                </span>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">
                  Status:
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Entries</option>
                  <option value="user_entries">My Entries Only</option>
                  <option value="examples">Example Entries Only</option>
                  <option value="checked">AI Checked</option>
                  <option value="voice_notes">With Voice Notes</option>
                  <option value="perfect">Perfect / No Errors</option>
                  <option value="has_errors">Has Corrections</option>
                </select>
              </div>

              {/* Tags Filter */}
              {allUniqueTags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">
                    Tag:
                  </span>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">All Tags</option>
                    {allUniqueTags.map((t) => (
                      <option key={t} value={t}>
                        #{t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="words">Most Words</option>
                  <option value="score">Highest Score</option>
                </select>
              </div>

              {/* Favorites Only Toggle */}
              <button
                type="button"
                onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  filterFavoritesOnly
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    filterFavoritesOnly ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
                <span>Favorites</span>
              </button>
            </div>
          </div>

          {/* Entries Grid */}
          {filteredAndSortedEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => {
                    setActiveEntryId(entry.id);
                    setViewMode("editor");
                  }}
                  className={`bg-white rounded-3xl p-5 border transition cursor-pointer hover:shadow-md space-y-3 flex flex-col justify-between ${
                    entry.id === activeEntryId
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Bar: Date, Mood & Score */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold flex-wrap">
                        <span className="text-sm">{entry.emoji || "📝"}</span>
                        <span>{entry.date}</span>
                        {Boolean(
                          entry.isExample ||
                            entry.id?.startsWith("entry-sample-") ||
                            entry.title?.includes("[Example")
                        ) && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-[10px] tracking-wide">
                            EXAMPLE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {entry.voiceNoteAudioBase64 && (
                          <span
                            className="p-1 rounded-md bg-indigo-50 text-indigo-600"
                            title="Contains Voice Note"
                          >
                            <Mic className="w-3 h-3" />
                          </span>
                        )}

                        {entry.correctionResult ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                            {entry.correctionResult.overallScore}% · CEFR{" "}
                            {entry.correctionResult.estimatedCEFR}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                            Draft
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(entry.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              entry.isFavorite
                                ? "fill-rose-500 text-rose-500"
                                : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-slate-900 line-clamp-1">
                      {entry.title || "Untitled Entry"}
                    </h4>

                    {/* Content Preview */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {entry.content ||
                        (entry.voiceNoteAudioBase64
                          ? "🎙️ [Audio Voice Note Entry]"
                          : "Empty draft...")}
                    </p>
                  </div>

                  {/* Bottom Metadata & Quick Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {entry.wordCount || 0} words
                      </span>
                      {entry.tags?.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportEntry(entry);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                        title="Export as Markdown"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteEntry(entry.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-base">
                No matching journal entries found
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search keywords or active filters, or write a
                new entry to start building your language archive.
              </p>
              <button
                type="button"
                onClick={() => handleCreateNewEntry()}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-2xl shadow-xs"
              >
                Create New Entry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
