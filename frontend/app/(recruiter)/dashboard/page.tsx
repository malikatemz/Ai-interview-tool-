'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PipelineBoard } from '@/components/recruiter/PipelineBoard';
import { DashboardStats, FunnelChart, ScoreDistribution, TimeToHireChart } from '@/components/recruiter/Analytics';
import { ScoreCard } from '@/components/recruiter/ScoreCard';
import { CandidateListItem } from '@/components/recruiter/CandidateCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Video, 
  TrendingUp, 
  Calendar,
  Bell,
  Settings,
  Search,
  Plus,
  Filter,
  Download
} from 'lucide-react';

// Sample data
const SAMPLE_STATS = {
  totalCandidates: 127,
  activeInterviews: 8,
  completedToday: 12,
  averageScore: 7.2,
  completionRate: 0.92,
  averageInterviewDuration: 42
};

const SAMPLE_PIPELINE_STAGES = [
  {
    id: 'applied',
    title: 'Applied',
    color: 'bg-blue-500',
    candidates: [
      { id: '1', name: 'Alex Johnson', email: 'alex@example.com', role: 'Software Engineer', score: undefined, status: 'New', appliedDate: 'Dec 18', tags: ['Python', 'React'], interviewCount: 0 },
      { id: '2', name: 'Maria Garcia', email: 'maria@example.com', role: 'Product Manager', score: undefined, status: 'New', appliedDate: 'Dec 18', tags: ['Agile', 'SQL'], interviewCount: 0 },
      { id: '3', name: 'James Wilson', email: 'james@example.com', role: 'Data Scientist', score: undefined, status: 'New', appliedDate: 'Dec 17', tags: ['ML', 'Python'], interviewCount: 0 },
    ]
  },
  {
    id: 'screening',
    title: 'Screening',
    color: 'bg-purple-500',
    candidates: [
      { id: '4', name: 'Sarah Chen', email: 'sarah@example.com', role: 'Senior Engineer', score: 8.2, status: 'Screening', appliedDate: 'Dec 15', tags: ['System Design', 'Go'], interviewCount: 1 },
      { id: '5', name: 'David Kim', email: 'david@example.com', role: 'Frontend Dev', score: 7.5, status: 'Screening', appliedDate: 'Dec 14', tags: ['React', 'TypeScript'], interviewCount: 1 },
    ]
  },
  {
    id: 'interview',
    title: 'Interview',
    color: 'bg-amber-500',
    candidates: [
      { id: '6', name: 'Emily Davis', email: 'emily@example.com', role: 'DevOps Engineer', score: 8.0, status: 'Interview', appliedDate: 'Dec 10', tags: ['Kubernetes', 'AWS'], interviewCount: 2 },
      { id: '7', name: 'Michael Brown', email: 'michael@example.com', role: 'Backend Engineer', score: 7.8, status: 'Interview', appliedDate: 'Dec 8', tags: ['Java', 'Microservices'], interviewCount: 2 },
    ]
  },
  {
    id: 'review',
    title: 'Review',
    color: 'bg-indigo-500',
    candidates: [
      { id: '8', name: 'Lisa Wang', email: 'lisa@example.com', role: 'Tech Lead', score: 8.5, status: 'Review', appliedDate: 'Dec 1', tags: ['Leadership', 'Architecture'], interviewCount: 3 },
    ]
  },
  {
    id: 'hired',
    title: 'Hired',
    color: 'bg-green-500',
    candidates: [
      { id: '9', name: 'Robert Taylor', email: 'robert@example.com', role: 'Software Engineer', score: 8.8, status: 'Hired', appliedDate: 'Nov 15', tags: ['Python', 'ML'], interviewCount: 4 },
    ]
  }
];

const FUNNEL_DATA = [
  { stage: 'Applied', count: 500, percentage: 1.0 },
  { stage: 'Screening', count: 250, percentage: 0.5 },
  { stage: 'Interview', count: 100, percentage: 0.2 },
  { stage: 'Offer', count: 30, percentage: 0.06 },
  { stage: 'Hired', count: 20, percentage: 0.04 },
];

const SCORE_DISTRIBUTION = {
  '9-10': 25,
  '8-9': 45,
  '7-8': 60,
  '6-7': 40,
  '5-6': 20,
  '<5': 10
};

