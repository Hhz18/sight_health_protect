
import { useRef, useState, useEffect, useCallback } from 'react';
import { loadModel, detectFace } from '../services/visionService';
import { CalibrationData } from '../types';

export const useCamera = (activeTab: string, calibration: CalibrationData | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number>(-1);

  // 1. Setup Camera and Model
  useEffect(() => {
    const setup = async () => {
      try {
        await loadModel();
        setModelLoaded(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" }
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (err) {
        console.error("Camera setup failed:", err);
        setCameraError(true);
      }
    };
    setup();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearTimeout(timerRef.current as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 2. Handle Tab Switching
  useEffect(() => {
    if (activeTab === 'monitor' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.log("Auto-play prevented:", e));
      };
    }
  }, [activeTab]);

  // REMOVED: Visibility check that resets distance. 
  // We want to keep the distance value even in background.

  // 3. Detection Loop (Smart Throttling)
  const tick = useCallback(async () => {
    // Determine if we are in background
    const isHidden = document.hidden;

    // If camera is not ready, retry quickly
    if (!videoRef.current || !modelLoaded || videoRef.current.paused || videoRef.current.ended) {
      timerRef.current = setTimeout(tick, 1000); 
      return;
    }

    try {
      const { width, detected } = await detectFace(videoRef.current);

      if (detected && width > 0) {
        if (calibration) {
          const estimatedDist = (calibration.referenceFaceWidthPx / width) * calibration.referenceDistanceCm;
          // Smooth filtering
          setCurrentDistance(prev => (prev === -1 ? estimatedDist : (prev * 0.8) + (estimatedDist * 0.2)));
        }
      } else {
        // Only reset if we truly lost the face, but keep last known good distance for a bit longer in background?
        // For now, simple reset is safer to avoid stuck "blocking" state.
        setCurrentDistance(-1);
      }
    } catch (e) {
      console.error("Detection error:", e);
    }

    // Schedule next frame
    if (isHidden) {
      // In background: Throttle to 1 second (save battery, bypass browser throttle)
      timerRef.current = setTimeout(tick, 1000);
    } else {
      // In foreground: Full speed (smooth UI)
      rafRef.current = requestAnimationFrame(tick);
    }

  }, [modelLoaded, calibration]);

  // Start Loop
  useEffect(() => {
    tick();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  return {
    videoRef,
    modelLoaded,
    cameraError,
    currentDistance,
    setCurrentDistance
  };
};
