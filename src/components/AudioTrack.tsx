import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioTrackProps {
  file: File;
  onLoad: (duration: number) => void;
  position: number;
  onPositionChange: (newPosition: number) => void;
}

const AudioTrack: React.FC<AudioTrackProps> = ({ file, onLoad, position, onPositionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4a90e2',
      progressColor: '#9b51e0',
      height: 80,
      normalize: true,
      backend: 'WebAudio'
    });

    const wavesurfer = wavesurferRef.current;

    wavesurfer.loadBlob(file);
    wavesurfer.on('ready', () => {
      onLoad(wavesurfer.getDuration());
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [file]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX - position;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const newPosition = Math.max(0, e.clientX - startX.current);
    onPositionChange(newPosition);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="relative bg-editor-bg p-4 rounded-lg cursor-move"
      style={{ transform: `translateX(${position}px)` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="text-white mb-2">{file.name}</div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
};

export default AudioTrack;