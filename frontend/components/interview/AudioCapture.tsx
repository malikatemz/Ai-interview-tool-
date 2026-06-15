'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface AudioCaptureProps {
  enabled: boolean;
  onToggle: () => void;
  onAudioData?: (data: Float32Array) => void;
  visualizer?: boolean;
  className?: string;
}

export function AudioCapture({
  enabled,
  onToggle,
  onAudioData,
  visualizer = true,
  className,
}: AudioCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    let mounted = true;
    let animationId: number;

    async function initAudio() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (mounted) {
          setStream(mediaStream);

          // Set up audio analysis
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(mediaStream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          // Visualize audio levels
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          function draw() {
            if (!mounted || !analyser || !canvasRef.current) return;
            
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(average / 255);

            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                
                const barWidth = canvasRef.current.width / dataArray.length;
                let x = 0;
                
                for (const value of dataArray) {
                  const barHeight = (value / 255) * canvasRef.current.height;
                  const gradient = ctx.createLinearGradient(0, canvasRef.current.height, 0, canvasRef.current.height - barHeight);
                  gradient.addColorStop(0, '#6366f1');
                  gradient.addColorStop(1, '#a855f7');
                  
                  ctx.fillStyle = gradient;
                  ctx.fillRect(x, canvasRef.current.height - barHeight, barWidth, barHeight);
                  x += barWidth;
                }
              }
            }

            animationId = requestAnimationFrame(draw);
          }

          draw();
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Microphone access denied. Please allow microphone permissions.');
          console.error('Microphone error:', err);
        }
      }
    }

    if (enabled) {
      initAudio();
    }

    return () => {
      mounted = false;
      cancelAnimationFrame(animationId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled]);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Audio visualizer */}
      {enabled && visualizer && (
        <div className="w-full">
          <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full rounded-md bg-[var(--surface-elevated)]"
          />
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={onToggle}
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full transition-all',
          enabled
            ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30'
            : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
        )}
        aria-label={enabled ? 'Turn off microphone' : 'Turn on microphone'}
      >
        {enabled ? (
          <Mic className="h-6 w-6" />
        ) : (
          <MicOff className="h-6 w-6" />
        )}
      </button>

      {/* Status */}
      <div className="text-center">
        <p className={cn(
          'text-sm font-medium',
          enabled ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
        )}>
          {enabled ? 'Microphone On' : 'Microphone Off'}
        </p>
        {error && (
          <p className="mt-1 text-xs text-[var(--accent-danger)]">{error}</p>
        )}
      </div>

      {/* Audio level indicator */}
      {enabled && (
        <div className="flex items-center gap-2">
          <VolumeX className="h-4 w-4 text-[var(--text-secondary)]" />
          <div className="h-2 w-24 rounded-full bg-[var(--surface-elevated)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 transition-all"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          <Volume2 className="h-4 w-4 text-[var(--text-secondary)]" />
        </div>
      )}
    </div>
  );
}

interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  audioBlob: Blob | null;
  audioUrl: string | null;
  isRecording: boolean;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      
      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Failed to start recording');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.onstop = () => {
          const blob = new Blob([...mediaRecorder.stream.getTracks().map(t => t)],
            { type: 'audio/webm' });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          setIsRecording(false);
          resolve(blob);
        };
        mediaRecorder.stop();
      } else {
        resolve(audioBlob);
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    });
  }, [mediaRecorder, audioBlob, stream]);

  return {
    startRecording,
    stopRecording,
    audioBlob,
    audioUrl,
    isRecording,
    error,
  };
}
