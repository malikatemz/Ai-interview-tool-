import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type InterviewStatus = 
  | 'setup' 
  | 'running' 
  | 'paused' 
  | 'follow_up' 
  | 'transition' 
  | 'wrap_up' 
  | 'completed';

export interface Question {
  id: string;
  content: string;
  type: 'technical' | 'behavioral' | 'situational' | 'case_study';
  category: string;
  difficulty: number;
  expectedDuration: number;
  followUpPrompts: string[];
}

export interface TranscriptSegment {
  id: string;
  speaker: 'ai' | 'candidate';
  text: string;
  startTime: number;
  endTime: number;
}

export interface ScoreDimension {
  name: string;
  score: number;
  evidence: {
    transcript: string;
    timestampStart: number;
    timestampEnd: number;
  };
  explanation: string;
  confidence: number;
}

export interface Warning {
  id: string;
  type: 'tab_switch' | 'multiple_faces' | 'audio_anomaly';
  message: string;
  timestamp: number;
}

interface InterviewState {
  // Interview status
  status: InterviewStatus;
  interviewId: string | null;
  
  // Questions
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  
  // Transcript
  transcript: TranscriptSegment[];
  
  // Timing
  startTime: number | null;
  elapsedSeconds: number;
  targetDuration: number;
  
  // Device states
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  deviceCheckComplete: boolean;
  
  // Warnings
  warnings: Warning[];
  
  // Scores
  currentScores: Record<string, number>;
  
  // UI state
  isFullscreen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Actions
  setStatus: (status: InterviewStatus) => void;
  setInterviewId: (id: string) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestion: (question: Question | null) => void;
  nextQuestion: () => void;
  addTranscriptSegment: (segment: TranscriptSegment) => void;
  setStartTime: (time: number) => void;
  updateElapsedTime: (seconds: number) => void;
  setTargetDuration: (minutes: number) => void;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  toggleScreenSharing: () => void;
  setDeviceCheckComplete: (complete: boolean) => void;
  addWarning: (warning: Warning) => void;
  clearWarnings: () => void;
  updateScore: (dimension: string, score: number) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  reset: () => void;
}

const initialState = {
  status: 'setup' as InterviewStatus,
  interviewId: null,
  questions: [],
  currentQuestionIndex: 0,
  currentQuestion: null,
  transcript: [],
  startTime: null,
  elapsedSeconds: 0,
  targetDuration: 45,
  cameraEnabled: true,
  microphoneEnabled: true,
  screenSharing: false,
  deviceCheckComplete: false,
  warnings: [],
  currentScores: {},
  isFullscreen: false,
  theme: 'system' as const,
  language: 'en',
};

export const useInterviewStore = create<InterviewState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setStatus: (status) => set({ status }),
      
      setInterviewId: (id) => set({ interviewId: id }),
      
      setQuestions: (questions) => set({ questions }),
      
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      
      nextQuestion: () => {
        const { questions, currentQuestionIndex } = get();
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
          set({
            currentQuestionIndex: nextIndex,
            currentQuestion: questions[nextIndex],
            status: 'running',
          });
        } else {
          set({ status: 'wrap_up' });
        }
      },
      
      addTranscriptSegment: (segment) =>
        set((state) => ({
          transcript: [...state.transcript, segment],
        })),
      
      setStartTime: (time) => set({ startTime: time }),
      
      updateElapsedTime: (seconds) => set({ elapsedSeconds: seconds }),
      
      setTargetDuration: (minutes) => set({ targetDuration: minutes }),
      
      toggleCamera: () =>
        set((state) => ({ cameraEnabled: !state.cameraEnabled })),
      
      toggleMicrophone: () =>
        set((state) => ({ microphoneEnabled: !state.microphoneEnabled })),
      
      toggleScreenSharing: () =>
        set((state) => ({ screenSharing: !state.screenSharing })),
      
      setDeviceCheckComplete: (complete) =>
        set({ deviceCheckComplete: complete }),
      
      addWarning: (warning) =>
        set((state) => ({
          warnings: [...state.warnings, warning],
        })),
      
      clearWarnings: () => set({ warnings: [] }),
      
      updateScore: (dimension, score) =>
        set((state) => ({
          currentScores: { ...state.currentScores, [dimension]: score },
        })),
      
      setFullscreen: (isFullscreen) => set({ isFullscreen }),
      
      setTheme: (theme) => set({ theme }),
      
      setLanguage: (language) => set({ language }),
      
      reset: () => set(initialState),
    }),
    { name: 'interview-store' }
  )
);
