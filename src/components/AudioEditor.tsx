import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import TrackUploader from './TrackUploader';
import AudioTrack from './AudioTrack';
import Timeline from './Timeline';

interface Track {
  file: File;
  id: string;
  position: number;
  duration: number;
}

const AudioEditor: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setLoaded(true);
  };

  React.useEffect(() => {
    load();
  }, []);

  const handleFilesAdded = (files: File[]) => {
    const newTracks = files.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      position: 0,
      duration: 0,
    }));
    setTracks((prev) => [...prev, ...newTracks]);
  };

  const handleTrackLoad = (id: string, duration: number) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === id ? { ...track, duration } : track
      )
    );
  };

  const handlePositionChange = (id: string, newPosition: number) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === id ? { ...track, position: newPosition } : track
      )
    );
  };

  const maxDuration = Math.max(...tracks.map(t => t.duration), 0);
  const timelineWidth = maxDuration * 100; // 100px per second

  return (
    <div className="min-h-screen bg-editor-bg p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Audio Timeline Editor</h1>
        
        <TrackUploader onFilesAdded={handleFilesAdded} />

        {tracks.length > 0 && (
          <div className="relative border border-editor-marker rounded-lg p-4">
            <Timeline duration={maxDuration} width={timelineWidth} />
            
            <div className="relative mt-4 space-y-4" style={{ width: `${timelineWidth}px` }}>
              {tracks.map((track) => (
                <AudioTrack
                  key={track.id}
                  file={track.file}
                  onLoad={(duration) => handleTrackLoad(track.id, duration)}
                  position={track.position}
                  onPositionChange={(newPosition) => handlePositionChange(track.id, newPosition)}
                />
              ))}
            </div>
          </div>
        )}

        {tracks.length > 0 && (
          <button
            className="px-6 py-3 bg-editor-accent text-white rounded-lg hover:bg-editor-accent/80 transition-colors"
            onClick={() => {/* Export functionality will be implemented in the next iteration */}}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Timeline'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioEditor;