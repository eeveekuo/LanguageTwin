import { ReadingArticle, SavedArticleItem } from "../types";

const STORAGE_KEY_SAVED_ARTICLES = "languagetwin_saved_articles_v1";

/**
 * Load all saved articles from localStorage, optionally filtered by target language code
 */
export function loadSavedArticles(targetLangCode?: string): SavedArticleItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_ARTICLES);
    if (!raw) return [];
    const items: SavedArticleItem[] = JSON.parse(raw);
    if (!Array.isArray(items)) return [];

    if (targetLangCode) {
      return items.filter(
        (item) => item.targetLangCode.toLowerCase() === targetLangCode.toLowerCase()
      );
    }
    return items;
  } catch (err) {
    console.warn("Failed to load saved articles from storage:", err);
    return [];
  }
}

/**
 * Save an article to the persistent library
 */
export function saveArticleToStorage(
  article: ReadingArticle,
  notes?: string
): SavedArticleItem {
  const current = loadSavedArticles();
  const existingIndex = current.findIndex(
    (item) => item.id === article.id || item.article.id === article.id
  );

  const savedItem: SavedArticleItem = {
    id: article.id,
    article,
    savedAt: new Date().toISOString(),
    targetLangCode: article.targetLanguageCode || "es",
    notes: notes || "",
    isFavorite: false,
    lastReadAt: new Date().toISOString(),
  };

  let updated: SavedArticleItem[];
  if (existingIndex >= 0) {
    // Update existing
    updated = [...current];
    updated[existingIndex] = {
      ...updated[existingIndex],
      article,
      notes: notes !== undefined ? notes : updated[existingIndex].notes,
      lastReadAt: new Date().toISOString(),
    };
  } else {
    // Prepend new
    updated = [savedItem, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_ARTICLES, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to persist saved article:", err);
  }

  return savedItem;
}

/**
 * Remove an article from saved storage by ID
 */
export function removeSavedArticle(articleId: string): void {
  const current = loadSavedArticles();
  const updated = current.filter(
    (item) => item.id !== articleId && item.article.id !== articleId
  );
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_ARTICLES, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to remove saved article:", err);
  }
}

/**
 * Check if an article is currently saved in storage
 */
export function isArticleSaved(articleId: string): boolean {
  if (!articleId) return false;
  const current = loadSavedArticles();
  return current.some(
    (item) => item.id === articleId || item.article.id === articleId
  );
}

/**
 * Toggle save status of an article
 */
export function toggleSaveArticle(article: ReadingArticle): boolean {
  if (isArticleSaved(article.id)) {
    removeSavedArticle(article.id);
    return false;
  } else {
    saveArticleToStorage(article);
    return true;
  }
}

/**
 * Toggle favorite status of a saved article
 */
export function toggleSavedArticleFavorite(articleId: string): boolean {
  const current = loadSavedArticles();
  const index = current.findIndex(
    (item) => item.id === articleId || item.article.id === articleId
  );
  if (index === -1) return false;

  const newFavStatus = !current[index].isFavorite;
  current[index].isFavorite = newFavStatus;

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_ARTICLES, JSON.stringify(current));
  } catch (err) {
    console.warn("Failed to update favorite status:", err);
  }

  return newFavStatus;
}
