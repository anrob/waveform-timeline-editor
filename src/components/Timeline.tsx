import React from 'react';

interface TimelineProps {
  duration: number;
  width: number;
}

const Timeline: React.FC<TimelineProps> = ({ duration, width }) => {
  const markers = [];
  const interval = 1; // 1 second intervals
  const pixelsPerSecond = 100;

  for (let i = 0; i <= duration; i += interval) {
    const position = i * pixelsPerSecond;
    if (position > width) break;

    markers.push(
      <div
        key={i}
        className="absolute h-4 border-l border-editor-marker"
        style={{ left: `${position}px` }}
      >
        <span className="absolute top-4 text-xs text-editor-marker -translate-x-1/2">
          {formatTime(i)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-8 border-b border-editor-marker">
      {markers}
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default Timeline;