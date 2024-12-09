import React, { useState } from 'react';
import TrackUploader from './TrackUploader';
import AudioTrack from './AudioTrack';
import Timeline from './Timeline';
import { Track } from './audio/types';
import { useFFmpeg } from './audio/FFmpegLoader';
import { ExportButton } from './audio/ExportButton';
import { PlaybackControls } from './audio/PlaybackControls';
import WaveSurfer from 'wavesurfer.js';

const AudioEditor: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const { ffmpeg, loaded, isFFmpegLoading } = useFFmpeg();

  const handleFilesAdded = (files: File[]) => {
    const lastTrack = tracks[tracks.length - 1];
    const startPosition = lastTrack ? lastTrack.position + (lastTrack.duration * 100) : 0;
    
    const newTracks = files.map((file, index) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      position: startPosition + (index * 100),
      duration: 0,
    }));
    setTracks((prev) => [...prev, ...newTracks]);
  };

  const handleTrackLoad = (id: string, duration: number, wavesurfer: WaveSurfer) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === id ? { ...track, duration, wavesurfer } : track
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

  const playTracks = async () => {
    if (tracks.length === 0) return;
    
    setIsPlaying(true);
    setCurrentTrackIndex(0);

    const playTrackSequentially = async (index: number) => {
      if (index >= tracks.length) {
        setIsPlaying(false);
        setCurrentTrackIndex(0);
        return;
      }

      const currentTrack = tracks[index];
      if (currentTrack.wavesurfer) {
        currentTrack.wavesurfer.play();
        currentTrack.wavesurfer.on('finish', () => {
          playTrackSequentially(index + 1);
        });
      }
    };

    await playTrackSequentially(0);
  };

  const stopPlayback = () => {
    tracks.forEach(track => {
      if (track.wavesurfer) {
        track.wavesurfer.stop();
      }
    });
    setIsPlaying(false);
    setCurrentTrackIndex(0);
  };

  const maxDuration = Math.max(...tracks.map(t => t.duration), 0);
  const timelineWidth = maxDuration * 100; // 100px per second

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Audio Timeline Editor</h1>
        
        <TrackUploader onFilesAdded={handleFilesAdded} />

        <PlaybackControls
          tracks={tracks}
          isPlaying={isPlaying}
          onPlay={playTracks}
          onStop={stopPlayback}
        />

        {tracks.length > 0 && (
          <div className="relative border border-gray-700 rounded-lg p-4 overflow-x-auto">
            <Timeline duration={maxDuration} width={timelineWidth} />
            
            <div className="relative mt-4 space-y-4" style={{ width: `${timelineWidth}px` }}>
              {tracks.map((track) => (
                <AudioTrack
                  key={track.id}
                  file={track.file}
                  onLoad={(duration, wavesurfer) => handleTrackLoad(track.id, duration, wavesurfer)}
                  position={track.position}
                  onPositionChange={(newPosition) => handlePositionChange(track.id, newPosition)}
                  isPlaying={isPlaying && tracks.indexOf(track) === currentTrackIndex}
                />
              ))}
            </div>
          </div>
        )}

        {tracks.length > 0 && (
          <ExportButton
            ffmpeg={ffmpeg}
            tracks={tracks}
            isFFmpegLoading={isFFmpegLoading}
            loaded={loaded}
          />
        )}
      </div>
    </div>
  );
};

export default AudioEditor;
