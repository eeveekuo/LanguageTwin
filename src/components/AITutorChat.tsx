import React, { useState, useRef, useEffect } from "react";
import { Deck, SupportedLanguage, ChatMessage, EvaluatedItemInChat, Flashcard } from "../types";
import { playTextAloud, stopSpeech, isSpeechRecognitionSupported, createSpeechRecognizer } from "../utils/speech";
import {
  Send,
  Mic,
  Volume2,
  Bot,
  User,
  RotateCcw,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  Search,
  BookOpen,
  Compass,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Plus,
  MessageSquare,
  Zap,
  Languages,
} from "lucide-react";

interface AITutorChatProps {
  deck: Deck;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onTutorItemsEvaluated?: (evaluatedItems: EvaluatedItemInChat[], userMessage: string) => void;
}

interface QuickAssistResult {
  targetExpression: string;
  phonetic: string;
  meaningInKnown: string;
  formalityVariants: { register: string; phrase: string; note: string }[];
  wordBreakdown: { word: string; meaning: string; partOfSpeech?: string }[];
  exampleSentence: { target: string; translation: string };
  nuanceTip: string;
}

interface ScenarioData {
  title: string;
  category: string;
  scenarioPrompt: string;
  targetWordsToUse: string[];
  openingGreeting: string;
  openingGreetingTranslation: string;
}

