import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import WaveSurfer from 'wavesurfer.js';
import TrackUploader from './TrackUploader';
import AudioTrack from './AudioTrack';
import Timeline from './Timeline';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Track {
  file: File;
  id: string;
  position: number;
  duration: number;
  wavesurfer?: WaveSurfer;
}

const AudioEditor: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();
  const [isFFmpegLoading, setIsFFmpegLoading] = useState(true);

  const load = async () => {
    try {
      setIsFFmpegLoading(true);
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
      toast({
        title: "Ready to Export",
        description: "FFmpeg has been loaded successfully.",
      });
    } catch (error) {
      console.error('FFmpeg loading error:', error);
      toast({
        title: "FFmpeg Loading Error",
        description: "Failed to load FFmpeg. Export functionality may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsFFmpegLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

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

  const exportTimeline = async () => {
    if (isFFmpegLoading) {
      toast({
        title: "Please Wait",
        description: "FFmpeg is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    if (!loaded) {
      toast({
        title: "Export Error",
        description: "FFmpeg failed to load. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    if (tracks.length === 0) {
      toast({
        title: "Export Error",
        description: "Please add some tracks before exporting",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    const ffmpeg = ffmpegRef.current;

    try {
      // Write all audio files to FFmpeg's virtual filesystem
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const inputData = await fetchFile(track.file);
        await ffmpeg.writeFile(`input${i}.mp3`, inputData);
      }

      // Create a complex filter to mix all audio files
      const filterComplex = tracks
        .map((_, i) => `[${i}:a]`)
        .join('') + `concat=n=${tracks.length}:v=0:a=1[out]`;

      // Build the FFmpeg command
      const command = [
        '-i', 'input0.mp3',
        ...tracks.slice(1).flatMap((_, i) => ['-i', `input${i + 1}.mp3`]),
        '-filter_complex', filterComplex,
        '-map', '[out]',
        'output.mp4'
      ];

      // Run FFmpeg command
      await ffmpeg.exec(command);

      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timeline_export.mp4';
      a.click();

      toast({
        title: "Export Successful",
        description: "Your timeline has been exported successfully!",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your timeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const maxDuration = Math.max(...tracks.map(t => t.duration), 0);
  const timelineWidth = maxDuration * 100; // 100px per second

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Audio Timeline Editor</h1>
        
        <TrackUploader onFilesAdded={handleFilesAdded} />

        {tracks.length > 0 && (
          <>
            <div className="flex gap-4 mb-4">
              <Button
                variant="default"
                onClick={playTracks}
                disabled={isPlaying}
                className="bg-green-500 hover:bg-green-600"
              >
                Play All
              </Button>
              <Button
                variant="default"
                onClick={stopPlayback}
                disabled={!isPlaying}
                className="bg-red-500 hover:bg-red-600"
              >
                Stop
              </Button>
            </div>

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
          </>
        )}

        {tracks.length > 0 && (
          <Button
            className="w-full"
            onClick={exportTimeline}
            disabled={isExporting || isFFmpegLoading}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : isFFmpegLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading FFmpeg...
              </>
            ) : (
              'Export Timeline'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AudioEditor;