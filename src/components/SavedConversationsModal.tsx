import React, { useState, useEffect } from "react";
import { SavedConversation, SupportedLanguage } from "../types";
import {
  loadSavedConversations,
  deleteSavedConversation,
  updateConversationTitle,
} from "../utils/savedConversationsStorage";
import {
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Clock,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  Plus,
  Languages,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface SavedConversationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: SupportedLanguage;
  activeConversationId?: string;
  onSelectConversation: (conv: SavedConversation) => void;
  onStartNewConversation: () => void;
}

export const SavedConversationsModal: React.FC<SavedConversationsModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  activeConversationId,
  onSelectConversation,
  onStartNewConversation,
}) => {
  const [savedList, setSavedList] = useState<SavedConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterLangOnly, setFilterLangOnly] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleVal, setEditTitleVal] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshList = () => {
    const list = loadSavedConversations(filterLangOnly ? targetLang.code : undefined);
    setSavedList(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, targetLang.code, filterLangOnly]);

  if (!isOpen) return null;

  const filteredConversations = savedList.filter((conv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (conv.title.toLowerCase().includes(q)) return true;
    if (conv.scenario?.title.toLowerCase().includes(q)) return true;
    return conv.messages.some((m) => m.text.toLowerCase().includes(q));
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this saved conversation?")) {
      deleteSavedConversation(id);
      refreshList();
    }
  };

  const handleStartEdit = (e: React.MouseEvent, conv: SavedConversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitleVal(conv.title);
  };

  const handleSaveTitle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitleVal.trim()) {
      updateConversationTitle(id, editTitleVal.trim());
      setEditingId(null);
      refreshList();
    }
  };

  const handleCopyTranscript = (e: React.MouseEvent, conv: SavedConversation) => {
    e.stopPropagation();
    const transcript = conv.messages
      .map(
        (m) =>
          `[${m.role === "user" ? "Learner" : "AI Tutor"}] (${m.timestamp}):\n${m.text}`
      )
      .join("\n\n");

    const header = `=== ${conv.title} (${conv.targetLangName}) ===\nDate: ${new Date(
      conv.createdAt
    ).toLocaleDateString()}\n\n`;

    navigator.clipboard.writeText(header + transcript);
    setCopiedId(conv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (conv: SavedConversation) => {
    onSelectConversation(conv);
    onClose();
  };

  return (
    <div
      id="saved-conversations-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <MessageSquare className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  Saved Conversations Archive
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {savedList.length} Sessions
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review past dialogues, grammar evaluations, and speech practice sessions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Action Buttons */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations by title, scenario, or words..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setFilterLangOnly(!filterLangOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                filterLangOnly
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>
                {filterLangOnly ? `${targetLang.name} Only` : "All Languages"}
              </span>
            </button>

            <button
              onClick={() => {
                onStartNewConversation();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center border border-indigo-100">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                {searchQuery
                  ? "No saved conversations match your search."
                  : `No saved conversations for ${targetLang.name} yet.`}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                While conversing in the <strong>Conversation</strong> tab, click the <strong>"Save Conversation"</strong> button in the header toolbar to store your roleplays and practice transcripts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredConversations.map((conv) => {
                const isCurrentlyActive = conv.id === activeConversationId;
                const dateFormatted = new Date(conv.updatedAt || conv.createdAt).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );
                const timeFormatted = new Date(conv.updatedAt || conv.createdAt).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                const lastUserMsg = [...conv.messages].reverse().find((m) => m.role === "user");

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelect(conv)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                      isCurrentlyActive
                        ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200/50"
                        : "bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200 shadow-2xs hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {conv.scenario && (
                          <span className="text-xs font-black text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center gap-1">
                            <span>🎭</span>
                            <span>{conv.scenario.title}</span>
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100">
                          {conv.targetLangName}
                        </span>
                        {isCurrentlyActive && (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active Session
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                          <Clock className="w-3 h-3" />
                          <span>
                            {dateFormatted} at {timeFormatted}
                          </span>
                        </span>
                      </div>

                      {editingId === conv.id ? (
                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitleVal}
                            onChange={(e) => setEditTitleVal(e.target.value)}
                            className="text-sm font-bold text-slate-900 border border-indigo-300 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 flex-1"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveTitle(e, conv.id)}
                            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                            title="Save title"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition truncate">
                            {conv.title}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleStartEdit(e, conv)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Rename title"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Excerpt of last learner message */}
                      {lastUserMsg && (
                        <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed italic">
                          <span className="font-semibold text-slate-600 not-italic mr-1">You:</span>
                          "{lastUserMsg.text}"
                        </p>
                      )}

                      {/* Meta badges */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-semibold flex-wrap">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>{conv.messageCount} Messages</span>
                        </span>
                        {conv.evaluatedItemsCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{conv.evaluatedItemsCount} Cards Evaluated</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleCopyTranscript(e, conv)}
                        className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                          copiedId === conv.id
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                        title="Copy entire conversation transcript"
                      >
                        {copiedId === conv.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete saved conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelect(conv)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Resume & Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredConversations.length} of {savedList.length} saved conversations
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
