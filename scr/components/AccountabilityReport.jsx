import React, { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import exportAsPDF from './exportAsPDF'; // Adjust path if needed

const AccountabilityReport = ({ reportData }) => {
  const [summary, setSummary] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!reportData || reportData.length === 0) return;

    let totalWatchTime = 0;
    let lookAwayTime = 0;
    let tabSwitches = 0;
    let actualVideoDuration = 0;
    const emotionCounts = {};

    reportData.forEach(event => {
      if (event.type === 'watch') totalWatchTime += event.duration;
      if (event.type === 'look-away') lookAwayTime += event.duration || 0;
      if (event.type === 'tab-switch') tabSwitches += 1;
      if (event.type === 'videoDuration') actualVideoDuration = event.duration;
      if (event.type === 'emotion') {
        const emotion = event.emotion;
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
    });
    // ✅ Manual override if videoDuration is not provided or is 0
    if (!actualVideoDuration || actualVideoDuration === 0) {
        actualVideoDuration = 221; // Hardcoded duration in seconds
    }

    const emotionData = Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count
    }));

    setSummary({
      totalWatchTime,
      lookAwayTime,
      tabSwitches,
      actualVideoDuration,
      emotionData
    });
  }, [reportData]);

  if (!summary) return <div>Loading report...</div>;

  const watchedPercentage = summary.actualVideoDuration
    ? ((summary.totalWatchTime / summary.actualVideoDuration) * 100).toFixed(1)
    : 'N/A';

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 Accountability Report</h2>
      <p><strong>🎥 Actual Video Duration:</strong> {summary.actualVideoDuration.toFixed(1)} sec</p>
      <p><strong>✅ Watched Time:</strong> {summary.totalWatchTime.toFixed(1)} sec</p>
      <p><strong>📉 Look-away Time:</strong> {summary.lookAwayTime.toFixed(1)} sec</p>
      <p><strong>🔄 Tab Switches:</strong> {summary.tabSwitches}</p>
      <p><strong>📈 Watched Percentage:</strong> {watchedPercentage}%</p>

      <button onClick={() => exportAsPDF(summary, chartRef)} style={{ margin: '10px 0', padding: '8px 12px' }}>
        🧾 Export Report as PDF
      </button>

      <h3>😊 Emotion Breakdown</h3>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={summary.emotionData}>
            <XAxis dataKey="emotion" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AccountabilityReport;
