'use client';

import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'default',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const variantColors = {
    default: 'bg-[var(--accent-primary)]',
    success: 'bg-[var(--accent-success)]',
    warning: 'bg-[var(--accent-warning)]',
    danger: 'bg-[var(--accent-danger)]',
  };
  
  const sizeClasses = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Progress</span>
          <span className="font-medium text-[var(--text-primary)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <ProgressPrimitive.Root
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-[var(--surface-elevated)]',
          sizeClasses[size]
        )}
        value={value}
        max={max}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variantColors[variant]
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

interface InterviewProgressProps {
  elapsedSeconds: number;
  targetMinutes: number;
  currentQuestion: number;
  totalQuestions: number;
}

export function InterviewProgress({
  elapsedSeconds,
  targetMinutes,
  currentQuestion,
  totalQuestions,
}: InterviewProgressProps) {
  const targetSeconds = targetMinutes * 60;
  const percentage = (elapsedSeconds / targetSeconds) * 100;
  
  const getVariant = () => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'default';
    if (percentage < 100) return 'warning';
    return 'danger';
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 rounded-lg bg-[var(--surface-elevated)] p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">Interview Progress</span>
        <span className="font-medium text-[var(--text-primary)]">
          {formatTime(elapsedSeconds)} / {targetMinutes}:00
        </span>
      </div>
      
      <ProgressBar value={percentage} variant={getVariant()} size="md" />
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">Question</span>
        <span className="font-medium text-[var(--text-primary)]">
          {currentQuestion} of {totalQuestions}
        </span>
      </div>
      
      <ProgressBar
        value={(currentQuestion / totalQuestions) * 100}
        variant="default"
        size="sm"
      />
    </div>
  );
}
