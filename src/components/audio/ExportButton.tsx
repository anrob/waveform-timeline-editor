import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Track } from "./types";

interface ExportButtonProps {
  ffmpeg: FFmpeg;
  tracks: Track[];
  isFFmpegLoading: boolean;
  loaded: boolean;
}

export const ExportButton = ({ ffmpeg, tracks, isFFmpegLoading, loaded }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

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

  return (
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
  );
};