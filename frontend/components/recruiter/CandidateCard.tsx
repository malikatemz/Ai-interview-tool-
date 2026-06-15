'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Star,
  MoreHorizontal,
  ExternalLink,
  MessageSquare,
  Video
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScoreCard, ScoreDimensionData } from './ScoreCard';

interface CandidateProfileProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    location?: string;
    currentRole?: string;
    currentCompany?: string;
    experience?: string;
    education?: Array<{
      institution: string;
      degree: string;
      year: string;
    }>;
    skills: string[];
    resumeUrl?: string;
    appliedDate: string;
    source: string;
  };
  interviewData?: {
    overallScore: number;
    recommendation: {
      decision: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'REJECT';
      confidence: number;
      reasoning: string;
    };
    dimensions: ScoreDimensionData[];
    interviewDate: string;
    duration: number;
    questionsCount: number;
  };
  onScheduleInterview?: () => void;
  onSendEmail?: () => void;
  onViewResume?: () => void;
  className?: string;
}

export function CandidateProfile({
  candidate,
  interviewData,
  onScheduleInterview,
  onSendEmail,
  onViewResume,
  className,
}: CandidateProfileProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-3', className)}>
      {/* Main info column */}
      <div className="space-y-6 lg:col-span-2">
        {/* Profile header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-2xl font-bold text-[var(--accent-primary)]">
                {candidate.avatar ? (
                  <img src={candidate.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  candidate.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{candidate.name}</h1>
                {candidate.currentRole && (
                  <p className="text-[var(--text-secondary)]">
                    {candidate.currentRole}
                    {candidate.currentCompany && ` at ${candidate.currentCompany}`}
                  </p>
                )}
                
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                  {candidate.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {candidate.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {candidate.email}
                  </span>
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {candidate.phone}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={onSendEmail}>
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview results */}
        {interviewData && (
          <ScoreCard
            overallScore={interviewData.overallScore}
            recommendation={interviewData.recommendation}
            dimensions={interviewData.dimensions}
            candidateName={candidate.name}
            interviewDuration={interviewData.duration}
          />
        )}

        {/* Resume */}
        {candidate.resumeUrl && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Resume</p>
                    <p className="text-sm text-[var(--text-secondary)]">PDF Document</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onViewResume}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {onScheduleInterview && (
                <Button className="w-full" onClick={onScheduleInterview}>
                  <Video className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
              )}
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Applied</p>
              <p className="text-sm text-[var(--text-secondary)]">{candidate.appliedDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Source</p>
              <p className="text-sm text-[var(--text-secondary)]">{candidate.source}</p>
            </div>
            {candidate.experience && (
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Experience</p>
                <p className="text-sm text-[var(--text-secondary)]">{candidate.experience}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[var(--accent-primary)]/10 px-3 py-1 text-sm text-[var(--accent-primary)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        {candidate.education && candidate.education.length > 0 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Education</h3>
              {candidate.education.map((edu, index) => (
                <div key={index} className="flex items-start gap-3">
                  <GraduationCap className="mt-1 h-5 w-5 text-[var(--text-secondary)]" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{edu.degree}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{edu.institution}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{edu.year}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface CandidateListItemProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    company?: string;
    score?: number;
    status: string;
    appliedDate: string;
  };
  onClick?: () => void;
  className?: string;
}

export function CandidateListItem({ candidate, onClick, className }: CandidateListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4',
        'transition-all hover:border-[var(--accent-primary)] hover:shadow-md',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]">
        {candidate.avatar ? (
          <img src={candidate.avatar} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          candidate.name.split(' ').map(n => n[0]).join('')
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--text-primary)]">{candidate.name}</p>
          {candidate.score !== undefined && (
            <span className="flex items-center gap-1 text-sm">
              <Star className="h-3 w-3 text-yellow-500" />
              {candidate.score.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {candidate.role}
          {candidate.company && ` at ${candidate.company}`}
        </p>
      </div>
      
      <div className="text-right">
        <span className="rounded-full bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--text-secondary)]">
          {candidate.status}
        </span>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Applied {candidate.appliedDate}
        </p>
      </div>
    </div>
  );
}
