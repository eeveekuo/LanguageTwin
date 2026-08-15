import { Flashcard, SRSData, SRSRecord, MasteryLevel, SRSStatus } from "../types";

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * Adapted for active sentence production verification.
 */
export function calculateNextSRS(
  currentSRS: SRSData,
  grade: number, // 0 to 5
  score: number, // 0 to 100
  masteryLevel: MasteryLevel,
  userSentence: string,
  feedback: string,
  correctedSentence: string,
  inputMethod: "typed" | "spoken"
): { updatedSRS: SRSData; nextDueDateDisplay: string } {
  let { repetition, interval, easeFactor, consecutiveSuccesses, history } = currentSRS;

  const now = new Date();

  // New record entry
  const record: SRSRecord = {
    date: now.toISOString(),
    userSentence,
    score,
    grade,
    masteryLevel,
    feedback,
    correctedSentence,
    inputMethod,
  };

  // Grade >= 3 means successful recall/production
  if (grade >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 3;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
    consecutiveSuccesses += 1;
  } else {
    // Failed production or "Don't know"
    repetition = 0;
    interval = 1; // repeat tomorrow or during session review
    consecutiveSuccesses = 0;
  }

  // Calculate new Ease Factor (EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }
  if (easeFactor > 3.0) {
    easeFactor = 3.0;
  }

  // Calculate next due date
  const nextDue = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // Determine status
  let status: SRSStatus = "learning";
  if (repetition >= 4 && consecutiveSuccesses >= 3 && grade >= 4) {
    status = "mastered";
  } else if (repetition >= 1) {
    status = "review";
  } else {
    status = "learning";
  }

  // Calculate weighted rolling mastery score
  const updatedHistory = [...history, record];
  const recentScores = updatedHistory.slice(-5).map((h) => h.score);
  const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const masteryScore = Math.round(avgRecent);

  const updatedSRS: SRSData = {
    repetition,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueDate: nextDue.toISOString(),
    lastReviewed: now.toISOString(),
    history: updatedHistory,
    masteryScore,
    status,
    consecutiveSuccesses,
  };

  let nextDueDateDisplay = "Tomorrow";
  if (interval === 1) nextDueDateDisplay = "in 1 day";
  else if (interval > 1) nextDueDateDisplay = `in ${interval} days`;

  return { updatedSRS, nextDueDateDisplay };
}

/**
 * Sorts deck cards for optimal spaced repetition study:
 * 1. Due/overdue cards (sorted by frequency rank first)
 * 2. New cards (sorted by frequency rank first)
 * 3. Future scheduled review cards (by frequency rank)
 */
export function getStudyQueue(cards: Flashcard[]): {
  dueCards: Flashcard[];
  newCards: Flashcard[];
  allQueue: Flashcard[];
} {
  const now = new Date();

  // Due or overdue cards
  const dueCards = cards
    .filter((c) => {
      if (c.srs.status === "new") return false;
      const due = new Date(c.srs.dueDate);
      return due <= now;
    })
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  // New cards (never studied)
  const newCards = cards
    .filter((c) => c.srs.status === "new" || c.srs.history.length === 0)
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  // Rest of cards sorted by frequency rank
  const learningOrFuture = cards
    .filter((c) => {
      const isNew = c.srs.status === "new" || c.srs.history.length === 0;
      const isDue = new Date(c.srs.dueDate) <= now;
      return !isNew && !isDue;
    })
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  return {
    dueCards,
    newCards,
    allQueue: [...dueCards, ...newCards, ...learningOrFuture],
  };
}

/**
 * Calculates deck statistics
 */
export function getDeckStats(cards: Flashcard[]) {
  const total = cards.length;
  const now = new Date();

  const mastered = cards.filter((c) => c.srs.status === "mastered").length;
  const learning = cards.filter((c) => c.srs.status === "learning").length;
  const review = cards.filter((c) => c.srs.status === "review").length;
  const newCards = cards.filter((c) => c.srs.status === "new" || c.srs.history.length === 0).length;
  const due = cards.filter((c) => c.srs.history.length > 0 && new Date(c.srs.dueDate) <= now).length;

  const totalReviews = cards.reduce((acc, c) => acc + c.srs.history.length, 0);
  const scores = cards.flatMap((c) => c.srs.history.map((h) => h.score));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const retentionRate =
    totalReviews > 0
      ? Math.round(
          (cards.flatMap((c) => c.srs.history.filter((h) => h.grade >= 3)).length / totalReviews) * 100
        )
      : 100;

  return {
    total,
    mastered,
    learning,
    review,
    newCards,
    due,
    totalReviews,
    avgScore,
    retentionRate,
  };
}
