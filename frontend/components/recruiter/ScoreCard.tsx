'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MessageSquare,
  Brain,
  Lightbulb,
  Users,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatTimestamp } from '@/lib/utils';

export interface ScoreDimensionData {
  name: string;
  score: number;
  maxScore?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  evidence?: {
    transcript: string;
    timestampStart: number;
    timestampEnd: number;
  };
  explanation?: string;
  confidence?: number;
}

interface ScoreCardProps {
  overallScore: number;
  recommendation: {
    decision: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'REJECT';
    confidence: number;
    reasoning: string;
  };
  dimensions: ScoreDimensionData[];
  candidateName: string;
  interviewDuration?: number;
  className?: string;
}

const decisionConfig = {
  STRONG_HIRE: {
    label: 'Strong Hire',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  HIRE: {
    label: 'Hire',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  HOLD: {
    label: 'Hold',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  REJECT: {
    label: 'Reject',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
};

const dimensionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  communication: MessageSquare,
  technical: Brain,
  problem_solving: Lightbulb,
  leadership: Users,
  domain_knowledge: BarChart3,
};

export function ScoreCard({
  overallScore,
  recommendation,
  dimensions,
  candidateName,
  interviewDuration,
  className,
}: ScoreCardProps) {
  const decision = decisionConfig[recommendation.decision];

  return (
    <Card className={cn('', className)}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Interview Evaluation</CardTitle>
        <div
          className={cn(
            'rounded-full px-3 py-1 text-sm font-semibold',
            decision.bgColor,
            decision.color
          )}
        >
          {decision.label}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall score */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <svg className="h-24 w-24 -rotate-90 transform">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-[var(--surface-elevated)]"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overallScore / 10) * 251.2} 251.2`}
                className={cn(
                  overallScore >= 8.5 ? 'text-green-500' :
                  overallScore >= 7.0 ? 'text-blue-500' :
                  overallScore >= 5.5 ? 'text-yellow-500' : 'text-red-500'
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {overallScore.toFixed(1)}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">/ 10</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-[var(--text-primary)]">{candidateName}</h3>
            {interviewDuration && (
              <p className="text-sm text-[var(--text-secondary)]">
                Interview Duration: {Math.floor(interviewDuration / 60)}m {interviewDuration % 60}s
              </p>
            )}
            <p className="text-sm text-[var(--text-secondary)]">
              Confidence: {(recommendation.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Recommendation reasoning */}
        <div className={cn('rounded-lg border p-4', decision.borderColor, decision.bgColor)}>
          <p className="text-sm text-[var(--text-primary)]">{recommendation.reasoning}</p>
        </div>

        {/* Dimension scores */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Score Breakdown</h4>
          <div className="space-y-3">
            {dimensions.map((dimension) => {
              const Icon = dimensionIcons[dimension.name] || BarChart3;
              const scoreColor = 
                dimension.score >= 8.5 ? 'text-green-500' :
                dimension.score >= 7.0 ? 'text-blue-500' :
                dimension.score >= 5.5 ? 'text-yellow-500' : 'text-red-500';

              return (
                <div key={dimension.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
                      <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
                        {dimension.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dimension.trend && (
                        <span className="flex items-center text-xs">
                          {dimension.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {dimension.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                          {dimension.trend === 'neutral' && <Minus className="h-3 w-3 text-gray-500" />}
                          {dimension.trendValue !== undefined && (
                            <span className={dimension.trend === 'up' ? 'text-green-500' : dimension.trend === 'down' ? 'text-red-500' : 'text-gray-500'}>
                              {dimension.trendValue > 0 ? '+' : ''}{dimension.trendValue}
                            </span>
                          )}
                        </span>
                      )}
                      <span className={cn('text-sm font-semibold', scoreColor)}>
                        {dimension.score.toFixed(1)}
                        {dimension.maxScore && <span className="text-[var(--text-secondary)]">/{dimension.maxScore}</span>}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-elevated)]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        dimension.score >= 8.5 ? 'bg-green-500' :
                        dimension.score >= 7.0 ? 'bg-blue-500' :
                        dimension.score >= 5.5 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${(dimension.score / (dimension.maxScore || 10)) * 100}%` }}
                    />
                  </div>
                  
                  {/* Evidence section */}
                  {dimension.evidence && (
                    <div className="mt-2 rounded border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Evidence</span>
                        <span className="text-[var(--text-secondary)]">
                          {formatTimestamp(dimension.evidence.timestampStart)} - {formatTimestamp(dimension.evidence.timestampEnd)}
                        </span>
                      </div>
                      <p className="text-sm italic text-[var(--text-secondary)]">
                        "{dimension.evidence.transcript}"
                      </p>
                      {dimension.explanation && (
                        <p className="mt-2 text-xs text-[var(--text-primary)]">
                          {dimension.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MiniScoreCardProps {
  candidateName: string;
  overallScore: number;
  decision: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'REJECT';
  onClick?: () => void;
  className?: string;
}

export function MiniScoreCard({
  candidateName,
  overallScore,
  decision,
  onClick,
  className,
}: MiniScoreCardProps) {
  const decisionInfo = decisionConfig[decision];

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border bg-[var(--surface)] p-4 transition-all hover:shadow-md',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-[var(--text-primary)]">{candidateName}</span>
        <span className={cn('text-sm font-semibold', decisionInfo.color)}>
          {overallScore.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-elevated)]">
          <div
            className={cn('h-full rounded-full', decisionInfo.color.replace('text-', 'bg-'))}
            style={{ width: `${(overallScore / 10) * 100}%` }}
          />
        </div>
        <span className={cn('ml-2 text-xs font-medium', decisionInfo.color)}>
          {decisionInfo.label}
        </span>
      </div>
    </div>
  );
}
