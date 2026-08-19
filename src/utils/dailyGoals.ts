import { DailyProgress, PracticeActivityRecord, PracticeBreakdownCounts, PracticeMechanismType } from "../types";

const STORAGE_KEY_DAILY_PROGRESS = "frequency_srs_daily_progress_v1";

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_BREAKDOWN: PracticeBreakdownCounts = {
  study: 0,
  deck: 0,
  grammar: 0,
  reading: 0,
  tutor: 0,
  translate: 0,
  journal: 0,
};

export function loadDailyProgress(): DailyProgress {
  const today = getTodayDateString();
  const defaultProgress: DailyProgress = {
    target: 10,
    reviewedToday: 0,
    date: today,
    streak: 1,
    lastCompletedDate: null,
    breakdown: { ...DEFAULT_BREAKDOWN },
    activityLog: [],
  };

  if (typeof window === "undefined") return defaultProgress;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_PROGRESS);
    if (!raw) return defaultProgress;

    const data: DailyProgress = JSON.parse(raw);
    if (!data.date) return defaultProgress;

    // Check if it's a new day
    if (data.date !== today) {
      // Calculate streak continuation
      const lastDate = new Date(data.date);
      const currDate = new Date(today);
      const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = data.streak || 0;
      // If user completed target on the last day recorded and it was yesterday (diffDays === 1), streak continues
      const wasCompleted = data.reviewedToday >= data.target;
      if (wasCompleted && diffDays === 1) {
        // Streak remains active, will increment when today is completed
      } else if (diffDays > 1) {
        // Streak broken if more than 1 day missed
        newStreak = wasCompleted ? 1 : 0;
      }

      const refreshed: DailyProgress = {
        target: data.target || 10,
        reviewedToday: 0,
        date: today,
        streak: newStreak > 0 ? newStreak : 1,
        lastCompletedDate: wasCompleted ? data.date : data.lastCompletedDate || null,
        breakdown: { ...DEFAULT_BREAKDOWN },
        activityLog: data.activityLog ? data.activityLog.slice(0, 30) : [],
      };

      saveDailyProgress(refreshed);
      return refreshed;
    }

    return {
      target: data.target || 10,
      reviewedToday: data.reviewedToday || 0,
      date: today,
      streak: data.streak || 1,
      lastCompletedDate: data.lastCompletedDate ?? null,
      breakdown: {
        ...DEFAULT_BREAKDOWN,
        ...(data.breakdown || {}),
      },
      activityLog: data.activityLog || [],
    };
  } catch (e) {
    console.warn("Failed to load daily progress:", e);
    return defaultProgress;
  }
}

export function saveDailyProgress(progress: DailyProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.warn("Failed to save daily progress:", e);
  }
}

export function logPracticeActivity(
  current: DailyProgress,
  activity: Omit<PracticeActivityRecord, "id" | "timestamp" | "date">
): {
  updated: DailyProgress;
  justAchievedGoal: boolean;
} {
  const today = getTodayDateString();
  const isToday = current.date === today;
  
  let reviewed = isToday ? current.reviewedToday + 1 : 1;
  const target = current.target || 10;
  let streak = current.streak || 1;
  let lastCompletedDate = current.lastCompletedDate ?? null;
  let justAchievedGoal = false;

  if (reviewed >= target && lastCompletedDate !== today) {
    justAchievedGoal = true;
    lastCompletedDate = today;
    streak = streak + 1;
  }

  const currentBreakdown: PracticeBreakdownCounts = isToday
    ? { ...DEFAULT_BREAKDOWN, ...(current.breakdown || {}) }
    : { ...DEFAULT_BREAKDOWN };

  currentBreakdown[activity.mechanism] = (currentBreakdown[activity.mechanism] || 0) + 1;

  const newActivity: PracticeActivityRecord = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    date: today,
    mechanism: activity.mechanism,
    title: activity.title,
    details: activity.details,
    score: activity.score,
    targetItem: activity.targetItem,
  };

  const existingLog = isToday ? current.activityLog || [] : [];
  const updatedLog = [newActivity, ...existingLog].slice(0, 100);

  const updated: DailyProgress = {
    target,
    reviewedToday: reviewed,
    date: today,
    streak,
    lastCompletedDate: lastCompletedDate ?? null,
    breakdown: currentBreakdown,
    activityLog: updatedLog,
  };

  saveDailyProgress(updated);
  return { updated, justAchievedGoal };
}

export function recordCardReview(
  current: DailyProgress,
  cardItemName?: string,
  score?: number
): {
  updated: DailyProgress;
  justAchievedGoal: boolean;
} {
  return logPracticeActivity(current, {
    mechanism: "study",
    title: cardItemName ? `Active Review: ${cardItemName}` : "Active Flashcard Production",
    details: score !== undefined ? `Mastery Score: ${score}%` : "Spaced Repetition Review Completed",
    score,
    targetItem: cardItemName,
  });
}

export function updateDailyTarget(current: DailyProgress, newTarget: number): DailyProgress {
  const updated: DailyProgress = {
    ...current,
    target: Math.max(3, newTarget),
  };
  saveDailyProgress(updated);
  return updated;
}

