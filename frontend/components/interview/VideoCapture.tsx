'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Video, VideoOff, Camera } from 'lucide-react';

interface VideoCaptureProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
  showControls?: boolean;
}

export function VideoCapture({
  enabled,
  onToggle,
  className,
  showControls = true,
}: VideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Camera access denied. Please allow camera permissions.');
          console.error('Camera error:', err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (enabled) {
      initCamera();
    }

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled]);

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-black', className)}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'h-full w-full object-cover',
          !enabled && 'hidden'
        )}
      />

      {/* Camera off state */}
      {!enabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-elevated)]">
          <VideoOff className="h-16 w-16 text-[var(--text-secondary)]" />
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Camera is off
          </p>
        </div>
      )}

      {/* Loading state */}
      {enabled && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center">
            <Camera className="h-8 w-8 animate-pulse text-white" />
            <p className="mt-2 text-sm text-white/80">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]">
          <div className="text-center">
            <VideoOff className="mx-auto h-12 w-12 text-[var(--accent-danger)]" />
            <p className="mt-2 text-sm text-[var(--accent-danger)]">{error}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              enabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-[var(--accent-primary)] text-white hover:opacity-90'
            )}
          >
            {enabled ? (
              <>
                <VideoOff className="h-4 w-4" />
                Turn Off
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Turn On
              </>
            )}
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {enabled && !isLoading && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-medium text-white">REC</span>
        </div>
      )}
    </div>
  );
}

export function VideoPreview({
  stream,
  className,
}: {
  stream: MediaStream | null;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn('h-full w-full rounded-lg object-cover', className)}
    />
  );
}
