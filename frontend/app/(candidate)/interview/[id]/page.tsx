'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useInterviewStore } from '@/stores/interviewStore';
import { VideoCapture } from '@/components/interview/VideoCapture';
import { AudioCapture } from '@/components/interview/AudioCapture';
import { ChatMode, TranscriptDisplay, TypingIndicator } from '@/components/interview/ChatMode';
import { QuestionDisplay } from '@/components/interview/QuestionDisplay';
import { InterviewControls, SetupControls } from '@/components/interview/Controls';
import { InterviewProgress } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  MessageSquare, 
  Video, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

// Sample interview data
const SAMPLE_QUESTIONS = [
  {
    id: '1',
    content: "Can you walk me through your experience with designing scalable distributed systems? What challenges did you face?",
    type: 'technical' as const,
    category: 'system_design',
    difficulty: 7,
    expectedDuration: 180,
    followUpPrompts: [
      "What trade-offs did you consider in your design?",
      "How did you handle failure scenarios?",
      "How would you scale this for 10x traffic?"
    ]
  },
  {
    id: '2',
    content: "Tell me about a time when you had to lead a team through a difficult technical challenge. How did you approach it?",
    type: 'behavioral' as const,
    category: 'leadership',
    difficulty: 5,
    expectedDuration: 120,
    followUpPrompts: [
      "What was the outcome?",
      "How did you keep the team motivated?"
    ]
  },
  {
    id: '3',
    content: "If you discovered a critical bug in production during a Friday evening launch, what would be your immediate course of action?",
    type: 'situational' as const,
    category: 'problem_solving',
    difficulty: 6,
    expectedDuration: 150,
    followUpPrompts: [
      "How would you communicate with stakeholders?",
      "What steps would you take to prevent future incidents?"
    ]
  }
];

