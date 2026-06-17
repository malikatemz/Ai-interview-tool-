'use client';

import React, { use } from 'react';
import { InterviewSession } from '@/components/interview/InterviewSession';

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.id;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--background)]">
      <InterviewSession interviewId={interviewId} />
    </div>
  );
}
