import { ChatMessage, SavedConversation, ScenarioData } from "../types";

const STORAGE_KEY_SAVED_CONVERSATIONS = "languagetwin_saved_conversations_v1";

/**
 * Load all saved conversations from localStorage, optionally filtered by target language code
 */
export function loadSavedConversations(targetLangCode?: string): SavedConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_CONVERSATIONS);
    if (!raw) return [];
    const items: SavedConversation[] = JSON.parse(raw);
    if (!Array.isArray(items)) return [];

    if (targetLangCode) {
      return items.filter(
        (item) => item.targetLangCode.toLowerCase() === targetLangCode.toLowerCase()
      );
    }
    return items;
  } catch (err) {
    console.warn("Failed to load saved conversations from storage:", err);
    return [];
  }
}

/**
 * Save or update a conversation in persistent storage
 */
export function saveConversationToStorage(params: {
  id?: string;
  title?: string;
  targetLangCode: string;
  targetLangName: string;
  knownLangCode?: string;
  knownLangName?: string;
  messages: ChatMessage[];
  scenario?: ScenarioData | null;
  evaluatedItemsCount?: number;
}): SavedConversation {
  const current = loadSavedConversations();
  const convId = params.id || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Generate auto-title if not provided
  let title = params.title?.trim();
  if (!title) {
    if (params.scenario?.title) {
      title = `${params.scenario.title}`;
    } else {
      const userMsg = params.messages.find((m) => m.role === "user");
      if (userMsg) {
        title = userMsg.text.slice(0, 36) + (userMsg.text.length > 36 ? "..." : "");
      } else {
        title = `Practice with ${params.targetLangName} Tutor`;
      }
    }
  }

  // Count evaluated items
  const evaluatedItemsCount =
    params.evaluatedItemsCount ??
    params.messages.reduce((acc, m) => acc + (m.evaluatedItems?.length || 0), 0);

  const existingIndex = current.findIndex((item) => item.id === convId);

  const savedConv: SavedConversation = {
    id: convId,
    title,
    targetLangCode: params.targetLangCode,
    targetLangName: params.targetLangName,
    knownLangCode: params.knownLangCode,
    knownLangName: params.knownLangName,
    createdAt: existingIndex >= 0 ? current[existingIndex].createdAt : now,
    updatedAt: now,
    messages: params.messages,
    scenario: params.scenario || null,
    messageCount: params.messages.length,
    evaluatedItemsCount,
  };

  let updated: SavedConversation[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = savedConv;
  } else {
    updated = [savedConv, ...current];
  }

  try {
    localStorage.setItem(
      STORAGE_KEY_SAVED_CONVERSATIONS,
      JSON.stringify(updated.slice(0, 100)) // Keep up to 100 saved conversations
    );
  } catch (err) {
    console.warn("Failed to persist saved conversation:", err);
  }

  return savedConv;
}

/**
 * Delete a saved conversation
 */
export function deleteSavedConversation(conversationId: string): void {
  const current = loadSavedConversations();
  const updated = current.filter((item) => item.id !== conversationId);
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_CONVERSATIONS, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete saved conversation:", err);
  }
}

/**
 * Update title of a saved conversation
 */
export function updateConversationTitle(conversationId: string, newTitle: string): void {
  const current = loadSavedConversations();
  const index = current.findIndex((item) => item.id === conversationId);
  if (index === -1) return;

  current[index].title = newTitle.trim() || current[index].title;
  current[index].updatedAt = new Date().toISOString();

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_CONVERSATIONS, JSON.stringify(current));
  } catch (err) {
    console.warn("Failed to update conversation title:", err);
  }
}
