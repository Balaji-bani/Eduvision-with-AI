// src/components/ToggleControls.jsx
import React from 'react';

const ToggleControls = ({ isRunning, onToggle }) => {
  return (
    <div className="toggle-controls">
      <button onClick={onToggle}>
        {isRunning ? 'Pause Video' : 'Play Video'}
      </button>
    </div>
  );
};

export default ToggleControls;
