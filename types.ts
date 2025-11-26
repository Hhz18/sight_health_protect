export enum AppState {
  IDLE = 'IDLE',
  CALIBRATING = 'CALIBRATING',
  MONITORING = 'MONITORING',
  BLOCKED = 'BLOCKED'
}

export interface CalibrationData {
  referenceFaceWidthPx: number; // Face width in pixels at reference distance
  referenceDistanceCm: number;  // Assumed reference distance (e.g., 60cm)
}

export interface FaceDetectionResult {
  faceWidthPx: number;
  detected: boolean;
}

export interface ErgonomicAnalysis {
  score: number;
  lighting: string;
  posture: string;
  recommendations: string[];
}

// --- New Types for Gamification & History ---

export interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalEffectiveSeconds: number; // Lifetime effective seconds
  streakMultiplier: number; // Current multiplier based on continuous good posture
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  effectiveSeconds: number;
  totalSeconds: number;
  score: number; // 0-100 efficiency score
}

export interface PredictionData {
  trend: 'improving' | 'declining' | 'stable';
  healthScore: number;
  analysisText: string;
  futurePoints: { date: string; value: number }[]; // For the chart
}