// src/components/WebcamViewer.jsx
import React, { useEffect } from 'react';

const WebcamViewer = ({ webcamRef }) => {
  useEffect(() => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing webcam:", err);
        });
    }
  }, [webcamRef]);

  return (
    <div className="webcam-viewer">
      <h3>Webcam Preview</h3>
      <video ref={webcamRef} autoPlay muted width="480" height="360" />
    </div>
  );
};

export default WebcamViewer;
