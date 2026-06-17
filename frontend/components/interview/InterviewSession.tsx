'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useInterview } from '@/hooks/useInterview';
import { QuestionDisplay } from './QuestionDisplay';
import { ChatMode, TranscriptDisplay, TypingIndicator } from './ChatMode';
import { InterviewControls } from './Controls';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  VideoCapture,
} from './VideoCapture';
import {
  Send,
  MessageSquare,
  Video,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Lightbulb,
  Bot,
  User,
  Loader2,
} from 'lucide-react';
import { formatDuration, formatTimestamp } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Score badge component
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'text-green-500' : score >= 6 ? 'text-blue-500' : 'text-yellow-500';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', color, 'bg-current/10')}>
      <TrendingUp className="h-3 w-3" />
      {score.toFixed(1)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation feedback component
// ─────────────────────────────────────────────────────────────────────────────

function EvaluationFeedback({ evaluation }: { evaluation: NonNullable<ReturnType<typeof useInterview>['lastEvaluation']> }) {
  return (
    <div className="rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-[var(--accent-primary)]" />
        <span className="text-sm font-medium text-[var(--accent-primary)]">Response Feedback</span>
        <ScoreBadge score={evaluation.overallScore} />
      </div>

      <p className="mb-3 text-sm text-[var(--text-secondary)]">{evaluation.feedback}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Depth', value: evaluation.depthScore },
          { label: 'Clarity', value: evaluation.clarityScore },
          { label: 'Technical', value: evaluation.technicalAccuracy },
          { label: 'Examples', value: evaluation.examplesQuality },
        ].map(({ label, value }) => (
          <div key={label} className="rounded bg-[var(--surface-elevated)] p-2 text-center">
            <div className={cn('text-lg font-semibold', value >= 7 ? 'text-green-500' : value >= 5 ? 'text-yellow-500' : 'text-red-500')}>
              {value.toFixed(1)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{label}</div>
          </div>
        ))}
      </div>

      {evaluation.followUpSuggested && (
        <p className="mt-3 text-xs italic text-[var(--text-secondary)]">
          → {evaluation.followUpSuggested}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interview Summary component
// ─────────────────────────────────────────────────────────────────────────────

function InterviewSummaryView({ summary }: { summary: NonNullable<ReturnType<typeof useInterview>['summary']> }) {
  const decisionColors: Record<string, string> = {
    STRONG_HIRE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    HIRE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    HOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    REJECT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <Card className="w-full max-w-2xl space-y-6 p-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-[var(--accent-success)]/10 p-4">
            <CheckCircle className="h-12 w-12 text-[var(--accent-success)]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Interview Complete</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Duration: {formatDuration(summary.durationSeconds)} • {summary.totalResponses} responses
          </p>
        </div>

        {/* Overall Score */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-[var(--text-primary)]">{summary.overallScore.toFixed(1)}</div>
            <div className="text-sm text-[var(--text-secondary)]">Overall Score</div>
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <span className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold',
            decisionColors[summary.recommendation] || decisionColors.HOLD
          )}>
            {summary.recommendation.replace('_', ' ')}
          </span>
        </div>

        {/* Strengths & Areas */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="rounded-lg bg-green-500/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-green-600 dark:text-green-400">Key Strengths</h3>
            <ul className="space-y-1">
              {summary.keyStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-yellow-500/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">Areas to Explore</h3>
            <ul className="space-y-1">
              {summary.areasToInvestigate.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-yellow-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main InterviewSession component
// ─────────────────────────────────────────────────────────────────────────────

interface InterviewSessionProps {
  interviewId: string;
  onComplete?: (summary: ReturnType<typeof useInterview>['summary']) => void;
  className?: string;
}

export function InterviewSession({ interviewId, onComplete, className }: InterviewSessionProps) {
  const {
    status,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    elapsedSeconds,
    remainingSeconds,
    progress,
    lastEvaluation,
    summary,
    warnings,
    transcript,
    isLoading,
    isSubmitting,
    error,
    startInterview,
    submitResponse,
    beginResponse,
    pauseInterview,
    resumeInterview,
    endInterview,
    recordWarning,
  } = useInterview(interviewId);

  // UI state
  const [mode, setMode] = useState<'video' | 'chat'>('chat');
  const [showTranscript, setShowTranscript] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Build chat messages from transcript + AI questions
  const chatMessages = React.useMemo(() => {
    const msgs: Array<{ id: string; role: 'ai' | 'candidate'; content: string; timestamp: number }> = [];
    transcript.forEach(seg => {
      msgs.push({
        id: seg.id,
        role: seg.speaker,
        content: seg.text,
        timestamp: seg.startTime,
      });
    });
    return msgs;
  }, [transcript]);

  // Auto-show evaluation after submission
  useEffect(() => {
    if (lastEvaluation) setShowEvaluation(true);
  }, [lastEvaluation]);

  // Focus input when question arrives
  useEffect(() => {
    if (currentQuestion && status === 'running' && mode === 'chat') {
      responseInputRef.current?.focus();
    }
  }, [currentQuestion, status, mode]);

  // Auto-scroll chat
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Tab switch detection
  useEffect(() => {
    if (status !== 'running') return;
    const handleVisibility = () => {
      if (document.hidden) recordWarning('tab_switch', 'Tab switch detected');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [status, recordWarning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (status !== 'running') return;
      if (e.key === 'Escape') pauseInterview();
      if (e.key === 'm' || e.key === 'M') setMicEnabled(v => !v);
      if (e.key === 'v' || e.key === 'V') setCameraEnabled(v => !v);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [status, pauseInterview]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    try {
      await startInterview();
    } catch {}
  }, [startInterview]);

  const handleSubmitResponse = useCallback(async () => {
    if (!responseText.trim() || isSubmitting) return;
    beginResponse();
    try {
      await submitResponse(responseText.trim());
      setResponseText('');
      setShowEvaluation(false);
    } catch {}
  }, [responseText, isSubmitting, beginResponse, submitResponse]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  }, [handleSubmitResponse]);

  const handleEnd = useCallback(async () => {
    setShowEndConfirm(false);
    await endInterview();
    onComplete?.(summary);
  }, [endInterview, onComplete, summary]);

  const handleNextQuestion = useCallback(async () => {
    if (!responseText.trim()) return;
    await handleSubmitResponse();
  }, [responseText, handleSubmitResponse]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Setup screen
  // ─────────────────────────────────────────────────────────────────────────

  if (status === 'setup') {
    return (
      <div className={cn('flex h-full flex-col items-center justify-center p-8', className)}>
        <Card className="w-full max-w-md space-y-6 p-8 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-[var(--accent-primary)]/10 p-4">
              <Bot className="h-12 w-12 text-[var(--accent-primary)]" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Ready to Begin?</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              The interview will ask you {totalQuestions || 10} questions about your experience.
              You can answer via text chat or video.
            </p>
          </div>
          <div className="space-y-2 text-left text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--accent-primary)]" />
              Target duration: {totalQuestions || 10 * 3} minutes
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[var(--accent-primary)]" />
              Chat or video response modes
            </div>
          </div>
          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}
          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Interview'
            )}
          </Button>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Completed screen
  // ─────────────────────────────────────────────────────────────────────────

  if (status === 'completed' && summary) {
    return <InterviewSummaryView summary={summary} />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Active interview screen
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-2.5 w-2.5 rounded-full',
              status === 'running' ? 'bg-red-500 animate-pulse' :
              status === 'paused' ? 'bg-yellow-500' :
              'bg-blue-500'
            )} />
            <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
              {status === 'follow_up' ? 'Follow-up Question' : status}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(elapsedSeconds)}</span>
            <span className="mx-1">·</span>
            <span className={remainingSeconds < 300 ? 'text-yellow-500' : ''}>
              {formatDuration(remainingSeconds)} left
            </span>
          </div>
          <ProgressBar value={progress} className="w-24" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscript(v => !v)}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            Transcript
          </Button>
          <div className="flex rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setMode('chat')}
              className={cn(
                'flex items-center gap-1 rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors',
                mode === 'chat'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <MessageSquare className="h-3 w-3" />
              Chat
            </button>
            <button
              onClick={() => setMode('video')}
              className={cn(
                'flex items-center gap-1 rounded-r-lg border-l border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors',
                mode === 'video'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Video className="h-3 w-3" />
              Video
            </button>
          </div>
        </div>
      </header>

      {/* Warnings banner */}
      {warnings.length > 0 && (
        <div className="flex items-center gap-2 border-b border-yellow-500/30 bg-yellow-500/10 px-6 py-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-600 dark:text-yellow-400">
            {warnings.length} warning{warnings.length > 1 ? 's' : ''} detected and logged
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mode panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'video' && (
              <div className="mb-4 grid h-64 grid-cols-2 gap-4">
                <VideoCapture enabled={cameraEnabled} onToggle={() => setCameraEnabled(v => !v)} className="h-full" />
                <div className="flex h-full items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20">
                  <div className="text-center">
                    <Bot className="mx-auto h-12 w-12 text-[var(--accent-primary)]" />
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">AI Interviewer</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat mode */}
            {mode === 'chat' && (
              <div className="mb-4 h-full">
                <ChatMode
                  messages={chatMessages}
                  onSendMessage={() => {}}
                  disabled
                  showTimestamps
                  className="h-full"
                />
              </div>
            )}

            {/* Evaluation feedback */}
            {showEvaluation && lastEvaluation && (
              <EvaluationFeedback evaluation={lastEvaluation} />
            )}
          </div>

          {/* Question + Response area */}
          <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
            {/* Current question */}
            {currentQuestion && (
              <div className="mb-4">
                <QuestionDisplay
                  question={currentQuestion as any}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={totalQuestions || 10}
                />
              </div>
            )}

            {/* Response input */}
            <div className="flex gap-3">
              <textarea
                ref={responseInputRef}
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here... (Enter to submit, Shift+Enter for new line)"
                disabled={isSubmitting || status === 'paused'}
                rows={3}
                className={cn(
                  'flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextQuestion}
                  disabled={!responseText.trim() || isSubmitting}
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript sidebar */}
        {showTranscript && (
          <div className="w-80 flex-shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] p-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Live Transcript</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TranscriptDisplay
                segments={transcript as any}
                className="h-full"
              />
            </div>
            <div className="border-t border-[var(--border)] p-4">
              <div className="text-xs text-[var(--text-secondary)]">
                Q {currentQuestionIndex + 1} of {totalQuestions || '?'}
              </div>
              <ProgressBar value={progress} className="mt-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
        <InterviewControls
          status={status}
          cameraEnabled={cameraEnabled}
          microphoneEnabled={micEnabled}
          screenSharing={false}
          isFullscreen={isFullscreen}
          onStart={handleStart}
          onPause={pauseInterview}
          onResume={resumeInterview}
          onEnd={() => setShowEndConfirm(true)}
          onToggleCamera={() => setCameraEnabled(v => !v)}
          onToggleMicrophone={() => setMicEnabled(v => !v)}
          onToggleScreenShare={() => {}}
          onToggleFullscreen={toggleFullscreen}
          onOpenSettings={() => setShowSettings(true)}
          warnings={warnings}
        />
      </div>

      {/* End confirmation modal */}
      <Modal
        open={showEndConfirm}
        onOpenChange={setShowEndConfirm}
        title="End Interview Early?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to end the interview now? Your responses so far will be evaluated.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowEndConfirm(false)} className="flex-1">
              Continue
            </Button>
            <Button variant="danger" onClick={handleEnd} className="flex-1">
              End Interview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
