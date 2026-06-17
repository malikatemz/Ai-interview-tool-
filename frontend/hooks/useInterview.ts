'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { interviewSocket } from '@/lib/websocket';
import { useInterviewStore } from '@/stores/interviewStore';
import { generateId } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QAQuestion {
  id: string;
  content: string;
  type: 'technical' | 'behavioral' | 'situational' | 'case_study';
  category: string;
  difficulty: number;
  expectedDuration: number;
  followUpPrompts: string[];
  evaluationCriteria: string[];
  sequenceOrder: number;
}

export interface QAEvaluation {
  depthScore: number;
  clarityScore: number;
  technicalAccuracy: number;
  examplesQuality: number;
  overallScore: number;
  feedback: string;
  followUpSuggested?: string;
  shouldFollowUp: boolean;
  followUpType?: string;
}

export interface QAAction {
  action: 'next_question' | 'follow_up' | 'end_interview';
  question?: QAQuestion;
  evaluation?: QAEvaluation;
}

export interface QASummary {
  interviewId: string;
  status: string;
  totalQuestions: number;
  totalResponses: number;
  durationSeconds: number;
  overallScore: number;
  recommendation: string;
  keyStrengths: string[];
  areasToInvestigate: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// useInterview hook
// ─────────────────────────────────────────────────────────────────────────────

export function useInterview(interviewId: string) {
  const {
    status,
    setStatus,
    currentQuestion,
    setCurrentQuestion,
    questions,
    setQuestions,
    currentQuestionIndex,
    nextQuestion: storeNextQuestion,
    transcript,
    addTranscriptSegment,
    setStartTime,
    elapsedSeconds,
    updateElapsedTime,
    targetDuration,
    warnings,
    addWarning,
  } = useInterviewStore();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<QAEvaluation | null>(null);
  const [summary, setSummary] = useState<QASummary | null>(null);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketConnected = useRef(false);
  const elapsedRef = useRef(elapsedSeconds);
  elapsedRef.current = elapsedSeconds;

  // ─────────────────────────────────────────────────────────────────────────
  // Timer management
  // ─────────────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      updateElapsedTime(elapsedRef.current + 1);
    }, 1000);
  }, [updateElapsedTime]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const remainingSeconds = Math.max(0, targetDuration * 60 - elapsedSeconds);

  // ─────────────────────────────────────────────────────────────────────────
  // WebSocket event handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleQuestionNew = useCallback((data: unknown) => {
    const q = data as {
      question_id: string;
      content: string;
      type?: string;
      category?: string;
      difficulty?: number;
      expected_duration?: number;
      follow_up_prompts?: string[];
      evaluation_criteria?: string[];
    };
    const question: QAQuestion = {
      id: q.question_id,
      content: q.content,
      type: (q.type || 'technical') as QAQuestion['type'],
      category: q.category || 'general',
      difficulty: q.difficulty || 5,
      expectedDuration: q.expected_duration || 180,
      followUpPrompts: q.follow_up_prompts || [],
      evaluationCriteria: q.evaluation_criteria || [],
      sequenceOrder: 1,
    };
    setCurrentQuestion(question);
    setStatus('running');

    addTranscriptSegment({
      id: generateId(),
      speaker: 'ai',
      text: q.content,
      startTime: elapsedRef.current,
      endTime: elapsedRef.current + 5,
    });
  }, [setCurrentQuestion, setStatus, addTranscriptSegment]);

  const handleTranscriptSegment = useCallback((data: unknown) => {
    const seg = data as { id?: string; speaker: string; text: string; start_time: number; end_time: number };
    if (seg.speaker === 'candidate') {
      addTranscriptSegment({
        id: seg.id || generateId(),
        speaker: 'candidate',
        text: seg.text,
        startTime: seg.start_time,
        endTime: seg.end_time,
      });
    }
  }, [addTranscriptSegment]);

  const handleWarningTabSwitch = useCallback(() => {
    addWarning({
      id: generateId(),
      type: 'tab_switch',
      message: 'Tab switch detected — this has been logged',
      timestamp: Date.now(),
    });
  }, [addWarning]);

  const handleInterviewEnded = useCallback((data: unknown) => {
    stopTimer();
    setStatus('completed');
    const d = data as { summary?: Partial<QASummary> };
    if (d.summary) {
      setSummary({
        interviewId,
        status: 'completed',
        totalQuestions: d.summary.totalQuestions || questions.length,
        totalResponses: d.summary.totalResponses || currentQuestionIndex,
        durationSeconds: elapsedRef.current,
        overallScore: d.summary.overallScore || 0,
        recommendation: d.summary.recommendation || 'HOLD',
        keyStrengths: d.summary.keyStrengths || [],
        areasToInvestigate: d.summary.areasToInvestigate || [],
      });
    }
  }, [interviewId, questions.length, currentQuestionIndex, stopTimer, setStatus]);

  // ─────────────────────────────────────────────────────────────────────────
  // Connect / Disconnect WebSocket
  // ─────────────────────────────────────────────────────────────────────────

  const connectWebSocket = useCallback(async (token?: string) => {
    if (socketConnected.current) return;

    try {
      await interviewSocket.connect(interviewId, token || 'demo-token');
      socketConnected.current = true;

      interviewSocket.on('question:new', handleQuestionNew);
      interviewSocket.on('transcript:segment', handleTranscriptSegment);
      interviewSocket.on('warning:tab_switch', handleWarningTabSwitch);
      interviewSocket.on('interview:ended', handleInterviewEnded);
    } catch (err) {
      console.warn('WebSocket connection failed, using REST only:', err);
    }
  }, [interviewId, handleQuestionNew, handleTranscriptSegment, handleWarningTabSwitch, handleInterviewEnded]);

  const disconnectWebSocket = useCallback(() => {
    interviewSocket.off('question:new', handleQuestionNew as (data: unknown) => void);
    interviewSocket.off('transcript:segment', handleTranscriptSegment as (data: unknown) => void);
    interviewSocket.off('warning:tab_switch', handleWarningTabSwitch);
    interviewSocket.off('interview:ended', handleInterviewEnded as (data: unknown) => void);
    interviewSocket.disconnect();
    socketConnected.current = false;
    stopTimer();
  }, [handleQuestionNew, handleTranscriptSegment, handleWarningTabSwitch, handleInterviewEnded, stopTimer]);

  // ─────────────────────────────────────────────────────────────────────────
  // API Actions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start the Q&A loop — generate questions and present the first one.
   */
  const startInterview = useCallback(async (config?: {
    jobDescription?: string;
    resumeSkills?: string[];
    seniorityLevel?: string;
    questionTypes?: string[];
    durationTarget?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      await connectWebSocket();

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const firstQuestion = await fetch(`${apiBase}/qa-loop/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          candidate_id: 'demo-candidate',
          job_description: config?.jobDescription || '',
          resume_skills: config?.resumeSkills || [],
          seniority_level: config?.seniorityLevel || 'mid',
          question_types: config?.questionTypes || ['technical', 'behavioral'],
          duration_target: config?.durationTarget || targetDuration,
        }),
      }).then(r => r.json());

      const q: QAQuestion = {
        id: firstQuestion.id,
        content: firstQuestion.content,
        type: firstQuestion.type || 'technical',
        category: firstQuestion.category || 'general',
        difficulty: firstQuestion.difficulty || 5,
        expectedDuration: firstQuestion.expected_duration || 180,
        followUpPrompts: firstQuestion.follow_up_prompts || [],
        evaluationCriteria: firstQuestion.evaluation_criteria || [],
        sequenceOrder: 1,
      };

      setCurrentQuestion(q);
      setStatus('running');
      setStartTime(Date.now());
      startTimer();

      addTranscriptSegment({
        id: generateId(),
        speaker: 'ai',
        text: "Hello! I'm your AI interviewer. I'll be asking you questions to learn about your experience. Let's begin!",
        startTime: 0,
        endTime: 5,
      });

      return q;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start interview';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [interviewId, targetDuration, connectWebSocket, setCurrentQuestion, setStatus, setStartTime, startTimer, addTranscriptSegment]);

  /**
   * Submit a candidate response to the current question.
   */
  const submitResponse = useCallback(async (content: string) => {
    if (!currentQuestion) throw new Error('No active question');

    setIsSubmitting(true);
    setError(null);

    const startT = responseStartTime || Date.now();
    const endT = Date.now();
    const durationSec = Math.round((endT - startT) / 1000);
    const elapsed = elapsedRef.current;

    try {
      if (socketConnected.current) {
        interviewSocket.sendResponseStart();
        interviewSocket.sendResponseEnd({ text: content, duration: durationSec });
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const result = await fetch(`${apiBase}/qa-loop/${interviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, start_time: startT / 1000, end_time: endT / 1000 }),
      }).then(r => r.json());

      // Add candidate response to transcript
      addTranscriptSegment({
        id: generateId(),
        speaker: 'candidate',
        text: content,
        startTime: elapsed,
        endTime: elapsed + durationSec,
      });

      // Store evaluation
      if (result.evaluation) {
        const eval_: QAEvaluation = {
          depthScore: result.evaluation.depth_score ?? 0,
          clarityScore: result.evaluation.clarity_score ?? 0,
          technicalAccuracy: result.evaluation.technical_accuracy ?? 0,
          examplesQuality: result.evaluation.examples_quality ?? 0,
          overallScore: result.evaluation.overall_score ?? 0,
          feedback: result.evaluation.feedback ?? '',
          followUpSuggested: result.evaluation.follow_up_suggested,
          shouldFollowUp: result.evaluation.should_follow_up ?? false,
          followUpType: result.evaluation.follow_up_type,
        };
        setLastEvaluation(eval_);
      }

      // Handle action
      if (result.action === 'end_interview' || result.action === 'wrap_up') {
        stopTimer();
        setStatus('wrap_up');

        const sum = await fetch(`${apiBase}/qa-loop/${interviewId}/end`, { method: 'POST' }).then(r => r.json());
        setSummary({
          interviewId: sum.interview_id || interviewId,
          status: 'completed',
          totalQuestions: sum.total_questions || questions.length,
          totalResponses: sum.total_responses || currentQuestionIndex + 1,
          durationSeconds: sum.duration_seconds || elapsed,
          overallScore: sum.overall_score || 0,
          recommendation: sum.recommendation || 'HOLD',
          keyStrengths: sum.key_strengths || [],
          areasToInvestigate: sum.areas_to_investigate || [],
        });
        setStatus('completed');
        disconnectWebSocket();
      } else if (result.question) {
        const nextQ: QAQuestion = {
          id: result.question.id,
          content: result.question.content,
          type: result.question.type,
          category: result.question.category,
          difficulty: result.question.difficulty,
          expectedDuration: result.question.expected_duration,
          followUpPrompts: result.question.follow_up_prompts,
          evaluationCriteria: result.question.evaluation_criteria,
          sequenceOrder: result.question.sequence_order,
        };
        setCurrentQuestion(nextQ);
        setStatus(result.action === 'follow_up' ? 'follow_up' : 'running');
        storeNextQuestion();

        addTranscriptSegment({
          id: generateId(),
          speaker: 'ai',
          text: nextQ.content,
          startTime: elapsed,
          endTime: elapsed + 5,
        });
      }

      setResponseStartTime(null);
      return result as QAAction;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit response';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [interviewId, currentQuestion, responseStartTime, questions.length, currentQuestionIndex, addTranscriptSegment, storeNextQuestion, setCurrentQuestion, setStatus, stopTimer, disconnectWebSocket]);

  /**
   * Mark when the candidate starts formulating a response.
   */
  const beginResponse = useCallback(() => {
    setResponseStartTime(Date.now());
  }, []);

  /** Pause the interview. */
  const pauseInterview = useCallback(async () => {
    setStatus('paused');
    stopTimer();
    if (socketConnected.current) interviewSocket.requestPause('Candidate requested pause');
  }, [setStatus, stopTimer]);

  /** Resume the interview. */
  const resumeInterview = useCallback(async () => {
    setStatus('running');
    startTimer();
    if (socketConnected.current) interviewSocket.requestResume();
  }, [setStatus, startTimer]);

  /** End the interview early. */
  const endInterview = useCallback(async () => {
    stopTimer();
    setStatus('completed');
    disconnectWebSocket();

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const sum = await fetch(`${apiBase}/qa-loop/${interviewId}/end`, { method: 'POST' }).then(r => r.json());
      setSummary({
        interviewId: sum.interview_id || interviewId,
        status: 'completed',
        totalQuestions: sum.total_questions || questions.length,
        totalResponses: sum.total_responses || currentQuestionIndex + 1,
        durationSeconds: sum.duration_seconds || elapsedRef.current,
        overallScore: sum.overall_score || 0,
        recommendation: sum.recommendation || 'HOLD',
        keyStrengths: sum.key_strengths || [],
        areasToInvestigate: sum.areas_to_investigate || [],
      });
    } catch { /* best effort */ }
  }, [interviewId, questions.length, currentQuestionIndex, stopTimer, disconnectWebSocket, setStatus]);

  /** Record a warning (e.g. tab switch). */
  const recordWarning = useCallback(async (type: string, message: string) => {
    addWarning({ id: generateId(), type: type as 'tab_switch', message, timestamp: Date.now() });
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      await fetch(`${apiBase}/qa-loop/${interviewId}/warning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warning_type: type, message }),
      });
    } catch { /* best effort */ }
  }, [interviewId, addWarning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      disconnectWebSocket();
    };
  }, [stopTimer, disconnectWebSocket]);

  // Computed progress
  const progress = questions.length > 0
    ? Math.round(((currentQuestionIndex + (currentQuestion ? 1 : 0)) / questions.length) * 100)
    : 0;

  return {
    // State
    status,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions: questions.length,
    elapsedSeconds,
    remainingSeconds,
    progress,
    lastEvaluation,
    summary,
    warnings,
    transcript,

    // Loading states
    isLoading,
    isSubmitting,
    error,

    // Actions
    startInterview,
    submitResponse,
    beginResponse,
    pauseInterview,
    resumeInterview,
    endInterview,
    recordWarning,

    // WebSocket
    isConnected: socketConnected.current,
  };
}
