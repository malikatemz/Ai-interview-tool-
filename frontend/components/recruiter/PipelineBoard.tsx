'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Star,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  score?: number;
  status: string;
  appliedDate: string;
  tags: string[];
  interviewCount: number;
}

interface PipelineStage {
  id: string;
  title: string;
  candidates: Candidate[];
  color: string;
}

interface PipelineBoardProps {
  stages: PipelineStage[];
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateMove?: (candidateId: string, fromStage: string, toStage: string) => void;
  onAddCandidate?: () => void;
  className?: string;
}

const stageColors: Record<string, string> = {
  applied: 'bg-blue-500',
  screening: 'bg-purple-500',
  interview: 'bg-amber-500',
  review: 'bg-indigo-500',
  hired: 'bg-green-500',
};

export function PipelineBoard({
  stages,
  onCandidateClick,
  onCandidateMove,
  onAddCandidate,
  className,
}: PipelineBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const handleDragStart = (candidate: Candidate) => {
    setDraggedCandidate(candidate);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedCandidate && onCandidateMove) {
      const currentStage = stages.find(s => s.candidates.some(c => c.id === draggedCandidate.id));
      if (currentStage && currentStage.id !== stageId) {
        onCandidateMove(draggedCandidate.id, currentStage.id, stageId);
      }
    }
    setDraggedCandidate(null);
    setDragOverStage(null);
  };

  const filteredStages = stages.map(stage => ({
    ...stage,
    candidates: stage.candidates.filter(candidate =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.role.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          {onAddCandidate && (
            <Button size="sm" onClick={onAddCandidate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {filteredStages.map((stage) => (
          <div
            key={stage.id}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
            className={cn(
              'kanban-column min-w-[300px] flex-1 transition-colors',
              dragOverStage === stage.id && 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
            )}
          >
            {/* Column header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('h-3 w-3 rounded-full', stageColors[stage.id] || 'bg-gray-500')} />
                <h3 className="font-semibold text-[var(--text-primary)]">{stage.title}</h3>
                <span className="rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {stage.candidates.length}
                </span>
              </div>
              <button className="rounded p-1 hover:bg-[var(--surface-elevated)]">
                <MoreHorizontal className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Candidates */}
            <div className="space-y-3">
              {stage.candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  draggable
                  onDragStart={() => handleDragStart(candidate)}
                  onClick={() => onCandidateClick?.(candidate)}
                  className={cn(
                    'kanban-card group',
                    draggedCandidate?.id === candidate.id && 'opacity-50'
                  )}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                        {candidate.avatar ? (
                          <img src={candidate.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{candidate.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{candidate.role}</p>
                      </div>
                    </div>
                    <GripVertical className="h-4 w-4 cursor-grab text-[var(--text-secondary)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  {/* Score indicator */}
                  {candidate.score !== undefined && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm font-medium">{candidate.score.toFixed(1)}</span>
                      </div>
                      <div className="h-1 flex-1 rounded-full bg-[var(--surface)]">
                        <div
                          className="h-full rounded-full bg-yellow-500"
                          style={{ width: `${(candidate.score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mb-2 flex flex-wrap gap-1">
                    {candidate.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-xs text-[var(--accent-primary)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {candidate.tags.length > 3 && (
                      <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                        +{candidate.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {candidate.appliedDate}
                      </span>
                      {candidate.interviewCount > 0 && (
                        <span>{candidate.interviewCount} interview{candidate.interviewCount > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {stage.candidates.length === 0 && (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">No candidates in this stage</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
