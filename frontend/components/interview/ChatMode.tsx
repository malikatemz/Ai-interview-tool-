'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Bot, User, Clock } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';

interface Message {
  id: string;
  role: 'ai' | 'candidate';
  content: string;
  timestamp: number;
  isTyping?: boolean;
}

interface ChatModeProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  showTimestamps?: boolean;
  className?: string;
}

export function ChatMode({
  messages,
  onSendMessage,
  disabled = false,
  showTimestamps = true,
  className,
}: ChatModeProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'ai' ? 'justify-start' : 'justify-end'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  message.role === 'ai'
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
                )}
              >
                {message.role === 'ai' ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              {/* Message content */}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.role === 'ai'
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)]'
                    : 'bg-[var(--accent-primary)] text-white',
                  message.isTyping && 'animate-pulse'
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                {showTimestamps && (
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1 text-xs',
                      message.role === 'ai'
                        ? 'text-[var(--text-secondary)]'
                        : 'text-white/70'
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Interview in progress...' : 'Type your response...'}
            disabled={disabled}
            rows={2}
            className={cn(
              'flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2',
              'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              'bg-[var(--accent-primary)] text-white transition-colors',
              'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Transcript display component
interface TranscriptDisplayProps {
  segments: Array<{
    id: string;
    speaker: 'ai' | 'candidate';
    text: string;
    startTime: number;
    endTime: number;
  }>;
  activeSegmentId?: string;
  onSegmentClick?: (segmentId: string) => void;
  className?: string;
}

export function TranscriptDisplay({
  segments,
  activeSegmentId,
  onSegmentClick,
  className,
}: TranscriptDisplayProps) {
  return (
    <div className={cn('rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4', className)}>
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        Live Transcript
      </h3>
      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.id}
            onClick={() => onSegmentClick?.(segment.id)}
            className={cn(
              'cursor-pointer rounded-lg border-l-4 p-3 transition-colors',
              segment.speaker === 'ai'
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                : 'border-[var(--accent-success)] bg-[var(--accent-success)]/5',
              activeSegmentId === segment.id && 'ring-2 ring-[var(--accent-primary)]'
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className={cn(
                'text-xs font-medium',
                segment.speaker === 'ai' ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-success)]'
              )}>
                {segment.speaker === 'ai' ? 'AI Interviewer' : 'Candidate'}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {formatTimestamp(segment.startTime)} - {formatTimestamp(segment.endTime)}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]">{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
