import { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export const useFaceDetection = (
  webcamRef,
  isRunning,
  setFaceDetected,
  setEmotion,
  setLookAwayTime,
  setReportData // 🆕 Added for logging look-away
) => {
  const MODEL_URL = '/models';
  const lookAwayStartRef = useRef(null);
  const totalLookAwayTimeRef = useRef(0);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("📦 Loading models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log("✅ All models loaded successfully");
      } catch (err) {
        console.error("❌ Error loading models:", err);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    let intervalId;

    const detect = async () => {
      const video = webcamRef?.current;
      if (!video || video.readyState !== 4) {
        console.log("📷 Waiting for webcam...");
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detection) {
          setFaceDetected(true);
          const top = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1])[0][0];
          setEmotion(top);
          console.log("😊 Emotion:", top);

          // 🧠 If user was looking away and is now back
          if (lookAwayStartRef.current !== null) {
            const duration = Date.now() - lookAwayStartRef.current;
            totalLookAwayTimeRef.current += duration;
            setLookAwayTime(totalLookAwayTimeRef.current);

            // 📝 Log the look-away duration as a report event
            if (setReportData) {
              setReportData(prev => [
                ...prev,
                {
                  type: 'look-away',
                  duration: duration / 1000,
                  timestamp: new Date().toISOString()
                }
              ]);
            }

            console.log("👁️ Back detected, added look-away time:", duration / 1000, "s");
            lookAwayStartRef.current = null;
          }
        } else {
          setFaceDetected(false);
          setEmotion('');
          console.log("😶 No face detected");

          if (lookAwayStartRef.current === null) {
            lookAwayStartRef.current = Date.now();
            console.log("👀 Started look-away timer");
          }
        }
      } catch (err) {
        console.error("❌ Detection error:", err);
      }
    };

    if (isRunning) {
      console.log("▶ Starting detection...");
      intervalId = setInterval(detect, 500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("⏹ Stopped detection");
      }
    };
  }, [isRunning, webcamRef, setFaceDetected, setEmotion, setLookAwayTime, setReportData]);
};
