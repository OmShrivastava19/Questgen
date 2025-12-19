// Core question types
export interface Question {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'hots';
  question: string;
  options?: string[];
  answer?: string;
  quality_score: number;
  difficulty: number;
  model_used: string;
  context?: string;
  created_at: string;
  updated_at: string;
}

export interface AnswerKey {
  question: string;
  answer: string;
}

export interface QuestionBank {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade_level?: string;
  questions: Question[];
  answer_key: AnswerKey[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  instructions?: string;
  questions: Question[];
  total_marks: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FileUploadResponse {
  [filename: string]: {
    status: 'success' | 'error';
    raw_text?: string;
    cleaned_text?: string;
    chunks?: string[];
    key_concepts?: string[];
    message?: string;
  };
}

export interface QuestionGenerationRequest {
  context_chunks: string[];
  config: {
    num_mcq?: number;
    num_true_false?: number;
    num_short_answer?: number;
    num_long_answer?: number;
    num_hots?: number;
    difficulty?: number;
    subject?: string;
    grade_level?: string;
  };
}

export interface QuestionGenerationResponse {
  questions: Question[];
  answer_key: AnswerKey[];
  saved_bank_id?: string;
}

// User and authentication types
export interface User {
  uid: string;
  email: string;
  display_name?: string;
  photo_url?: string;
  role: 'teacher' | 'admin';
  created_at: string;
  last_login: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// File processing types
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// Constants
export const QUESTION_TYPES = {
  mcq: 'Multiple Choice',
  true_false: 'True/False',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  hots: 'Higher Order Thinking'
} as const;

export const DIFFICULTY_LEVELS = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert'
} as const;
