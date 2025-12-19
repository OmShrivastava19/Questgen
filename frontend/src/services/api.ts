import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  FileUploadResponse, 
  QuestionGenerationRequest, 
  QuestionGenerationResponse,
  QuestionBank,
  QuestionPaper,
  ApiResponse
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token but do not force redirect to avoid loops; let UI handle
          localStorage.removeItem('authToken');
        }
        return Promise.reject(error);
      }
    );
  }

  // File Upload
  async uploadFiles(files: File[]): Promise<FileUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.api.post<FileUploadResponse>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Question Generation
  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    const response = await this.api.post<QuestionGenerationResponse>('/api/generate', request);
    return response.data;
  }

  // Question Bank Management
  async getQuestionBanks(): Promise<QuestionBank[]> {
    const response = await this.api.get<QuestionBank[]>('/api/questions');
    return response.data;
  }

  async getQuestionBank(bankId: string): Promise<QuestionBank> {
    const response = await this.api.get<QuestionBank>(`/api/questions/${bankId}`);
    return response.data;
  }

  async createQuestionBank(bank: Omit<QuestionBank, 'id' | 'created_at' | 'updated_at'>): Promise<QuestionBank> {
    const response = await this.api.post<QuestionBank>('/api/questions', bank);
    return response.data;
  }

  async updateQuestionBank(bankId: string, bank: Partial<QuestionBank>): Promise<QuestionBank> {
    const response = await this.api.put<QuestionBank>(`/api/questions/${bankId}`, bank);
    return response.data;
  }

  async deleteQuestionBank(bankId: string): Promise<void> {
    await this.api.delete(`/api/questions/${bankId}`);
  }

  // Export Functionality
  async exportPaper(paper: QuestionPaper, format: 'pdf' | 'docx', includeAnswerKey: boolean = false): Promise<Blob> {
    const response = await this.api.post('/api/export', {
      questions: paper.questions,
      format,
      include_answer_key: includeAnswerKey,
      paper_title: paper.title,
      instructions: paper.instructions,
    }, {
      responseType: 'blob',
    });

    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Utility methods
  getApiUrl(): string {
    return API_BASE_URL;
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing purposes
export default ApiService;
