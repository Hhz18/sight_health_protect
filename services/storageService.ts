import { DailyRecord, UserStats, CalibrationData } from "../types";

const STORAGE_KEY_STATS = "visionguard_stats";
const STORAGE_KEY_HISTORY = "visionguard_history";
const STORAGE_KEY_CALIBRATION = "visionguard_calibration";

const DEFAULT_STATS: UserStats = {
  level: 1,
  currentXP: 0,
  nextLevelXP: 100,
  totalEffectiveSeconds: 0,
  streakMultiplier: 1.0,
};

export const loadUserStats = (): UserStats => {
  const stored = localStorage.getItem(STORAGE_KEY_STATS);
  return stored ? JSON.parse(stored) : DEFAULT_STATS;
};

export const saveUserStats = (stats: UserStats) => {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
};

export const loadHistory = (): DailyRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
  return stored ? JSON.parse(stored) : [];
};

export const saveDailyProgress = (effectiveSeconds: number, totalSeconds: number) => {
  const history = loadHistory();
  const today = new Date().toISOString().split('T')[0];
  const existingIndex = history.findIndex(h => h.date === today);

  const efficiency = totalSeconds > 0 ? Math.round((effectiveSeconds / totalSeconds) * 100) : 0;

  if (existingIndex >= 0) {
    history[existingIndex] = {
      date: today,
      effectiveSeconds: history[existingIndex].effectiveSeconds + effectiveSeconds,
      totalSeconds: history[existingIndex].totalSeconds + totalSeconds,
      score: efficiency
    };
  } else {
    history.push({
      date: today,
      effectiveSeconds,
      totalSeconds,
      score: efficiency
    });
  }

  // Keep only last 30 days
  if (history.length > 30) {
    history.shift();
  }

  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
};

// Helper to get last 7 days including today (even if empty)
export const getLast7DaysData = (): DailyRecord[] => {
  const history = loadHistory();
  const result: DailyRecord[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const found = history.find(h => h.date === dateStr);
    result.push(found || { date: dateStr, effectiveSeconds: 0, totalSeconds: 0, score: 0 });
  }
  return result;
};

// --- Calibration Persistence for Mini Monitor ---

export const saveCalibrationData = (data: CalibrationData) => {
  localStorage.setItem(STORAGE_KEY_CALIBRATION, JSON.stringify(data));
};

export const loadCalibrationData = (): CalibrationData | null => {
  const stored = localStorage.getItem(STORAGE_KEY_CALIBRATION);
  return stored ? JSON.parse(stored) : null;
};
