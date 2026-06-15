'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalCandidates: number;
    activeInterviews: number;
    completedToday: number;
    averageScore: number;
    completionRate: number;
    averageInterviewDuration: number;
  };
  className?: string;
}

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  const statCards = [
    {
      label: 'Total Candidates',
      value: stats.totalCandidates.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Active Interviews',
      value: stats.activeInterviews.toString(),
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Completed Today',
      value: stats.completedToday.toString(),
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Average Score',
      value: stats.averageScore.toFixed(1),
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Completion Rate',
      value: `${(stats.completionRate * 100).toFixed(0)}%`,
      icon: BarChart3,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Avg Duration',
      value: `${Math.floor(stats.averageInterviewDuration / 60)}m`,
      icon: Calendar,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6', className)}>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                </div>
                <div className={cn('rounded-full p-3', stat.bgColor)}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface FunnelChartProps {
  data: Array<{
    stage: string;
    count: number;
    percentage?: number;
  }>;
  className?: string;
}

export function FunnelChart({ data, className }: FunnelChartProps) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
          Recruitment Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const width = (item.count / maxCount) * 100;
            const isLast = index === data.length - 1;
            
            return (
              <div key={item.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--text-primary)]">{item.stage}</span>
                  <span className="text-[var(--text-secondary)]">
                    {item.count} 
                    {item.percentage !== undefined && (
                      <span className="ml-1 text-[var(--text-secondary)]">
                        ({(item.percentage * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-6 w-full rounded-full bg-[var(--surface-elevated)]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isLast ? 'bg-green-500' : 'bg-[var(--accent-primary)]'
                    )}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface ScoreDistributionProps {
  data: Record<string, number>;
  className?: string;
}

export function ScoreDistribution({ data, className }: ScoreDistributionProps) {
  const ranges = [
    { label: '9-10', min: 9, max: 10, color: 'bg-green-500' },
    { label: '8-9', min: 8, max: 9, color: 'bg-green-400' },
    { label: '7-8', min: 7, max: 8, color: 'bg-blue-500' },
    { label: '6-7', min: 6, max: 7, color: 'bg-blue-400' },
    { label: '5-6', min: 5, max: 6, color: 'bg-yellow-500' },
    { label: '<5', min: 0, max: 5, color: 'bg-red-500' },
  ];

  const maxCount = Math.max(...Object.values(data));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-[var(--accent-primary)]" />
          Score Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranges.map((range) => {
            const count = data[range.label] || 0;
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
            
            return (
              <div key={range.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{range.label}</span>
                  <span className="font-medium text-[var(--text-primary)]">{count}</span>
                </div>
                <div className="h-4 w-full rounded-full bg-[var(--surface-elevated)]">
                  <div
                    className={cn('h-full rounded-full transition-all', range.color)}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface TimeToHireChartProps {
  data: number[];
  className?: string;
}

export function TimeToHireChart({ data, className }: TimeToHireChartProps) {
  const average = data.length > 0 
    ? data.reduce((a, b) => a + b, 0) / data.length 
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--accent-primary)]" />
            Time to Hire (days)
          </div>
          <button className="rounded p-1 hover:bg-[var(--surface-elevated)]">
            <Download className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <span className="text-3xl font-bold text-[var(--text-primary)]">
            {average.toFixed(1)}
          </span>
          <span className="text-sm text-[var(--text-secondary)]"> days average</span>
        </div>
        
        <div className="flex items-end justify-between gap-2" style={{ height: '120px' }}>
          {data.map((value, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-[var(--accent-primary)] transition-all hover:opacity-80"
                style={{ height: `${(value / Math.max(...data, 1)) * 100}%` }}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Day {index + 1}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface InterviewQualityProps {
  score: number;
  metrics: {
    followUpDepth: number;
    questionRelevance: number;
    candidateEngagement: number;
    transcriptCompleteness: number;
  };
  className?: string;
}

export function InterviewQuality({ score, metrics, className }: InterviewQualityProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[var(--accent-primary)]" />
          Interview Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <span className="text-4xl font-bold text-[var(--text-primary)]">
            {(score * 100).toFixed(0)}%
          </span>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Overall Quality Score
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-[var(--text-secondary)]">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-elevated)]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    value >= 0.8 ? 'bg-green-500' :
                    value >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
