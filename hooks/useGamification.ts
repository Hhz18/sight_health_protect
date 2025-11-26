
import { useState, useEffect } from 'react';
import { UserStats, AppState } from '../types';
import { loadUserStats, saveUserStats, saveDailyProgress } from '../services/storageService';

const SAVE_INTERVAL_MS = 10000;

export const useGamification = (
  appState: AppState,
  currentDistance: number,
  minDistance: number,
  isBlocking: boolean
) => {
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats());
  const [sessionEffectiveTime, setSessionEffectiveTime] = useState(0);
  const [sessionTotalTime, setSessionTotalTime] = useState(0);
  const [combo, setCombo] = useState(0);

  // Game Loop
  useEffect(() => {
    if (appState !== AppState.MONITORING) return;

    const timer = setInterval(() => {
      if (document.hidden) return;

      const isSafe = currentDistance > minDistance;
      const isFaceDetected = currentDistance !== -1;

      setSessionTotalTime(prev => prev + 1);

      if (isSafe && isFaceDetected && !isBlocking) {
        setSessionEffectiveTime(prev => prev + 1);
        setCombo(prev => Math.min(prev + 1, 10)); // Max combo 10

        // XP Calculation
        const xpGain = 1 + (combo * 0.1);
        
        setUserStats(prev => {
          let newXP = prev.currentXP + xpGain;
          let newLevel = prev.level;
          let nextXP = prev.nextLevelXP;

          // Level Up Logic
          if (newXP >= nextXP) {
            newLevel += 1;
            newXP = newXP - nextXP;
            nextXP = Math.floor(nextXP * 1.2); 
          }
          return { 
            ...prev, 
            level: newLevel, 
            currentXP: newXP, 
            nextLevelXP: nextXP, 
            streakMultiplier: 1 + (combo * 0.1) 
          };
        });

      } else {
        setCombo(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [appState, currentDistance, minDistance, isBlocking, combo]);

  // Auto Save Logic
  useEffect(() => {
    const saveTimer = setInterval(() => {
      if (sessionTotalTime > 0) {
        saveUserStats(userStats);
        saveDailyProgress(sessionEffectiveTime, sessionTotalTime);
      }
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(saveTimer);
  }, [userStats, sessionTotalTime, sessionEffectiveTime]);

  return {
    userStats,
    sessionEffectiveTime,
    sessionTotalTime,
    combo
  };
};
