import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const EmotionMonitor = () => {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const emotionStartTime = useRef(null);
  const [showSupportVideo, setShowSupportVideo] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const emotionThreshold = 1000; // 1 second in ms

  useEffect(() => {
    console.log("🟡 useEffect mounted");

    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log("✅ TinyFaceDetector loaded");
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      console.log("✅ FaceExpressionNet loaded");
    };

    const startWebcam = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (webcamRef.current) webcamRef.current.srcObject = stream;
        })
        .catch((err) => console.error("Webcam error:", err));
    };

    const detectEmotions = async () => {
      console.log("🔍 detectEmotions called");
      console.log("videoRef check:", videoRef.current);

      if (!webcamRef.current) return;

      const result = await faceapi
        .detectSingleFace(webcamRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (result && result.expressions) {
        const { sad, angry } = result.expressions;
        const isSadOrAngry = true; // forced for testing

        console.log(`Sad: ${sad.toFixed(2)}, Angry: ${angry.toFixed(2)}, isTriggered: ${isSadOrAngry}`);

        if (isSadOrAngry) {
          setShowNotification(true);
          if (!emotionStartTime.current) {
            emotionStartTime.current = Date.now();
          } else {
            const duration = Date.now() - emotionStartTime.current;
            if (duration >= emotionThreshold && !showSupportVideo) {
              setShowSupportVideo(true);
              if (videoRef.current) {
                console.log("Pausing main video...");
                videoRef.current.pause();
              }
              console.log("Triggering support video...");
            }
          }
        } else {
          setShowNotification(false);
          emotionStartTime.current = null;
        }
      } else {
        setShowNotification(false);
        emotionStartTime.current = null;
      }
    };

    loadModels().then(() => {
      startWebcam();
      const interval = setInterval(detectEmotions, 500);
      return () => clearInterval(interval);
    });
  }, [showSupportVideo]);

  const handleSupportVideoEnd = () => {
    setShowSupportVideo(false);
    setShowNotification(false);
    emotionStartTime.current = null;
    if (videoRef.current) videoRef.current.play();
  };

  return (
    <div style={{ position: "relative" }}>
      <video ref={videoRef} src="/main-video.mp4" controls width="640" />
      <video
        ref={webcamRef}
        autoPlay
        muted
        style={{ display: "none" }}
      />
      {/* Always render support video for test */}
      <video
        src="/support-video.mp4"
        controls
        width="320"
        autoPlay
      />

      {showSupportVideo && (
        <video
          src="/support-video.mp4"
          autoPlay
          onEnded={handleSupportVideoEnd}
          width="320"
        />
      )}
      {showNotification && (
        <div style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "yellow",
          color: "black",
          padding: "10px 15px",
          borderRadius: "10px",
          fontWeight: "bold",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
        }}>
          Emotion Detected: Sad or Angry
        </div>
      )}
    </div>
  );
};

export default EmotionMonitor;
