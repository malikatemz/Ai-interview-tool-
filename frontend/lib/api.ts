const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('access_token') 
      : null;
    
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || `HTTP error ${response.status}`,
        response.status
      );
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterData) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async sendOtp(email: string) {
    return this.request<{ message: string }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, code: string) {
    return this.request<AuthResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  // Candidate endpoints
  async getCandidates(params?: CandidatesFilter) {
    return this.request<PaginatedResponse<Candidate>>('/candidates', { params });
  }

  async getCandidate(id: string) {
    return this.request<Candidate>(`/candidates/${id}`);
  }

  async createCandidate(data: CreateCandidateData) {
    return this.request<Candidate>('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCandidate(id: string, data: UpdateCandidateData) {
    return this.request<Candidate>(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCandidateScore(id: string) {
    return this.request<InterviewScore>(`/candidates/${id}/score`);
  }

  async getCandidateTranscript(id: string) {
    return this.request<Transcript>(`/candidates/${id}/transcript`);
  }

  // Interview endpoints
  async getInterviews(params?: InterviewsFilter) {
    return this.request<PaginatedResponse<Interview>>('/interviews', { params });
  }

  async getInterview(id: string) {
    return this.request<Interview>(`/interviews/${id}`);
  }

  async createInterview(data: CreateInterviewData) {
    return this.request<Interview>('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startInterview(id: string) {
    return this.request<Interview>(`/interviews/${id}/start`, {
      method: 'POST',
    });
  }

  async pauseInterview(id: string) {
    return this.request<Interview>(`/interviews/${id}/pause`, {
      method: 'POST',
    });
  }

  async resumeInterview(id: string) {
    return this.request<Interview>(`/interviews/${id}/resume`, {
      method: 'POST',
    });
  }

  async endInterview(id: string) {
    return this.request<Interview>(`/interviews/${id}/end`, {
      method: 'POST',
    });
  }

  // Question endpoints
  async getQuestionTemplates() {
    return this.request<QuestionTemplate[]>('/questions/templates');
  }

  async generateQuestions(data: GenerateQuestionsData) {
    return this.request<GeneratedQuestion[]>('/questions/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Evaluation endpoints
  async evaluateResponse(data: EvaluateResponseData) {
    return this.request<EvaluationResult>('/evaluate/response', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInterviewSummary(interviewId: string) {
    return this.request<InterviewSummary>(`/evaluate/${interviewId}/summary`);
  }

  async getInterviewDetailed(interviewId: string) {
    return this.request<DetailedEvaluation>(`/evaluate/${interviewId}/detailed`);
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getPipelineData() {
    return this.request<PipelineData>('/dashboard/pipeline');
  }

  async getAnalytics(params?: AnalyticsParams) {
    return this.request<AnalyticsData>('/dashboard/analytics', { params });
  }

  // Report endpoints
  async getReportPdf(interviewId: string) {
    const response = await fetch(
      `${this.baseUrl}/reports/${interviewId}/pdf`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );
    return response.blob();
  }

  async getReportCsv(interviewId: string) {
    const response = await fetch(
      `${this.baseUrl}/reports/${interviewId}/csv`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );
    return response.blob();
  }
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Type definitions
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: 'recruiter' | 'hiring_manager' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'recruiter' | 'hiring_manager' | 'candidate';
  company_id?: string;
}

export interface Candidate {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  resume_url?: string;
  resume_parsed?: {
    skills: string[];
    experience: WorkExperience[];
    education: Education[];
  };
  source?: string;
  status: string;
  created_at: string;
}

export interface CandidatesFilter {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCandidateData {
  email: string;
  full_name: string;
  phone?: string;
  resume_url?: string;
}

export interface UpdateCandidateData extends Partial<CreateCandidateData> {
  status?: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  candidate?: Candidate;
  job_description_id?: string;
  recruiter_id: string;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_target: number;
  duration_actual?: number;
  config?: InterviewConfig;
}

export interface InterviewsFilter {
  status?: string;
  candidate_id?: string;
  recruiter_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateInterviewData {
  candidate_id: string;
  job_description_id?: string;
  scheduled_at?: string;
  duration_target: number;
  config?: InterviewConfig;
}

export interface InterviewConfig {
  question_types: string[];
  difficulty_curve: string;
  follow_up_aggressiveness: number;
  interviewer_persona?: string;
}

export interface QuestionTemplate {
  id: string;
  content: string;
  type: 'technical' | 'behavioral' | 'situational' | 'case_study';
  category: string;
  difficulty: number;
}

export interface GenerateQuestionsData {
  job_description: string;
  resume_skills: string[];
  experience_years: number;
  seniority_level: string;
  question_types: string[];
}

export interface GeneratedQuestion {
  question_id: string;
  content: string;
  type: string;
  category: string;
  difficulty: number;
  expected_duration: number;
  follow_up_prompts: string[];
  evaluation_criteria: string[];
}

export interface EvaluateResponseData {
  interview_id: string;
  question_id: string;
  response_text?: string;
  response_audio_url?: string;
}

export interface EvaluationResult {
  depth_score: number;
  clarity_score: number;
  technical_accuracy: number;
  examples_quality: number;
  overall_score: number;
  feedback: string;
  follow_up_suggested?: string;
}

export interface InterviewScore {
  overall_score: number;
  dimensions: ScoreDimension[];
  recommendation: Recommendation;
}

export interface ScoreDimension {
  name: string;
  score: number;
  evidence: {
    transcript: string;
    timestamp_start: number;
    timestamp_end: number;
  };
  explanation: string;
  confidence: number;
}

export interface Recommendation {
  decision: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'REJECT';
  confidence: number;
  reasoning: string;
  areas_to_investigate: string[];
}

export interface Transcript {
  segments: TranscriptSegment[];
  full_text: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: 'ai' | 'candidate';
  text: string;
  start_time: number;
  end_time: number;
}

export interface InterviewSummary {
  interview_id: string;
  overall_score: number;
  decision: string;
  key_strengths: string[];
  areas_to_investigate: string[];
  duration_actual: number;
  questions_count: number;
}

export interface DetailedEvaluation {
  interview_id: string;
  scores: ScoreDimension[];
  recommendation: Recommendation;
  transcript_with_evaluation: TranscriptWithEvaluation[];
}

export interface TranscriptWithEvaluation {
  segment: TranscriptSegment;
  evaluation?: EvaluationResult;
}

export interface DashboardStats {
  total_candidates: number;
  active_interviews: number;
  completed_today: number;
  average_score: number;
  pipeline_summary: Record<string, number>;
}

export interface PipelineData {
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  candidates: Candidate[];
}

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  metric?: string;
}

export interface AnalyticsData {
  funnel_conversion: FunnelStep[];
  completion_rate: number;
  average_duration: number;
  score_distribution: Record<string, number>;
  time_to_hire: number[];
  interview_quality: number;
}

export interface FunnelStep {
  stage: string;
  count: number;
  percentage: number;
}

export interface WorkExperience {
  company: string;
  title: string;
  duration: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
