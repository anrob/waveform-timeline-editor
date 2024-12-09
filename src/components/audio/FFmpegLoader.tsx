import { useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { useToast } from "@/components/ui/use-toast";

export const useFFmpeg = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [isFFmpegLoading, setIsFFmpegLoading] = useState(true);
  const { toast } = useToast();
  const loadAttemptRef = useRef(0);

  const load = async () => {
    try {
      setIsFFmpegLoading(true);
      console.log(`[FFmpeg] Starting load attempt ${loadAttemptRef.current + 1}`);
      
      // Use jsdelivr CDN which is more reliable
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      console.log('[FFmpeg] Fetching resources from:', baseURL);
      
      // Fetch resources with timeout and retry logic
      const fetchWithTimeout = async (url: string, timeout = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      console.log('[FFmpeg] Fetching core.js...');
      const coreResponse = await fetchWithTimeout(`${baseURL}/ffmpeg-core.js`);
      console.log('[FFmpeg] Fetching core.wasm...');
      const wasmResponse = await fetchWithTimeout(`${baseURL}/ffmpeg-core.wasm`);
      
      console.log('[FFmpeg] Converting responses to blobs...');
      const coreBlob = await coreResponse.blob();
      const wasmBlob = await wasmResponse.blob();
      
      const coreURL = URL.createObjectURL(coreBlob);
      const wasmURL = URL.createObjectURL(wasmBlob);
      
      console.log('[FFmpeg] Loading FFmpeg with resources...');
      await ffmpeg.load({
        coreURL,
        wasmURL,
      });
      
      console.log('[FFmpeg] Successfully loaded!');
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
      console.error('[FFmpeg] Loading error:', error);
      setIsFFmpegLoading(false);
      setLoaded(false);
      
      // Increment attempt counter
      loadAttemptRef.current += 1;
      
      // Retry up to 3 times with increasing delay
      if (loadAttemptRef.current < 3) {
        const retryDelay = loadAttemptRef.current * 2000; // 2s, 4s, 6s
        console.log(`[FFmpeg] Retrying in ${retryDelay/1000}s... (Attempt ${loadAttemptRef.current + 1}/3)`);
        
        toast({
          title: "Loading FFmpeg",
          description: `Retrying in ${retryDelay/1000} seconds... (Attempt ${loadAttemptRef.current + 1}/3)`,
        });
        
        setTimeout(load, retryDelay);
      } else {
        console.error('[FFmpeg] Max retry attempts reached');
        toast({
          title: "FFmpeg Loading Error",
          description: "Failed to load FFmpeg after multiple attempts. Please refresh the page.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    console.log('[FFmpeg] Initial load effect triggered');
    load();
    return () => {
      console.log('[FFmpeg] Cleaning up FFmpeg resources');
      const ffmpeg = ffmpegRef.current;
      if (ffmpeg) {
        ffmpeg.terminate();
      }
    };
  }, []);

  return { ffmpeg: ffmpegRef.current, loaded, isFFmpegLoading };
};