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
} from "lucide-react";

interface AITutorChatProps {
  deck: Deck;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onTutorItemsEvaluated?: (evaluatedItems: EvaluatedItemInChat[], userMessage: string) => void;
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-4">
      {/* Tutor Header Bento Tile */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Conversation ({targetLang.name})</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                SRS Cross-Evaluation Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chat naturally in {targetLang.name}. The AI evaluates your deck items and grammar in live dialogue and updates your SRS mastery!
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title="Restart conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

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

      {/* Live Cross-Evaluation Banner (if previous message evaluated cards) */}
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
                className={`max-w-[80%] rounded-2xl p-4 space-y-1.5 shadow-xs text-sm ${
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

                {/* Read Aloud Button for Tutor message */}
                {!isUser && (
                  <div className="pt-1 flex items-center justify-end">
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
            placeholder={`Chat with your tutor in ${targetLang.name} (e.g., use words from your deck)...`}
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
  );
};