const TIME_TO_HIRE = [18, 21, 15, 24, 19, 22, 16, 20, 25, 18];

export default function DashboardPage() {
  const [selectedView, setSelectedView] = useState<'pipeline' | 'analytics'>('pipeline');
  const [showAddCandidate, setShowAddCandidate] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/80">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
                <Video className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[var(--text-primary)]">AI Interview</span>
            </div>
            
            <nav className="ml-8 flex items-center gap-1">
              <Link 
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium bg-[var(--surface-elevated)] text-[var(--text-primary)]"
              >
                Dashboard
              </Link>
              <Link 
                href="/candidates"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
              >
                Candidates
              </Link>
              <Link 
                href="/analytics"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
              >
                Analytics
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="ml-2 h-8 w-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-medium">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Recruitment Dashboard</h1>
            <p className="text-[var(--text-secondary)]">Manage your hiring pipeline and track interview progress</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search candidates..."
                className="h-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setShowAddCandidate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        </div>

        {/* View toggle */}
        <div className="mb-6 flex items-center gap-2 border-b border-[var(--border)]">
          <button
            onClick={() => setSelectedView('pipeline')}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              selectedView === 'pipeline'
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Pipeline View
          </button>
          <button
            onClick={() => setSelectedView('analytics')}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              selectedView === 'analytics'
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Analytics
          </button>
        </div>

        {/* Pipeline View */}
        {selectedView === 'pipeline' && (
          <div className="space-y-6">
            {/* Stats overview */}
            <DashboardStats stats={SAMPLE_STATS} />
            
            {/* Pipeline board */}
            <PipelineBoard
              stages={SAMPLE_PIPELINE_STAGES}
              onCandidateClick={(candidate) => console.log('Clicked:', candidate)}
              onCandidateMove={(id, from, to) => console.log('Moved:', id, from, '->', to)}
              onAddCandidate={() => setShowAddCandidate(true)}
            />
          </div>
        )}

        {/* Analytics View */}
        {selectedView === 'analytics' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <FunnelChart data={FUNNEL_DATA} />
            <ScoreDistribution data={SCORE_DISTRIBUTION} />
            <TimeToHireChart data={TIME_TO_HIRE} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
                  Recent Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CandidateListItem
                    candidate={{
                      id: '1',
                      name: 'Sarah Chen',
                      email: 'sarah@example.com',
                      role: 'Senior Software Engineer',
                      score: 8.2,
                      status: 'Completed',
                      appliedDate: 'Dec 15'
                    }}
                    onClick={() => console.log('View Sarah Chen')}
                  />
                  <CandidateListItem
                    candidate={{
                      id: '2',
                      name: 'David Kim',
                      email: 'david@example.com',
                      role: 'Frontend Developer',
                      score: 7.5,
                      status: 'Completed',
                      appliedDate: 'Dec 14'
                    }}
                    onClick={() => console.log('View David Kim')}
                  />
                  <CandidateListItem
                    candidate={{
                      id: '3',
                      name: 'Emily Davis',
                      email: 'emily@example.com',
                      role: 'DevOps Engineer',
                      score: 8.0,
                      status: 'In Progress',
                      appliedDate: 'Dec 10'
                    }}
                    onClick={() => console.log('View Emily Davis')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent candidate detail */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Featured Candidate</h2>
          <ScoreCard
            overallScore={8.2}
            recommendation={{
              decision: 'HIRE',
              confidence: 0.85,
              reasoning: 'Strong technical skills with excellent communication. Demonstrated deep understanding of distributed systems and has relevant experience from previous roles at Google and Meta.'
            }}
            dimensions={[
              { name: 'technical', score: 8.5, confidence: 0.9, explanation: 'Strong system design skills' },
              { name: 'communication', score: 8.0, confidence: 0.85, explanation: 'Clear and articulate' },
              { name: 'problem_solving', score: 8.2, confidence: 0.88, explanation: 'Structured approach' },
              { name: 'leadership', score: 7.0, confidence: 0.75, explanation: 'Some leadership experience' },
            ]}
            candidateName="Sarah Chen"
            interviewDuration={2700}
          />
        </div>
      </main>
    </div>
  );
}
