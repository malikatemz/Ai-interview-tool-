'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Square, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Settings,
  AlertTriangle,
  MessageSquare,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';

interface InterviewControlsProps {
  status: 'setup' | 'running' | 'paused' | 'follow_up' | 'transition' | 'wrap_up' | 'completed';
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  isFullscreen: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleScreenShare: () => void;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
  warnings?: Array<{ type: string; message: string }>;
  className?: string;
}

export function InterviewControls({
  status,
  cameraEnabled,
  microphoneEnabled,
  screenSharing,
  isFullscreen,
  onStart,
  onPause,
  onResume,
  onEnd,
  onToggleCamera,
  onToggleMicrophone,
  onToggleScreenShare,
  onToggleFullscreen,
  onOpenSettings,
  warnings = [],
  className,
}: InterviewControlsProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

  const handlePauseClick = () => {
    if (status === 'running') {
      onPause();
    } else if (status === 'paused') {
      onResume();
    }
  };

  return (
    <>
      <div className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-3 w-3 items-center justify-center rounded-full',
              status === 'running' ? 'bg-red-500 animate-pulse' :
              status === 'paused' ? 'bg-yellow-500' :
              status === 'setup' ? 'bg-blue-500' : 'bg-gray-500'
            )}
          />
          <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
            {status === 'follow_up' ? 'Follow-up Question' : status}
          </span>
        </div>

        {/* Main controls */}
        <div className="flex items-center gap-2">
          {/* Start/Resume button */}
          {(status === 'setup' || status === 'paused') && (
            <Button onClick={status === 'setup' ? onStart : onResume} variant="default" size="sm">
              <Play className="mr-1 h-4 w-4" />
              {status === 'setup' ? 'Start Interview' : 'Resume'}
            </Button>
          )}

          {/* Pause button */}
          {(status === 'running' || status === 'follow_up') && (
            <Button onClick={handlePauseClick} variant="secondary" size="sm">
              <Pause className="mr-1 h-4 w-4" />
              Pause
            </Button>
          )}

          {/* End button */}
          {(status === 'running' || status === 'paused' || status === 'follow_up') && (
            <Button 
              onClick={() => setShowEndConfirm(true)} 
              variant="danger" 
              size="sm"
            >
              <Square className="mr-1 h-4 w-4" />
              End
            </Button>
          )}

          <div className="mx-2 h-6 w-px bg-[var(--border)]" />

          {/* Device controls */}
          <Button
            onClick={onToggleCamera}
            variant={cameraEnabled ? 'secondary' : 'ghost'}
            size="icon"
            aria-label={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            onClick={onToggleMicrophone}
            variant={microphoneEnabled ? 'secondary' : 'ghost'}
            size="icon"
            aria-label={microphoneEnabled ? 'Turn off microphone' : 'Turn on microphone'}
          >
            {microphoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          <Button
            onClick={onToggleScreenShare}
            variant={screenSharing ? 'secondary' : 'ghost'}
            size="icon"
            aria-label={screenSharing ? 'Stop screen share' : 'Share screen'}
          >
            {screenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </Button>

          <div className="mx-2 h-6 w-px bg-[var(--border)]" />

          {/* View toggles */}
          <Button
            onClick={onToggleFullscreen}
            variant="ghost"
            size="icon"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <Button
            onClick={onOpenSettings}
            variant="ghost"
            size="icon"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Warnings banner */}
      {warnings.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-600 dark:text-yellow-400">
            {warnings.length} warning{warnings.length > 1 ? 's' : ''} detected
          </span>
        </div>
      )}

      {/* End interview confirmation */}
      <ConfirmModal
        open={showEndConfirm}
        onOpenChange={setShowEndConfirm}
        title="End Interview"
        description="Are you sure you want to end this interview? This action cannot be undone."
        confirmLabel="End Interview"
        onConfirm={onEnd}
        variant="danger"
      />

      {/* Pause confirmation */}
      <ConfirmModal
        open={showPauseConfirm}
        onOpenChange={setShowPauseConfirm}
        title="Pause Interview"
        description="Taking a break? The interview timer will pause and you can resume when ready."
        confirmLabel="Pause"
        onConfirm={onPause}
      />
    </>
  );
}

interface SetupControlsProps {
  cameraReady: boolean;
  microphoneReady: boolean;
  deviceCheckComplete: boolean;
  onStartInterview: () => void;
  onTestCamera: () => void;
  onTestMicrophone: () => void;
  onSkipTest: () => void;
  className?: string;
}

export function SetupControls({
  cameraReady,
  microphoneReady,
  deviceCheckComplete,
  onStartInterview,
  onTestCamera,
  onTestMicrophone,
  onSkipTest,
  className,
}: SetupControlsProps) {
  const allReady = cameraReady && microphoneReady;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Device status */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-4 transition-colors',
            cameraReady
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-[var(--border)] bg-[var(--surface-elevated)]'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              cameraReady ? 'bg-green-500/20 text-green-500' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            )}
          >
            {cameraReady ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Camera</p>
            <p className={cn('text-xs', cameraReady ? 'text-green-500' : 'text-[var(--text-secondary)]')}>
              {cameraReady ? 'Ready' : 'Not detected'}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-4 transition-colors',
            microphoneReady
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-[var(--border)] bg-[var(--surface-elevated)]'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              microphoneReady ? 'bg-green-500/20 text-green-500' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            )}
          >
            {microphoneReady ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Microphone</p>
            <p className={cn('text-xs', microphoneReady ? 'text-green-500' : 'text-[var(--text-secondary)]')}>
              {microphoneReady ? 'Ready' : 'Not detected'}
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <Keyboard className="h-4 w-4" />
          Keyboard Shortcuts
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono">Space</kbd>
            <span>Submit response</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono">Esc</kbd>
            <span>Pause interview</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono">M</kbd>
            <span>Toggle microphone</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono">V</kbd>
            <span>Toggle camera</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button onClick={onSkipTest} variant="outline" className="flex-1">
          Skip Test
        </Button>
        <Button
          onClick={onStartInterview}
          disabled={!deviceCheckComplete}
          variant="default"
          className="flex-1"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Interview
        </Button>
      </div>
    </div>
  );
}
