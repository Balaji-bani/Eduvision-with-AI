import React, { useEffect, useState, useRef } from 'react';

const VideoPlayer = ({ videoRef, isPaused, isRunning, videoSrc }) => {
  const [maxAllowedTime, setMaxAllowedTime] = useState(0);
  const [resumeTime, setResumeTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const hasRestoredRef = useRef(false);
  const lastSrcRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement;
      setIsFullscreen(fullscreen);
      if (!fullscreen) {
        console.log("❌ Exited fullscreen. Pausing...");
        video.pause();
      }
    };

    const handleEnterPictureInPicture = () => {
      console.log("📦 Entered PiP. Pausing...");
      setIsPiP(true);
      video.pause();
    };

    const handleLeavePictureInPicture = () => {
      console.log("⬅️ Left PiP.");
      setIsPiP(false);
    };

    video.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
    video.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
      video.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isRunning) return;

    const attemptFullscreen = async () => {
      try {
        if (video.requestFullscreen) {
          await video.requestFullscreen();
          console.log("🔲 Entered fullscreen");
        }
      } catch (err) {
        console.warn("⚠️ Failed to enter fullscreen:", err);
      }
    };

    if (!isPaused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            attemptFullscreen();
          })
          .catch(err => {
            console.warn("⚠️ Playback blocked:", err);
          });
      }
    }
  }, [isPaused, isRunning, videoRef]);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={videoSrc}
        controls={isFullscreen && !isPiP}
        disablePictureInPicture
        width="640"
        onContextMenu={(e) => e.preventDefault()}
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
};

export default VideoPlayer;
