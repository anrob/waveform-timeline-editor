import { Button } from "@/components/ui/button";
import { Track } from "./types";

interface PlaybackControlsProps {
  tracks: Track[];
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export const PlaybackControls = ({ tracks, isPlaying, onPlay, onStop }: PlaybackControlsProps) => {
  if (tracks.length === 0) return null;

  return (
    <div className="flex gap-4 mb-4">
      <Button
        variant="default"
        onClick={onPlay}
        disabled={isPlaying}
        className="bg-green-500 hover:bg-green-600"
      >
        Play All
      </Button>
      <Button
        variant="default"
        onClick={onStop}
        disabled={!isPlaying}
        className="bg-red-500 hover:bg-red-600"
      >
        Stop
      </Button>
    </div>
  );
};