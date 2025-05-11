import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import Videoplayer from './components/Videoplayer';
import WebcamViewer from './components/WebcamViewer';
import ToggleControls from './components/ToggleControls';
import StatusIndicators from './components/StatusIndicators';
import AccountabilityReport from './components/AccountabilityReport';
import { useFaceDetection } from './hooks/useFaceDetection';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [emotion, setEmotion] = useState('');
  const [triggered, setTriggered] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [supportVisible, setSupportVisible] = useState(false);
  const [isMainFullscreen, setIsMainFullscreen] = useState(false);
  const [isSupportFullscreen, setIsSupportFullscreen] = useState(false);
  const [accountabilityData, setAccountabilityData] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [lookAwayTime, setLookAwayTime] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [lookAwayPercentage, setLookAwayPercentage] = useState(0);

  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const supportRef = useRef(null);
  const timerRef = useRef(null);
  const watchStartRef = useRef(null);

  useFaceDetection( webcamRef, isRunning, setFaceDetected, setEmotion, setLookAwayTime, setAccountabilityData);

  useEffect(() => {
    const checkEmotion = () => {
      if (emotion === 'sad' || emotion === 'angry') {
        setShowNotification(true);
        setAccountabilityData(prev => [...prev, { type: 'look-away', time: Date.now(), emotion }]);

        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            if (videoRef.current) {
              setPausedTime(videoRef.current.currentTime);
              console.log("📍 Paused main video at:", videoRef.current.currentTime);
            }
            setTriggered(true);
            setIsPaused(true);
          }, 1000);
        }
      } else {
        setShowNotification(false);
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (emotion) {
        setAccountabilityData(prev => [...prev, { type: 'emotion', time: Date.now(), emotion }]);
      }
    };

    checkEmotion();
    return () => clearTimeout(timerRef.current);
  }, [emotion]);

  useEffect(() => {
    let videoDuration = 0;
  
    accountabilityData.forEach(event => {
      if (event.type === 'videoDuration') {
        videoDuration = event.duration;
      }
    });
  
    if (!videoDuration || videoDuration === 0) {
      videoDuration = 120; // fallback
    }
  
    const percentage = (lookAwayTime / videoDuration) * 100;
    setLookAwayPercentage(percentage.toFixed(1));
  }, [lookAwayTime, accountabilityData]);
  

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenEl = document.fullscreenElement;
      setIsMainFullscreen(fullscreenEl === videoRef.current);
      setIsSupportFullscreen(fullscreenEl === supportRef.current);

      if (!fullscreenEl) {
        console.log("❌ Exited fullscreen. Pausing any playing video.");
        videoRef.current?.pause();
        supportRef.current?.pause();
        setIsRunning(false);
      }
    };

    const handleBlur = () => {
      setAccountabilityData(prev => [...prev, { type: 'tab-switch', time: Date.now() }]);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      watchStartRef.current = Date.now();
    } else if (!isRunning || isPaused) {
      if (watchStartRef.current) {
        const duration = (Date.now() - watchStartRef.current) / 1000;
        setAccountabilityData(prev => [...prev, { type: 'watch', duration }]);
        watchStartRef.current = null;
      }
    }
  }, [isRunning, isPaused]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (videoRef.current) {
        if (document.hidden) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  

  useEffect(() => {
    let totalWatchTime = 0;
    let videoDuration = 0;

    accountabilityData.forEach(event => {
      if (event.type === 'watch') totalWatchTime += event.duration;
      if (event.type === 'videoDuration') videoDuration = event.duration;
    });

    if (!videoDuration || videoDuration === 0) {
      videoDuration = 120; // fallback duration
    }

    const percentage = (totalWatchTime / videoDuration) * 100;
    setWatchedPercentage(percentage.toFixed(1));
  }, [accountabilityData]);

  const preventPlayPause = (e) => {
    const isFullscreen = !!document.fullscreenElement;
    if (!isFullscreen) {
      e.preventDefault();
      e.stopPropagation();
      console.warn("🔒 Play/Pause blocked outside fullscreen");
    }
  };

  const handleToggle = () => {
    setIsRunning(prev => !prev);
  };

  const handleAppearForTest = () => {
    if (watchedPercentage >= 85) {
      window.open('/test-page', '_blank');
    } else {
      alert("You need to watch at least 85% of the video to appear for the test.");
    }
  };

  return (
    <div className="App">
      <h1>EDUVISION WITH AI</h1>

      <WebcamViewer webcamRef={webcamRef} />
      <ToggleControls isRunning={isRunning} onToggle={handleToggle} />
      <StatusIndicators faceDetected={faceDetected} emotion={emotion} />



      {showNotification && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(255, 0, 0, 0.85)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          zIndex: 999
        }}>
          Sad or angry emotion detected...
        </div>
      )}

      {!triggered ? (
        <Videoplayer
          videoRef={videoRef}
          isPaused={isPaused}
          isRunning={isRunning}
          videoSrc="/main-video.mp4"
          showControls={isMainFullscreen}
          onPlay={preventPlayPause}
          onPause={preventPlayPause}
          onLoadedMetadata={async () => {
            if (videoRef.current) {
              const duration = videoRef.current.duration;
              setAccountabilityData(prev => [...prev, { type: 'videoDuration', duration }]);

              if (!document.fullscreenElement) {
                try {
                  await videoRef.current.requestFullscreen();
                } catch (err) {
                  console.warn("⚠ Fullscreen error (main video):", err);
                }
              }
            }
          }}
          onEnterPictureInPicture={(e) => {
            e.preventDefault();
            videoRef.current?.pause();
            console.log("❌ Main video entered PiP — paused");
          }}
        />
      ) : (
        <div style={{ marginTop: '20px' }}>
          {!supportVisible && (
            <button
              onClick={async () => {
                const video = supportRef.current;
                if (video) {
                  try {
                    await video.requestFullscreen();
                    await video.play();
                    setSupportVisible(true);
                    setIsRunning(false);
                    console.log("▶ Support video started in fullscreen");
                  } catch (err) {
                    console.warn("⚠ Fullscreen/play failed:", err);
                  }
                }
              }}
              style={{ padding: '10px 20px', fontSize: '16px' }}
            >
              ▶ Let's take a little break, because you look bored...(GAME OR QUIZ BASED ON COURSE RELATED)
            </button>
          )}

          <video
            ref={supportRef}
            src="/support-video.mp4"
            controls={isSupportFullscreen}
            style={{ display: supportVisible ? 'block' : 'none', width: '640px', maxWidth: '100%' }}
            onPlay={preventPlayPause}
            onPause={preventPlayPause}
            onEnterPictureInPicture={() => {
              console.log("📦 Entered PiP — pausing");
              supportRef.current?.pause();
            }}
            onEnded={() => {
              console.log("✅ Support video ended. Returning to main video...");
              setTriggered(false);
              setIsPaused(false);
              setSupportVisible(false);

              setTimeout(async () => {
                const mainVideo = videoRef.current;

                if (mainVideo) {
                  videoRef.currentTime = pausedTime;
                  console.log("⏪ Resuming main video from:", pausedTime);

                  try {
                    if (!document.fullscreenElement) {
                      await mainVideo.requestFullscreen();
                    }

                    await mainVideo.play();
                    setIsRunning(true); // Optionally resume detection if it was paused
                  } catch (err) {
                    console.warn("⚠ Could not resume main video in fullscreen:", err);
                  }
                }
              }, 300);
            }}
          />
        </div>
      )}

      {/* Centered Report & Test Buttons Below Video */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => setShowReport(true)}
          style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}
        >
          📊 Show Report
        </button>
        <button
          onClick={handleAppearForTest}
          disabled={lookAwayPercentage > 15}
          style={{ padding: '10px 20px', fontSize: '16px' }}
          title={lookAwayPercentage > 15 ? 'Look-away too high to appear for test' : ''}          
        >
          🧪 Appear for Test
        </button>
      </div>

      {showReport && <AccountabilityReport reportData={accountabilityData} />}
    </div>
  );
}

export default App;