'use client';

import React, { useState } from 'react';
import { Mic, Square, Pause, Play, Trash2, Upload } from 'lucide-react';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { uploadServiceExtended } from '@/lib/services/blogService';

interface AudioRecorderProps {
  onAudioUploaded: (audioUrl: string) => void;
  onCancel: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioUploaded,
  onCancel,
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioURL,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  } = useAudioRecorder();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      const response = await uploadServiceExtended.uploadAudio(file);
      if (response.data) {
        // In Next.js, the API route will return the full URL
        const audioUrl = response.data.url;
        onAudioUploaded(audioUrl);
      }
    } catch (err) {
      console.error('Failed to upload audio:', err);
      setUploadError('Failed to upload audio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    resetRecording();
    setUploadError(null);
  };

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Audio Recorder</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-forest-600">
          {formatTime(recordingTime)}
        </div>
        {isRecording && (
          <div className="text-sm text-gray-600 mt-1">
            {isPaused ? 'Paused' : 'Recording...'}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {uploadError}
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex justify-center gap-2">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors"
            type="button"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="flex items-center gap-2 px-6 py-3 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors"
                type="button"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                type="button"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              type="button"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <Upload className="w-5 h-5" />
              {isUploading ? 'Uploading...' : 'Upload & Insert'}
            </button>
          </>
        )}
      </div>

      {/* Audio Playback */}
      {audioURL && audioBlob && (
        <div className="mt-4">
          <audio controls src={audioURL} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
