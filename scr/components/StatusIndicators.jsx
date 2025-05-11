import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function StatusIndicators({ faceDetected, emotion }) {
  return (
    <div className="status-indicators">
      <div className="status-item">
        <span className="status-label">Face:</span>
        <span className={faceDetected ? 'status-value success' : 'status-value error'}>
          {faceDetected ? '✅ Detected' : '❌ Not Detected'}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">Emotion:</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={emotion}
            className={`status-value ${emotion?.toLowerCase() || ''}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            {emotion ? emotion.charAt(0).toUpperCase() + emotion.slice(1) : 'N/A'}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default StatusIndicators;
