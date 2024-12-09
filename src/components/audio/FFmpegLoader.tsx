import { useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { useToast } from "@/components/ui/use-toast";

export const useFFmpeg = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [isFFmpegLoading, setIsFFmpegLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      setIsFFmpegLoading(true);
      console.log('Starting FFmpeg loading process...');
      
      // Use jsdelivr CDN which is more reliable
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      console.log('Fetching FFmpeg resources...');
      
      // Fetch resources directly to handle CORS properly
      const coreResponse = await fetch(`${baseURL}/ffmpeg-core.js`);
      const wasmResponse = await fetch(`${baseURL}/ffmpeg-core.wasm`);
      
      const coreBlob = await coreResponse.blob();
      const wasmBlob = await wasmResponse.blob();
      
      const coreURL = URL.createObjectURL(coreBlob);
      const wasmURL = URL.createObjectURL(wasmBlob);
      
      console.log('Loading FFmpeg with fetched resources...');
      await ffmpeg.load({
        coreURL,
        wasmURL,
      });
      
      console.log('FFmpeg loaded successfully');
      setLoaded(true);
      setIsFFmpegLoading(false);
      
      // Clean up blob URLs
      URL.revokeObjectURL(coreURL);
      URL.revokeObjectURL(wasmURL);
      
      toast({
        title: "Ready to Export",
        description: "FFmpeg has been loaded successfully.",
      });
    } catch (error) {
      console.error('Detailed FFmpeg loading error:', error);
      setIsFFmpegLoading(false);
      setLoaded(false);
      
      toast({
        title: "FFmpeg Loading Error",
        description: "Failed to load FFmpeg. Please refresh and try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('Initial load effect triggered');
    load();
    return () => {
      console.log('Cleaning up FFmpeg resources');
      const ffmpeg = ffmpegRef.current;
      if (ffmpeg) {
        ffmpeg.terminate();
      }
    };
  }, []);

  return { ffmpeg: ffmpegRef.current, loaded, isFFmpegLoading };
};