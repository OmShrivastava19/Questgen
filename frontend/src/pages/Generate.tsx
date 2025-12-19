import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { FileUploadResponse, QuestionGenerationRequest, QuestionGenerationResponse, Question } from '../types';

const Generate: React.FC = () => {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'generating' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [processedData, setProcessedData] = useState<FileUploadResponse | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [generationConfig, setGenerationConfig] = useState({
    num_mcq: 2,
    num_true_false: 1,
    num_short_answer: 1,
    num_long_answer: 0,
    num_hots: 1,
    difficulty: 3,
    subject: '',
    grade_level: ''
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setProcessingStatus('idle');
    setProcessedData(null);
    setGeneratedQuestions([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const handleFileUpload = async () => {
    if (uploadedFiles.length === 0) return;

    try {
      setProcessingStatus('uploading');
      setProgress(0);
      setMessage('Uploading files...');

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiService.uploadFiles(uploadedFiles);
      
      clearInterval(progressInterval);
      setProgress(100);
      setMessage('Files uploaded successfully!');
      setProcessedData(response);

      // Check if any files were processed successfully
      const successfulFiles = Object.values(response).filter(file => file.status === 'success');
      if (successfulFiles.length > 0) {
        setProcessingStatus('processing');
        setMessage('Processing text content...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
        setProcessingStatus('completed');
        setMessage('Ready to generate questions!');
      } else {
        setProcessingStatus('error');
        setMessage('No files could be processed. Please check your file format.');
      }

    } catch (error: any) {
      setProcessingStatus('error');
      setMessage(error.message || 'Upload failed');
      console.error('Upload error:', error);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!processedData) return;

    try {
      setProcessingStatus('generating');
      setProgress(0);
      setMessage('Generating questions with AI...');

      // Get all successful text chunks
      const textChunks: string[] = [];
      Object.values(processedData).forEach(file => {
        if (file.status === 'success' && file.chunks) {
          textChunks.push(...file.chunks);
        }
      });

      if (textChunks.length === 0) {
        setProcessingStatus('error');
        setMessage('No text content available for question generation.');
        return;
      }

      // Simulate generation progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const request: QuestionGenerationRequest = {
        context_chunks: textChunks,
        config: generationConfig
      };

      const response: QuestionGenerationResponse = await apiService.generateQuestions(request);
      
      clearInterval(progressInterval);
      setProgress(100);
      setMessage('Questions generated successfully!');
      setGeneratedQuestions(response.questions);
      setProcessingStatus('completed');

    } catch (error: any) {
      setProcessingStatus('error');
      setMessage(error.message || 'Question generation failed');
      console.error('Generation error:', error);
    }
  };

  const handleConfigChange = (field: string, value: number | string) => {
    setGenerationConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetProcess = () => {
    setUploadedFiles([]);
    setProcessingStatus('idle');
    setProgress(0);
    setMessage('');
    setProcessedData(null);
    setGeneratedQuestions([]);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Please sign in to continue</h2>
        <p className="text-gray-600">You need to be authenticated to generate questions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Generate AI-Powered Questions</h1>
        <p className="text-lg text-gray-600">
          Upload your content and let our AI create engaging, educational questions for your students.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Upload Your Content</h2>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
              </p>
              <p className="text-gray-600">or click to browse</p>
            </div>
            <p className="text-sm text-gray-500">
              Supports PDF and DOCX files up to 10MB each
            </p>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Files:</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="text-error-600 hover:text-error-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleFileUpload}
                disabled={processingStatus === 'uploading' || processingStatus === 'processing'}
                className="btn-primary disabled:opacity-50"
              >
                Upload & Process Files
              </button>
              <button
                onClick={resetProcess}
                className="btn-secondary"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing Status */}
      {processingStatus !== 'idle' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{message}</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  processingStatus === 'error' ? 'bg-error-500' : 'bg-primary-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {processingStatus === 'error' && (
              <div className="bg-error-50 border border-error-200 rounded-md p-4">
                <p className="text-sm text-error-800">{message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Generation Configuration */}
      {processedData && processingStatus === 'completed' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Configure Question Generation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="form-label">Multiple Choice Questions</label>
              <input
                type="number"
                min="0"
                max="10"
                value={generationConfig.num_mcq}
                onChange={(e) => handleConfigChange('num_mcq', parseInt(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="form-label">True/False Questions</label>
              <input
                type="number"
                min="0"
                max="10"
                value={generationConfig.num_true_false}
                onChange={(e) => handleConfigChange('num_true_false', parseInt(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="form-label">Short Answer Questions</label>
              <input
                type="number"
                min="0"
                max="10"
                value={generationConfig.num_short_answer}
                onChange={(e) => handleConfigChange('num_short_answer', parseInt(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="form-label">Long Answer Questions</label>
              <input
                type="number"
                min="0"
                max="10"
                value={generationConfig.num_long_answer}
                onChange={(e) => handleConfigChange('num_long_answer', parseInt(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="form-label">HOTS Questions</label>
              <input
                type="number"
                min="0"
                max="10"
                value={generationConfig.num_hots}
                onChange={(e) => handleConfigChange('num_hots', parseInt(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="form-label">Difficulty Level</label>
              <select
                value={generationConfig.difficulty}
                onChange={(e) => handleConfigChange('difficulty', parseInt(e.target.value))}
                className="input-field"
              >
                <option value={1}>Beginner</option>
                <option value={2}>Elementary</option>
                <option value={3}>Intermediate</option>
                <option value={4}>Advanced</option>
                <option value={5}>Expert</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerateQuestions}
              disabled={false}
              className="btn-primary"
            >
              Generate Questions
            </button>
          </div>
        </div>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Questions</h2>
          
          <div className="space-y-4">
            {generatedQuestions.map((question, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="badge badge-primary">{question.type.toUpperCase()}</span>
                    <span className="badge badge-secondary">Difficulty: {question.difficulty}</span>
                    <span className="text-sm text-gray-500">Quality: {(question.quality_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <p className="text-gray-900 mb-3">{question.question}</p>
                
                {question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="text-sm text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex space-x-3">
            <button className="btn-success">
              Save to Question Bank
            </button>
            <button className="btn-warning">
              Create Question Paper
            </button>
            <button className="btn-secondary">
              Export Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generate;