const SAMPLE_TRANSCRIPT = [
  {
    id: '1',
    speaker: 'ai' as const,
    text: "Can you walk me through your experience with designing scalable distributed systems?",
    startTime: 0,
    endTime: 5
  },
  {
    id: '2',
    speaker: 'candidate' as const,
    text: "Sure, I've worked on several large-scale distributed systems. At my last company, we designed a real-time messaging platform that handled millions of concurrent connections...",
    startTime: 5,
    endTime: 45
  },
  {
    id: '3',
    speaker: 'ai' as const,
    text: "That's interesting. Can you dive deeper into the architecture you chose and why?",
    startTime: 45,
    endTime: 50
  }
];

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.id;
  
  // Store state
  const {
    status,
    setStatus,
    cameraEnabled,
    microphoneEnabled,
    toggleCamera,
    toggleMicrophone,
    deviceCheckComplete,
    setDeviceCheckComplete,
    elapsedSeconds,
    updateElapsedTime,
    targetDuration,
    currentQuestionIndex,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    transcript,
    addTranscriptSegment,
    warnings,
    addWarning,
    reset
  } = useInterviewStore();

  // Local state
  const [mode, setMode] = useState<'video' | 'chat'>('video');
  const [showTranscript, setShowTranscript] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'ai' | 'candidate';
    content: string;
    timestamp: number;
  }>>([]);

  // Initialize questions
  useEffect(() => {
    setQuestions(SAMPLE_QUESTIONS as any);
    setCurrentQuestion(SAMPLE_QUESTIONS[0] as any);
  }, [setQuestions, setCurrentQuestion]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'running') {
      interval = setInterval(() => {
        updateElapsedTime(elapsedSeconds + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [status, elapsedSeconds, updateElapsedTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'running') return;
      
      switch (e.key.toLowerCase()) {
        case 'm':
          toggleMicrophone();
          break;
        case 'v':
          toggleCamera();
          break;
        case 'escape':
          setStatus('paused');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, toggleCamera, toggleMicrophone, setStatus]);

  // Tab switch detection
  useEffect(() => {
    if (status !== 'running') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning({
          id: Date.now().toString(),
          type: 'tab_switch',
          message: 'Tab switch detected',
          timestamp: Date.now()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, addWarning]);

  const handleStartInterview = useCallback(() => {
    setStatus('running');
    setMessages([{
      id: '1',
      role: 'ai',
      content: "Hello! I'm your AI interviewer today. I'll be asking you a series of questions to learn more about your experience and skills. Let's start!",
      timestamp: 0
    }]);
  }, [setStatus]);

  const handlePauseInterview = useCallback(() => {
    setStatus('paused');
  }, [setStatus]);

  const handleResumeInterview = useCallback(() => {
    setStatus('running');
  }, [setStatus]);

  const handleEndInterview = useCallback(() => {
    setStatus('completed');
  }, [setStatus]);

  const handleSendMessage = useCallback((message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      role: 'candidate' as const,
      content: message,
      timestamp: elapsedSeconds
    };
    
    setMessages(prev => [...prev, newMessage]);
    addTranscriptSegment({
      id: newMessage.id,
      speaker: 'candidate',
      text: message,
      startTime: elapsedSeconds,
      endTime: elapsedSeconds + 5
    });
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'ai' as const,
        content: "Thank you for that response. Let me ask a follow-up question...",
        timestamp: elapsedSeconds + 5
      };
      setMessages(prev => [...prev, aiResponse]);
      addTranscriptSegment({
        id: aiResponse.id,
        speaker: 'ai',
        text: aiResponse.content,
        startTime: elapsedSeconds + 5,
        endTime: elapsedSeconds + 10
      });
    }, 2000);
  }, [elapsedSeconds, addTranscriptSegment]);

  const handleNextQuestion = useCallback(() => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < SAMPLE_QUESTIONS.length) {
      setCurrentQuestion(SAMPLE_QUESTIONS[nextIndex] as any);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: SAMPLE_QUESTIONS[nextIndex].content,
        timestamp: elapsedSeconds
      }]);
    }
  }, [currentQuestionIndex, setCurrentQuestion, elapsedSeconds]);

  const handleDeviceCheck = useCallback((type: 'camera' | 'mic', ready: boolean) => {
    if (type === 'camera') setCameraReady(ready);
    if (type === 'mic') setMicReady(ready);
    
    if (ready && type === 'mic') {
      setDeviceCheckComplete(true);
    }
  }, [setDeviceCheckComplete]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Setup phase
  if (status === 'setup') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Interview Setup
              </h1>
              <p className="text-[var(--text-secondary)]">
                Let's make sure your devices are working properly before we begin.
              </p>
            </div>

            <SetupControls
              cameraReady={cameraReady}
              microphoneReady={micReady}
              deviceCheckComplete={deviceCheckComplete}
              onStartInterview={handleStartInterview}
              onTestCamera={() => handleDeviceCheck('camera', true)}
              onTestMicrophone={() => handleDeviceCheck('mic', true)}
              onSkipTest={handleStartInterview}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed phase
  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Interview Completed
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Thank you for completing the interview. Your responses have been recorded and will be reviewed by the hiring team.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--surface-elevated)] rounded-lg p-4">
                <p className="text-sm text-[var(--text-secondary)]">Duration</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
                </p>
              </div>
              <div className="bg-[var(--surface-elevated)] rounded-lg p-4">
                <p className="text-sm text-[var(--text-secondary)]">Questions</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {SAMPLE_QUESTIONS.length}
                </p>
              </div>
            </div>

            <Button className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main interview view
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              AI Interview
            </h1>
            <span className={cn(
              "flex items-center gap-1.5 text-sm",
              status === 'running' ? "text-red-500" : "text-yellow-500"
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full",
                status === 'running' ? "bg-red-500 animate-pulse" : "bg-yellow-500"
              )} />
              {status === 'running' ? 'Recording' : 'Paused'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Transcript
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Video/Chat */}
        <div className="flex-1 flex flex-col">
          {/* Video or Chat mode */}
          <div className="flex-1 p-4">
            {mode === 'video' ? (
              <div className="h-full grid grid-cols-2 gap-4">
                {/* Camera view */}
                <div className="relative">
                  <VideoCapture
                    enabled={cameraEnabled}
                    onToggle={toggleCamera}
                    className="h-full"
                  />
                  
                  {/* Self view label */}
                  <div className="absolute bottom-4 left-4 bg-black/50 rounded px-2 py-1 text-xs text-white">
                    Camera {cameraEnabled ? 'On' : 'Off'}
                  </div>
                </div>

                {/* AI Interviewer view (placeholder) */}
                <div className="relative rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-24 w-24 rounded-full bg-[var(--accent-primary)]/20 mx-auto mb-4 flex items-center justify-center">
                      <Video className="h-12 w-12 text-[var(--accent-primary)]" />
                    </div>
                    <p className="font-medium text-[var(--text-primary)]">AI Interviewer</p>
                    <p className="text-sm text-[var(--text-secondary)]">Sarah Chen</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full">
                <ChatMode
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  disabled={status !== 'running'}
                  showTimestamps
                  className="h-full"
                />
              </div>
            )}
          </div>

          {/* Question display */}
          {currentQuestion && (
            <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
              <QuestionDisplay
                question={currentQuestion as any}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={SAMPLE_QUESTIONS.length}
                onNext={handleNextQuestion}
              />
            </div>
          )}

          {/* Controls */}
          <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
            <InterviewControls
              status={status}
              cameraEnabled={cameraEnabled}
              microphoneEnabled={microphoneEnabled}
              screenSharing={false}
              isFullscreen={isFullscreen}
              onStart={handleStartInterview}
              onPause={handlePauseInterview}
              onResume={handleResumeInterview}
              onEnd={handleEndInterview}
              onToggleCamera={toggleCamera}
              onToggleMicrophone={toggleMicrophone}
              onToggleScreenShare={() => {}}
              onToggleFullscreen={toggleFullscreen}
              onOpenSettings={() => setShowSettings(true)}
              warnings={warnings.map(w => ({ type: w.type, message: w.message }))}
            />
          </div>
        </div>

        {/* Right panel - Transcript */}
        {showTranscript && (
          <div className="w-96 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[var(--text-primary)]">Live Transcript</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranscript(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <TranscriptDisplay
                segments={transcript.length > 0 ? transcript : SAMPLE_TRANSCRIPT as any}
                className="h-full"
              />
            </div>

            {/* Progress */}
            <div className="p-4 border-t border-[var(--border)]">
              <InterviewProgress
                elapsedSeconds={elapsedSeconds}
                targetMinutes={targetDuration}
                currentQuestion={currentQuestionIndex + 1}
                totalQuestions={SAMPLE_QUESTIONS.length}
              />
            </div>
          </div>
        )}
      </div>

      {/* Warnings banner */}
      {warnings.length > 0 && (
        <div className="absolute top-16 left-0 right-0 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              {warnings.length} warning{warnings.length > 1 ? 's' : ''} detected
            </span>
          </div>
        </div>
      )}

      {/* Settings modal */}
      <Modal
        open={showSettings}
        onOpenChange={setShowSettings}
        title="Interview Settings"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Mode</h3>
            <div className="flex gap-2">
              <Button
                variant={mode === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('video')}
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button
                variant={mode === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('chat')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Devices</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-[var(--surface-elevated)] rounded">
                <span className="text-sm">Camera</span>
                <span className={cn(
                  "text-sm",
                  cameraEnabled ? "text-green-500" : "text-[var(--text-secondary)]"
                )}>
                  {cameraEnabled ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[var(--surface-elevated)] rounded">
                <span className="text-sm">Microphone</span>
                <span className={cn(
                  "text-sm",
                  microphoneEnabled ? "text-green-500" : "text-[var(--text-secondary)]"
                )}>
                  {microphoneEnabled ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
