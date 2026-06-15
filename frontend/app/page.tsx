'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Video, 
  MessageSquare, 
  Brain, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[var(--text-primary)]">AI Interview</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-4 py-1.5 text-sm text-[var(--accent-primary)]">
                <Zap className="h-4 w-4" />
                <span>Enterprise-Grade AI Interview Platform</span>
              </div>
              
              <h1 className="text-5xl font-bold leading-tight text-[var(--text-primary)]">
                Conduct Smarter Interviews with{' '}
                <span className="gradient-text">AI-Powered Intelligence</span>
              </h1>
              
              <p className="text-xl text-[var(--text-secondary)]">
                Transform your hiring process with real-time transcription, 
                evidence-based scoring, and intelligent follow-up questions. 
                Built for modern recruiting teams.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  SOC 2 compliant
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-[var(--accent-primary)]/20 blur-3xl" />
              <div className="absolute -bottom-4 -right-4 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
              
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  {/* Mock interview interface */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-primary)]">AI Interviewer</span>
                      <span className="flex items-center gap-1 text-sm text-red-500">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        LIVE
                      </span>
                    </div>
                    
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 p-6">
                      <div className="flex h-full flex-col items-center justify-center space-y-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-primary)]/20">
                          <Brain className="h-10 w-10 text-[var(--accent-primary)]" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-[var(--text-primary)]">Sarah Chen</p>
                          <p className="text-sm text-[var(--text-secondary)]">Senior Software Engineer</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="rounded-lg bg-[var(--surface-elevated)] p-4 text-sm">
                        "Can you walk me through a time when you had to design a system that handled high traffic? What challenges did you face?"
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1">
                        <Video className="mr-1 h-4 w-4" />
                        Video
                      </Button>
                      <Button size="sm" variant="secondary" className="flex-1">
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              Everything You Need for Modern Recruiting
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              A comprehensive platform designed for enterprise hiring teams
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Video}
              title="Video + Audio Capture"
              description="High-quality video and audio recording with adaptive bitrate streaming for any network condition."
            />
            <FeatureCard
              icon={MessageSquare}
              title="Live Transcription"
              description="Real-time speech-to-text with speaker diarization and timestamp tracking."
            />
            <FeatureCard
              icon={Brain}
              title="AI Question Generation"
              description="Dynamic questions based on job requirements, candidate resume, and interview flow."
            />
            <FeatureCard
              icon={BarChart3}
              title="Evidence-Based Scoring"
              description="Transparent scoring with specific transcript excerpts and timestamps."
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="SOC 2 compliant with encrypted recordings, audit logs, and anti-cheat measures."
            />
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Sub-second latency for real-time interactions and instant evaluations."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <Card className="border-[var(--accent-primary)]/30 bg-gradient-to-r from-[var(--accent-primary)]/10 to-purple-500/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                Ready to Transform Your Hiring?
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Join hundreds of companies using AI Interview to find better candidates faster.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link href="/register">
                  <Button size="lg">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Schedule a Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
                <Video className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[var(--text-primary)]">AI Interview</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              © 2024 AI Interview. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
          <Icon className="h-6 w-6 text-[var(--accent-primary)]" />
        </div>
        <h3 className="mb-2 font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </CardContent>
    </Card>
  );
}
