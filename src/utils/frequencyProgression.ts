import { Flashcard, FrequencyBracket, Deck } from "../types";

export const BRACKET_SIZE = 10;

/**
 * Groups deck cards into logical frequency tiers of 10 (e.g. 1-10, 11-20, 21-30...)
 * and determines completion / mastery status for each bracket.
 */
export function getFrequencyBrackets(cards: Flashcard[], bracketSize = BRACKET_SIZE): FrequencyBracket[] {
  if (!cards || cards.length === 0) return [];

  const maxRank = Math.max(...cards.map((c) => c.frequencyRank || 1), 10);
  const totalBrackets = Math.max(1, Math.ceil(maxRank / bracketSize));
  const brackets: FrequencyBracket[] = [];

  for (let i = 0; i < totalBrackets; i++) {
    const startRank = i * bracketSize + 1;
    const endRank = (i + 1) * bracketSize;

    const bracketCards = cards
      .filter((c) => c.frequencyRank >= startRank && c.frequencyRank <= endRank)
      .sort((a, b) => a.frequencyRank - b.frequencyRank);

    const masteredCards = bracketCards.filter((c) => c.srs.status === "mastered").length;
    const totalCards = bracketCards.length;

    // Mastered if there are cards and at least 80% (or all) of them are mastered
    const isMastered = totalCards >= 5 && masteredCards / totalCards >= 0.8;

    // First bracket is always unlocked; subsequent brackets are unlocked if previous is completed or has cards
    let isUnlocked = i === 0;
    if (i > 0) {
      const prevBracket = brackets[i - 1];
      isUnlocked = prevBracket?.isMastered || totalCards > 0;
    }

    brackets.push({
      startRank,
      endRank,
      totalCards,
      masteredCards,
      isUnlocked,
      isMastered,
      cards: bracketCards,
    });
  }

  return brackets;
}

/**
 * Identifies the current active frequency bracket that the learner should focus on.
 * If 1-10 are mastered, returns 11-20.
 */
export function getActiveFrequencyBracket(cards: Flashcard[], bracketSize = BRACKET_SIZE): {
  currentBracket: FrequencyBracket;
  nextBracketStart: number;
  nextBracketEnd: number;
  isCurrentTierMastered: boolean;
  needsNextBatchGeneration: boolean;
} {
  const brackets = getFrequencyBrackets(cards, bracketSize);

  if (brackets.length === 0) {
    return {
      currentBracket: {
        startRank: 1,
        endRank: 10,
        totalCards: 0,
        masteredCards: 0,
        isUnlocked: true,
        isMastered: false,
        cards: [],
      },
      nextBracketStart: 1,
      nextBracketEnd: 10,
      isCurrentTierMastered: false,
      needsNextBatchGeneration: true,
    };
  }

  // Find first unmastered bracket
  let targetBracketIndex = brackets.findIndex((b) => !b.isMastered && b.totalCards > 0);

  if (targetBracketIndex === -1) {
    // All existing brackets are mastered!
    const lastBracket = brackets[brackets.length - 1];
    const nextStart = lastBracket.endRank + 1;
    const nextEnd = nextStart + bracketSize - 1;

    return {
      currentBracket: lastBracket,
      nextBracketStart: nextStart,
      nextBracketEnd: nextEnd,
      isCurrentTierMastered: true,
      needsNextBatchGeneration: true,
    };
  }

  const currentBracket = brackets[targetBracketIndex];
  const isCurrentTierMastered = currentBracket.isMastered;
  const nextBracketStart = currentBracket.endRank + 1;
  const nextBracketEnd = nextBracketStart + bracketSize - 1;

  // Check if next tier cards already exist in deck
  const nextTierCardsCount = cards.filter(
    (c) => c.frequencyRank >= nextBracketStart && c.frequencyRank <= nextBracketEnd
  ).length;

  const needsNextBatchGeneration = isCurrentTierMastered && nextTierCardsCount === 0;

  return {
    currentBracket,
    nextBracketStart,
    nextBracketEnd,
    isCurrentTierMastered,
    needsNextBatchGeneration,
  };
}

/**
 * Filter and sort study queue prioritizing the active frequency tier or unmastered items
 */
export function getFrequencyFocusedQueue(
  cards: Flashcard[],
  focusMode: "auto" | "tier" | "all" | "errors" = "auto",
  tierStart?: number,
  tierEnd?: number
): Flashcard[] {
  const now = new Date();

  if (focusMode === "tier" && tierStart && tierEnd) {
    return cards
      .filter((c) => c.frequencyRank >= tierStart && c.frequencyRank <= tierEnd)
      .sort((a, b) => {
        // Due cards first, then by rank
        const aDue = a.srs.history.length > 0 && new Date(a.srs.dueDate) <= now ? 0 : 1;
        const bDue = b.srs.history.length > 0 && new Date(b.srs.dueDate) <= now ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return a.frequencyRank - b.frequencyRank;
      });
  }

  if (focusMode === "auto") {
    // Determine active tier
    const { currentBracket } = getActiveFrequencyBracket(cards);
    // If current bracket has cards and isn't mastered, focus on it
    if (currentBracket.cards.length > 0 && !currentBracket.isMastered) {
      const activeTierCards = currentBracket.cards;
      const otherCards = cards.filter(
        (c) => c.frequencyRank < currentBracket.startRank || c.frequencyRank > currentBracket.endRank
      );

      // Prioritize active tier cards, but also surface overdue reviews from prior tiers
      const overdueFromOthers = otherCards.filter(
        (c) => c.srs.history.length > 0 && new Date(c.srs.dueDate) <= now
      );

      return [...overdueFromOthers, ...activeTierCards, ...otherCards];
    }
  }

  // Default: Due cards, then new cards sorted by frequency rank
  const dueCards = cards
    .filter((c) => c.srs.status !== "new" && new Date(c.srs.dueDate) <= now)
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  const nonDueCards = cards
    .filter((c) => c.srs.status === "new" || new Date(c.srs.dueDate) > now)
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  return [...dueCards, ...nonDueCards];
}
