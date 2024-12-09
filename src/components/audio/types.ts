import WaveSurfer from 'wavesurfer.js';

export interface Track {
  file: File;
  id: string;
  position: number;
  duration: number;
  wavesurfer?: WaveSurfer;
}