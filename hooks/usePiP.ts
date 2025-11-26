
import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePiPProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  currentDistance: number;
  minDistance: number;
  isBlocking: boolean;
}

export const usePiP = ({ videoRef, currentDistance, minDistance, isBlocking }: UsePiPProps) => {
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Initialize hidden elements
  useEffect(() => {
    // Create a dummy video element to hold the stream
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    pipVideoRef.current = video;

    // Create a canvas to draw the UI
    const canvas = document.createElement('canvas');
    canvas.width = 640; 
    canvas.height = 480;
    canvasRef.current = canvas;

    // Cleanup
    return () => {
      if (document.pictureInPictureElement === video) {
        document.exitPictureInPicture().catch(console.error);
      }
    };
  }, []);

  // Drawing Loop
  const draw = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !pipVideoRef.current) return;
    
    // Stop if PiP exited externally
    if (!document.pictureInPictureElement && isPiPActive) {
         setIsPiPActive(false);
         return; 
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 1. Draw Camera Feed (Mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    // Draw image at 0,0 but since scale is -1, we draw at -width
    ctx.drawImage(videoRef.current, -640, 0, 640, 480);
    ctx.restore();

    // 2. Draw UI Overlay
    const isTooClose = currentDistance > -1 && currentDistance < minDistance;
    const isWarning = isTooClose || isBlocking;

    // Border
    if (isWarning) {
        ctx.lineWidth = 30;
        ctx.strokeStyle = '#ef4444'; // Red-500
        ctx.strokeRect(0, 0, 640, 480);
    }

    // Info Box Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // Slate-950
    ctx.beginPath();
    ctx.roundRect(20, 20, 260, 100, 15);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isWarning ? '#ef4444' : '#10b981';
    ctx.stroke();

    // Title
    ctx.fillStyle = '#94a3b8'; // Slate-400
    ctx.font = '16px sans-serif';
    ctx.fillText('VISION GUARD', 40, 50);
    
    // Distance Text
    ctx.fillStyle = isWarning ? '#ef4444' : '#10b981'; // Red or Emerald
    ctx.font = 'bold 50px monospace';
    ctx.fillText(`${currentDistance === -1 ? '--' : currentDistance.toFixed(0)} cm`, 40, 100);

    // Warning Text
    if (isWarning) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('⚠️ 距离过近!', 320, 440);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [currentDistance, minDistance, isBlocking, isPiPActive, videoRef]);

  // Start/Stop Animation Loop
  useEffect(() => {
      if (isPiPActive) {
          draw();
      } else {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }
  }, [isPiPActive, draw]);

  const togglePiP = async () => {
    if (!pipVideoRef.current || !canvasRef.current) return;

    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            setIsPiPActive(false);
        } else {
            // Setup Stream
            // Capture stream at 30fps
            const stream = canvasRef.current.captureStream(30); 
            pipVideoRef.current.srcObject = stream;
            
            // We must play the video before requesting PiP
            await pipVideoRef.current.play();
            
            await pipVideoRef.current.requestPictureInPicture();
            setIsPiPActive(true);
            
            // Listen for when user closes the PiP window manually
            pipVideoRef.current.onleavepictureinpicture = () => {
                setIsPiPActive(false);
            };
        }
    } catch (err) {
        console.error("PiP failed:", err);
        alert("启动画中画失败，请确保您正在使用 Chrome/Edge 等现代浏览器。");
    }
  };

  return { togglePiP, isPiPActive };
};
