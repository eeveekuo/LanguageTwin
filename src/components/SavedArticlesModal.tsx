import React, { useState, useEffect } from "react";
import { ReadingArticle, SavedArticleItem, SupportedLanguage } from "../types";
import {
  loadSavedArticles,
  removeSavedArticle,
  toggleSavedArticleFavorite,
} from "../utils/savedArticlesStorage";
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Trash2,
  BookOpen,
  Headphones,
  Calendar,
  Sparkles,
  X,
  ArrowRight,
  FolderHeart,
  Star,
  FileText,
  Clock,
  Languages,
} from "lucide-react";

interface SavedArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: SupportedLanguage;
  currentArticleId?: string;
  onSelectArticle: (article: ReadingArticle) => void;
}

export const SavedArticlesModal: React.FC<SavedArticlesModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  currentArticleId,
  onSelectArticle,
}) => {
  const [savedArticles, setSavedArticles] = useState<SavedArticleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterLangOnly, setFilterLangOnly] = useState<boolean>(true);
  const [selectedArticleForDetail, setSelectedArticleForDetail] = useState<SavedArticleItem | null>(null);

  const refreshList = () => {
    const list = loadSavedArticles(filterLangOnly ? targetLang.code : undefined);
    setSavedArticles(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, targetLang.code, filterLangOnly]);

  if (!isOpen) return null;

  const filteredArticles = savedArticles.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.article.title.toLowerCase().includes(q) ||
      item.article.titleTranslation.toLowerCase().includes(q) ||
      (item.article.topic && item.article.topic.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const handleDelete = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (window.confirm("Remove this article from your saved collection?")) {
      removeSavedArticle(articleId);
      refreshList();
      if (selectedArticleForDetail?.id === articleId) {
        setSelectedArticleForDetail(null);
      }
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    toggleSavedArticleFavorite(articleId);
    refreshList();
  };

  const handleChoose = (item: SavedArticleItem) => {
    onSelectArticle(item.article);
    onClose();
  };

  return (
    <div
      id="saved-articles-modal"
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
              <Bookmark className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  Saved Reading & Listening Library
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {savedArticles.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review your saved articles, audio narrations, and comprehension exercises
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

        {/* Toolbar: Search & Language Filter */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved articles by title, topic, or keyword..."
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
          </div>
        </div>

        {/* Articles List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center border border-indigo-100">
                <Bookmark className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                {searchQuery
                  ? "No saved articles match your search."
                  : `No saved articles for ${targetLang.name} yet.`}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                While practicing in the <strong>Reading & Listening</strong> tab, click the <strong>"Save Article"</strong> button to bookmark any story or audio passage for convenient review anytime.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredArticles.map((item) => {
                const isCurrentlyActive = item.id === currentArticleId || item.article.id === currentArticleId;
                const dateFormatted = new Date(item.savedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const wordCount = item.article.paragraphs.reduce(
                  (acc, p) => acc + p.targetText.split(/\s+/).length,
                  0
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => handleChoose(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                      isCurrentlyActive
                        ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200/50"
                        : "bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200 shadow-2xs hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                          {item.article.cefrLevel || "A2"}
                        </span>
                        {item.article.topic && (
                          <span className="text-[11px] font-bold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100">
                            {item.article.topic}
                          </span>
                        )}
                        {isCurrentlyActive && (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Currently Active
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                          <Clock className="w-3 h-3" />
                          <span>Saved {dateFormatted}</span>
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition truncate">
                        {item.article.title}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {item.article.titleTranslation}
                      </p>

                      {/* Excerpt */}
                      {item.article.paragraphs.length > 0 && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic pt-0.5">
                          "{item.article.paragraphs[0].targetText.slice(0, 140)}..."
                        </p>
                      )}

                      {/* Meta badges */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-semibold flex-wrap">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{item.article.paragraphs.length} Paragraphs ({wordCount} words)</span>
                        </span>
                        {item.article.followUpQuestions && (
                          <span className="flex items-center gap-1 text-indigo-600">
                            <Sparkles className="w-3 h-3" />
                            <span>{item.article.followUpQuestions.length} Comprehension Questions</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, item.id)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          item.isFavorite
                            ? "bg-amber-50 border-amber-200 text-amber-500"
                            : "bg-white hover:bg-slate-100 border-slate-200 text-slate-400"
                        }`}
                        title={item.isFavorite ? "Favorited" : "Add to favorites"}
                      >
                        <Star className={`w-4 h-4 ${item.isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete from saved library"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChoose(item)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Practice & Review</span>
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
            Showing {filteredArticles.length} of {savedArticles.length} saved articles
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
