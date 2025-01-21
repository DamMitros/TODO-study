"use client";

import { useLayoutEffect, useRef } from 'react';

export default function TaskProgressBar({ progress }) {
  const progressBarRef = useRef(null);
  const progressFillRef = useRef(null);

  useLayoutEffect(() => {
    if (!progressBarRef.current || !progressFillRef.current) return;
    progressFillRef.current.style.width = `${progress}%`;
    progressFillRef.current.style.backgroundColor = 
      progress < 30 ? '#ff4444' :
      progress < 70 ? '#ffbb33' :
      '#00C851';

  }, [progress]);

  return (
    <div 
      ref={progressBarRef}
      className="progress-bar"
      style={{
        width: '100%',
        height: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '10px',
        overflow: 'hidden'
      }}
    >
      <div
        ref={progressFillRef}
        className="progress-fill"
        style={{
          height: '100%',
          width: '0%',
          transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out'
        }}
      />
    </div>
  );
}