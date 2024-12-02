import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface TrackUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

const TrackUploader: React.FC<TrackUploaderProps> = ({ onFilesAdded }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const audioFiles = acceptedFiles.filter(file => file.type.startsWith('audio/'));
    onFilesAdded(audioFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav']
    }
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragActive ? 'border-editor-accent bg-editor-accent/10' : 'border-gray-600'}`}
    >
      <input {...getInputProps()} />
      <p className="text-white">
        {isDragActive
          ? 'Drop the audio files here...'
          : 'Drag & drop audio files here, or click to select files'}
      </p>
    </div>
  );
};

export default TrackUploader;