export const AITutorChat: React.FC<AITutorChatProps> = ({
  deck,
  targetLang,
  knownLang,
  onTutorItemsEvaluated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [lastEvaluatedBatch, setLastEvaluatedBatch] = useState<EvaluatedItemInChat[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scenario state
  const [scenarioPrompt, setScenarioPrompt] = useState<string>("");
  const [isScenarioExpanded, setIsScenarioExpanded] = useState<boolean>(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioData | null>(null);

  // Side Tab / Linguistic Co-Pilot State
  const [isSideTabOpen, setIsSideTabOpen] = useState<boolean>(false);
  const [assistQuery, setAssistQuery] = useState<string>("");
  const [assistQueryType, setAssistQueryType] = useState<string>("how_to_say");
  const [isAssistLoading, setIsAssistLoading] = useState<boolean>(false);
  const [assistResult, setAssistResult] = useState<QuickAssistResult | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Initialize tutor welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const topWords = deck.cards.slice(0, 4).map((c) => `"${c.targetItem}"`).join(", ");
      setMessages([
        {
          id: "welcome-1",
          role: "model",
          text: `👋 Hello! I am your AI ${targetLang.name} language tutor. Let's practice conversing! As we chat, I evaluate your usage and update your flashcard mastery scores. Try using items from your deck like ${topWords}. How is your day going?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [deck.id, targetLang.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const recognizer = createSpeechRecognizer(targetLang.code, {
        onStart: () => setIsRecording(true),
        onResult: (transcript) => {
          setInputVal(transcript);
        },
        onError: () => setIsRecording(false),
        onEnd: () => setIsRecording(false),
      });
      if (recognizer) {
        recognitionRef.current = recognizer;
        try {
          recognizer.start();
        } catch (e) {
          console.warn("Recognizer start failed:", e);
        }
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userText = inputVal.trim();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInputVal("");
    setIsLoading(true);
    setLastEvaluatedBatch([]);

    try {
      const deckItemsPayload = deck.cards.map((c) => ({
        id: c.id,
        targetItem: c.targetItem,
        definition: c.definition,
        partOfSpeech: c.partOfSpeech,
        frequencyRank: c.frequencyRank,
      }));

      const response = await fetch("/api/ai-tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, text: m.text })),
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          activeDeckTitle: deck.title,
          recentTargetWords: deck.cards.slice(0, 10).map((c) => c.targetItem),
          userProficiency: deck.level,
          scenarioPrompt: scenarioPrompt.trim() || undefined,
          deckCards: deckItemsPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      const modelReply: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: "model",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelReply]);

      if (data.evaluatedItems && Array.isArray(data.evaluatedItems) && data.evaluatedItems.length > 0) {
        setLastEvaluatedBatch(data.evaluatedItems);
        onTutorItemsEvaluated?.(data.evaluatedItems, userText);
      }
    } catch (err) {
      console.error("Tutor chat failed:", err);
      const fallbackReply: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `¡Muy bien! (Note: Could not reach evaluation server, but your practice counts!)`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setLastEvaluatedBatch([]);
    stopSpeech();
  };

  // Generate Random Scenario from Backend
  const handleGenerateRandomScenario = async (theme = "any") => {
    setIsGeneratingScenario(true);
    try {
      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          level: deck.level || "A2/B1",
          theme,
        }),
      });

      if (res.ok) {
        const data: ScenarioData = await res.json();
        setActiveScenario(data);
        setScenarioPrompt(data.scenarioPrompt);
        setIsScenarioExpanded(true);

        // Prepend new opening line from tutor in character
        setMessages([
          {
            id: `scenario-init-${Date.now()}`,
            role: "model",
            text: `🎭 [Scenario: ${data.title}]\n\n${data.openingGreeting}\n\n💡 (${data.openingGreetingTranslation})`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (e) {
      console.error("Scenario generation failed:", e);
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  // Quick Linguistic Co-Pilot Query
  const handleQuickAssistLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!assistQuery.trim() || isAssistLoading) return;

    setIsAssistLoading(true);
    setAssistResult(null);

    try {
      const res = await fetch("/api/quick-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: assistQuery.trim(),
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          queryType: assistQueryType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssistResult(data);
      }
    } catch (e) {
      console.error("Quick assist lookup failed:", e);
    } finally {
      setIsAssistLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleInsertIntoInput = (text: string) => {
    setInputVal((prev) => (prev ? `${prev} ${text}` : text));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-4 relative">
      {/* Header Bento Tile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-white border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">Conversation & Roleplay ({targetLang.name})</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                SRS Live Cross-Evaluation
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chat naturally in {targetLang.name} with realistic scenarios. Use the side Co-Pilot to look up phrases without interrupting conversation!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Side Tab / Co-Pilot Toggle Button */}
          <button
            id="toggle-side-copilot-btn"
            onClick={() => setIsSideTabOpen(!isSideTabOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition border cursor-pointer ${
              isSideTabOpen
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
            }`}
            title="Linguistic Co-Pilot & Quick Word Lookup"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{isSideTabOpen ? "Hide Co-Pilot" : "AI Co-Pilot & Lookup"}</span>
          </button>

          <button
            onClick={handleResetChat}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Restart conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Roleplay Scenario Prompt & Generator Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <div
          onClick={() => setIsScenarioExpanded(!isScenarioExpanded)}
          className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Conversation Scenario & Roleplay Setting
                </span>
                {scenarioPrompt.trim() ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Scenario
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    Free Conversation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate max-w-lg mt-0.5">
                {activeScenario?.title || scenarioPrompt.trim() || "Set a custom scenario or generate one with AI to guide the tutor's persona."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 hidden sm:inline">
              {isScenarioExpanded ? "Collapse" : "Configure Scenario"}
            </span>
            {isScenarioExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {/* Expanded Scenario Configuration Box */}
        {isScenarioExpanded && (
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
            {/* Quick Generator Themes */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-600">Quick Scenario Generator:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: "☕ Cafe & Dining", theme: "ordering food and drinks at a local cafe" },
                  { label: "🚆 Travel & Directions", theme: "asking for train directions and buying tickets" },
                  { label: "🛍️ Shopping", theme: "shopping at an open market and asking prices" },
                  { label: "🤝 New Friends", theme: "introducing hobbies and meeting a new friend" },
                  { label: "🎲 Any Random", theme: "everyday life adventure" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleGenerateRandomScenario(item.theme)}
                    disabled={isGeneratingScenario}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Scenario Textarea */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Custom Scenario Prompt / Roleplay Objective:
              </label>
              <textarea
                id="custom-scenario-input"
                rows={2}
                value={scenarioPrompt}
                onChange={(e) => setScenarioPrompt(e.target.value)}
                placeholder="e.g., You are a friendly barista at a cafe in Seoul. I am an exchange student trying to order a hot latte with oat milk and ask what pastries you recommend..."
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-400"
              />
            </div>

            {/* Action buttons inside scenario drawer */}
            <div className="flex items-center justify-between pt-1">
              {activeScenario?.targetWordsToUse && activeScenario.targetWordsToUse.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-500 text-[11px]">Recommended phrases to try:</span>
                  {activeScenario.targetWordsToUse.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => handleInsertIntoInput(w)}
                      className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold hover:bg-purple-100 transition cursor-pointer"
                    >
                      + {w}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {scenarioPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setScenarioPrompt("");
                      setActiveScenario(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
                  >
                    Clear Scenario
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScenarioExpanded(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Chat Thread + Co-Pilot Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left / Main Chat Column */}
        <div className={`space-y-4 transition-all duration-300 ${isSideTabOpen ? "lg:col-span-7" : "lg:col-span-12"}`}>
          {/* Target Flashcard Chips Bar */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar shadow-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0">
              Click to Insert Word:
            </span>
            {deck.cards.slice(0, 10).map((c) => (
              <button
                key={c.id}
                onClick={() => setInputVal((prev) => (prev ? `${prev} ${c.targetItem}` : c.targetItem))}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition border cursor-pointer font-semibold ${
                  c.isCommonError
                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    : "bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200"
                }`}
              >
                {c.isCommonError ? `Slip: ${c.correctedForm || c.targetItem}` : c.targetItem}
              </button>
            ))}
          </div>

          {/* Live Cross-Evaluation Banner */}
          {lastEvaluatedBatch.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Deck Mastery Updated from Your Chat Message:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {lastEvaluatedBatch.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200 text-[11px] font-semibold text-emerald-950 flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="font-bold text-indigo-700">"{item.targetItem}"</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-bold">{item.score}% Score</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 capitalize">{item.masteryLevel}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chat Thread Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 h-[460px] overflow-y-auto space-y-4 shadow-sm">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-indigo-600 border border-slate-200"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-1.5 shadow-xs text-sm ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between gap-4 text-[10px] mb-0.5 font-semibold ${
                        isUser ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      <span>{isUser ? "You" : `AI ${targetLang.name} Tutor`}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                    {/* Quick actions for Tutor message */}
                    {!isUser && (
                      <div className="pt-1.5 flex items-center justify-end gap-1.5 border-t border-slate-200/40 mt-2">
                        <button
                          onClick={() => {
                            setAssistQuery(msg.text.split("\n")[0]);
                            setAssistQueryType("lookup_word");
                            setIsSideTabOpen(true);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 border border-slate-200 text-[10px] font-bold transition cursor-pointer"
                          title="Analyze in Co-Pilot"
                        >
                          Decompose
                        </button>
                        <button
                          onClick={() => handlePlayAudio(msg.text, msg.id)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            playingAudioId === msg.id
                              ? "bg-indigo-600 text-white"
                              : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-200"
                          }`}
                          title="Listen to audio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-indigo-600 border border-slate-200 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Tutor is analyzing your usage and formulating reply in {targetLang.name}...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="relative flex items-center">
              <input
                id="tutor-chat-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={`Chat in ${targetLang.name} (use Co-Pilot side tab if you need help with words)...`}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-4 pr-24 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition"
                disabled={isLoading}
              />

              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  id="tutor-mic-btn"
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                  title={isRecording ? "Stop speaking" : "Speak in target language"}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  id="tutor-send-btn"
                  type="submit"
                  disabled={isLoading || !inputVal.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition shadow-md shadow-indigo-100 cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Linguistic Co-Pilot Side Drawer */}
        {isSideTabOpen && (
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Linguistic Co-Pilot</h3>
                  <p className="text-[11px] text-slate-500">Ask questions & lookup words mid-chat</p>
                </div>
              </div>

              <button
                onClick={() => setIsSideTabOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Mode Buttons */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
              {[
                { id: "how_to_say", label: "How to say?" },
                { id: "lookup_word", label: "Word Lookup" },
                { id: "polite_vs_casual", label: "Politeness" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAssistQueryType(tab.id)}
                  className={`py-1.5 px-2 rounded-xl transition cursor-pointer text-center ${
                    assistQueryType === tab.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Query Form */}
            <form onSubmit={handleQuickAssistLookup} className="space-y-2">
              <div className="relative">
                <input
                  id="side-copilot-input"
                  type="text"
                  value={assistQuery}
                  onChange={(e) => setAssistQuery(e.target.value)}
                  placeholder={
                    assistQueryType === "how_to_say"
                      ? "e.g. Can you make it less spicy?"
                      : assistQueryType === "lookup_word"
                      ? `e.g. ${targetLang.name} word to explain...`
                      : "e.g. Is this phrasing too informal?"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-3 pr-20 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={isAssistLoading || !assistQuery.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold disabled:opacity-50 transition cursor-pointer"
                >
                  {isAssistLoading ? "..." : "Ask"}
                </button>
              </div>
            </form>

            {/* Result Display */}
            {isAssistLoading && (
              <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600 animate-spin" />
                <span>Consulting linguistic database for {targetLang.name}...</span>
              </div>
            )}

            {assistResult && !isAssistLoading && (
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {/* Main Translated Expression */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider block">
                        Recommended Expression:
                      </span>
                      <h4 className="text-base font-extrabold text-indigo-950 mt-0.5">
                        {assistResult.targetExpression}
                      </h4>
                      {assistResult.phonetic && (
                        <p className="text-xs font-serif text-indigo-700/80">{assistResult.phonetic}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {assistResult.meaningInKnown}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => playTextAloud(assistResult.targetExpression, targetLang.code)}
                        className="p-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 transition cursor-pointer"
                        title="Listen"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyText(assistResult.targetExpression)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                        title="Copy"
                      >
                        {copiedText === assistResult.targetExpression ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInsertIntoInput(assistResult.targetExpression)}
                    className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert into Chat Input</span>
                  </button>
                </div>

                {/* Formality Variants */}
                {assistResult.formalityVariants && assistResult.formalityVariants.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      Formality Registers:
                    </span>
                    <div className="space-y-1 text-xs">
                      {assistResult.formalityVariants.map((v, i) => (
                        <div
                          key={i}
                          onClick={() => handleInsertIntoInput(v.phrase)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{v.phrase}</span>
                            <span className="text-[10px] text-slate-500 block">{v.note}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {v.register}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Word Breakdown */}
                {assistResult.wordBreakdown && assistResult.wordBreakdown.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      Word Breakdown:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assistResult.wordBreakdown.map((w, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-800 flex items-center gap-1"
                        >
                          <span className="font-bold text-indigo-700">{w.word}</span>
                          <span className="text-slate-400">=</span>
                          <span className="text-slate-600">{w.meaning}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nuance Tip */}
                {assistResult.nuanceTip && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <span className="font-bold block mb-0.5">💡 Usage Nuance:</span>
                    <p className="text-[11px] leading-relaxed">{assistResult.nuanceTip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
