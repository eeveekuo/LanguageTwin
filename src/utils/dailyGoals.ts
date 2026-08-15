import { DailyProgress } from "../types";

const STORAGE_KEY_DAILY_PROGRESS = "frequency_srs_daily_progress_v1";

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function loadDailyProgress(): DailyProgress {
  const today = getTodayDateString();
  const defaultProgress: DailyProgress = {
    target: 10,
    reviewedToday: 0,
    date: today,
    streak: 1,
    lastCompletedDate: undefined,
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
        lastCompletedDate: wasCompleted ? data.date : data.lastCompletedDate,
      };

      saveDailyProgress(refreshed);
      return refreshed;
    }

    return {
      target: data.target || 10,
      reviewedToday: data.reviewedToday || 0,
      date: today,
      streak: data.streak || 1,
      lastCompletedDate: data.lastCompletedDate,
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

export function recordCardReview(current: DailyProgress): {
  updated: DailyProgress;
  justAchievedGoal: boolean;
} {
  const today = getTodayDateString();
  let reviewed = current.date === today ? current.reviewedToday + 1 : 1;
  const target = current.target || 10;
  let streak = current.streak || 1;
  let lastCompletedDate = current.lastCompletedDate;
  let justAchievedGoal = false;

  if (reviewed >= target && lastCompletedDate !== today) {
    justAchievedGoal = true;
    lastCompletedDate = today;
    streak = streak + 1;
  }

  const updated: DailyProgress = {
    target,
    reviewedToday: reviewed,
    date: today,
    streak,
    lastCompletedDate,
  };

  saveDailyProgress(updated);
  return { updated, justAchievedGoal };
}

export function updateDailyTarget(current: DailyProgress, newTarget: number): DailyProgress {
  const updated: DailyProgress = {
    ...current,
    target: Math.max(3, newTarget),
  };
  saveDailyProgress(updated);
  return updated;
}
