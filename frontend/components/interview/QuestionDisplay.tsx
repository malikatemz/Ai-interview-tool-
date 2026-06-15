'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Briefcase,
  Clock,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

interface QuestionDisplayProps {
  question: {
    id: string;
    content: string;
    type: 'technical' | 'behavioral' | 'situational' | 'case_study';
    category: string;
    difficulty: number;
    expectedDuration: number;
    followUpPrompts?: string[];
  };
  questionNumber: number;
  totalQuestions: number;
  onNext?: () => void;
  className?: string;
}

const questionTypeConfig = {
  technical: {
    icon: Brain,
    label: 'Technical',
    color: 'text-blue-500 bg-blue-500/10',
  },
  behavioral: {
    icon: MessageSquare,
    label: 'Behavioral',
    color: 'text-purple-500 bg-purple-500/10',
  },
  situational: {
    icon: TrendingUp,
    label: 'Situational',
    color: 'text-amber-500 bg-amber-500/10',
  },
  case_study: {
    icon: Briefcase,
    label: 'Case Study',
    color: 'text-green-500 bg-green-500/10',
  },
};

const difficultyLabels = ['Easy', 'Medium', 'Hard', 'Expert'];

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  className,
}: QuestionDisplayProps) {
  const config = questionTypeConfig[question.type];
  const TypeIcon = config.icon;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-[var(--text-secondary)]">•</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              config.color
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          <Clock className="h-4 w-4" />
          <span>~{Math.ceil(question.expectedDuration / 60)} min</span>
        </div>
      </div>

      {/* Question content */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <h2 className="text-xl font-medium leading-relaxed text-[var(--text-primary)]">
          {question.content}
        </h2>
      </div>

      {/* Difficulty indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text-secondary)]">Difficulty:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                'h-2 w-8 rounded-full transition-colors',
                level <= question.difficulty
                  ? 'bg-[var(--accent-primary)]'
                  : 'bg-[var(--surface-elevated)]'
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {difficultyLabels[question.difficulty - 1] || 'Unknown'}
        </span>
      </div>

      {/* Follow-up hints */}
      {question.followUpPrompts && question.followUpPrompts.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--accent-primary)]/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[var(--accent-primary)]" />
            <span className="text-sm font-medium text-[var(--accent-primary)]">
              Follow-up Topics to Explore
            </span>
          </div>
          <ul className="space-y-1">
            {question.followUpPrompts.map((prompt, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
              >
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next button */}
      {onNext && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2',
              'bg-[var(--accent-primary)] text-white',
              'transition-colors hover:opacity-90'
            )}
          >
            Skip Question
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: {
    content: string;
    type: string;
    category: string;
  };
  responseCount?: number;
  onClick?: () => void;
  className?: string;
}

export function QuestionCard({ question, responseCount, onClick, className }: QuestionCardProps) {
  const typeConfig = questionTypeConfig[question.type as keyof typeof questionTypeConfig] || questionTypeConfig.technical;
  const TypeIcon = typeConfig.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4',
        'transition-all hover:border-[var(--accent-primary)] hover:shadow-md',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            typeConfig.color
          )}
        >
          <TypeIcon className="h-3 w-3" />
          {typeConfig.label}
        </span>
        {responseCount !== undefined && (
          <span className="text-xs text-[var(--text-secondary)]">
            {responseCount} {responseCount === 1 ? 'response' : 'responses'}
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm text-[var(--text-primary)]">
        {question.content}
      </p>
    </div>
  );
}
