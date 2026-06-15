import { io, Socket } from 'socket.io-client';

export type InterviewEvent =
  | 'question:new'
  | 'question:follow_up'
  | 'transcript:segment'
  | 'score:update'
  | 'timing:update'
  | 'interview:paused'
  | 'interview:resumed'
  | 'interview:ended'
  | 'warning:tab_switch'
  | 'warning:multiple_faces'
  | 'evaluation:complete';

export interface InterviewMessage {
  event: InterviewEvent;
  data: unknown;
  timestamp: number;
}

export interface TranscriptSegment {
  id: string;
  speaker: 'ai' | 'candidate';
  text: string;
  start_time: number;
  end_time: number;
}

export interface Question {
  question_id: string;
  content: string;
  type: 'technical' | 'behavioral' | 'situational' | 'case_study';
  expected_duration: number;
  follow_up_prompts: string[];
}

export interface Warning {
  type: 'tab_switch' | 'multiple_faces' | 'audio_anomaly';
  message: string;
  timestamp: number;
}

class InterviewSocket {
  private socket: Socket | null = null;
  private interviewId: string | null = null;
  private listeners: Map<InterviewEvent, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(interviewId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.interviewId = interviewId;
      
      const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
      
      this.socket = io(socketUrl, {
        path: '/ws/interview',
        auth: { token },
        query: { interviewId },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to interview'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      // Set up event forwarding
      const events: InterviewEvent[] = [
        'question:new',
        'question:follow_up',
        'transcript:segment',
        'score:update',
        'timing:update',
        'interview:paused',
        'interview:resumed',
        'interview:ended',
        'warning:tab_switch',
        'warning:multiple_faces',
        'evaluation:complete',
      ];

      events.forEach((event) => {
        this.socket?.on(event, (data) => {
          this.notifyListeners(event, data);
        });
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.interviewId = null;
    this.listeners.clear();
  }

  on(event: InterviewEvent, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: InterviewEvent, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private notifyListeners(event: InterviewEvent, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${event}:`, error);
      }
    });
  }

  // Client → Server events
  sendResponseStart(): void {
    this.socket?.emit('response:start', { interviewId: this.interviewId });
  }

  sendResponseSegment(segment: { text: string; timestamp: number }): void {
    this.socket?.emit('response:segment', {
      interviewId: this.interviewId,
      ...segment,
    });
  }

  sendResponseEnd(data: { 
    text?: string; 
    audio_url?: string;
    duration: number;
  }): void {
    this.socket?.emit('response:end', {
      interviewId: this.interviewId,
      ...data,
    });
  }

  requestPause(reason?: string): void {
    this.socket?.emit('pause:request', {
      interviewId: this.interviewId,
      reason,
    });
  }

  requestResume(): void {
    this.socket?.emit('resume:request', {
      interviewId: this.interviewId,
    });
  }

  sendDeviceStatus(status: {
    camera_enabled: boolean;
    microphone_enabled: boolean;
    screen_sharing: boolean;
  }): void {
    this.socket?.emit('device:status', {
      interviewId: this.interviewId,
      ...status,
    });
  }

  sendTabSwitch(): void {
    this.socket?.emit('tab:switch', {
      interviewId: this.interviewId,
      timestamp: Date.now(),
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const interviewSocket = new InterviewSocket();

// Helper hooks will be created separately
