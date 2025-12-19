import React, { useState, useEffect } from 'react';
import { Question, QuestionPaper } from '../types';
import { apiService } from '../services/api';

interface PaperCreatorProps {
  questions: Question[];
  onPaperCreated?: (paper: QuestionPaper) => void;
}

const PaperCreator: React.FC<PaperCreatorProps> = ({ questions, onPaperCreated }) => {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [paperTitle, setPaperTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [totalMarks, setTotalMarks] = useState(0);
  const [timeLimit, setTimeLimit] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-select all questions initially
    setSelectedQuestions(questions);
  }, [questions]);

  useEffect(() => {
    // Calculate total marks based on selected questions
    const marks = selectedQuestions.reduce((total, question) => {
      switch (question.type) {
        case 'mcq':
        case 'true_false':
          return total + 1;
        case 'short_answer':
          return total + 2;
        case 'long_answer':
          return total + 5;
        case 'hots':
          return total + 3;
        default:
          return total + 1;
      }
    }, 0);
    setTotalMarks(marks);
  }, [selectedQuestions]);

  const handleQuestionToggle = (question: Question) => {
    setSelectedQuestions(prev => 
      prev.find(q => q.id === question.id)
        ? prev.filter(q => q.id !== question.id)
        : [...prev, question]
    );
  };

  const handleQuestionReorder = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...selectedQuestions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    setSelectedQuestions(newQuestions);
  };

  const handleExport = async (format: 'pdf' | 'docx', includeAnswerKey: boolean = false) => {
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    if (!paperTitle.trim()) {
      setError('Please enter a paper title');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const paper: QuestionPaper = {
        id: `paper_${Date.now()}`,
        title: paperTitle,
        instructions,
        questions: selectedQuestions,
        total_marks: totalMarks,
        duration_minutes: timeLimit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const blob = await apiService.exportPaper(paper, format, includeAnswerKey);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paperTitle.replace(/\s+/g, '_')}_${format.toUpperCase()}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onPaperCreated?.(paper);
    } catch (err) {
      setError(`Failed to export paper: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons = {
      mcq: '🔘',
      true_false: '✅',
      short_answer: '✏️',
      long_answer: '📝',
      hots: '🧠'
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  const getQuestionMarks = (type: string) => {
    const marks = {
      mcq: 1,
      true_false: 1,
      short_answer: 2,
      long_answer: 5,
      hots: 3
    };
    return marks[type as keyof typeof marks] || 1;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Question Paper</h2>
        <div className="text-sm text-gray-600">
          {selectedQuestions.length} questions selected • {totalMarks} total marks
        </div>
      </div>

      {/* Paper Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paper Title *
          </label>
          <input
            type="text"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            placeholder="Enter paper title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
            min="15"
            max="180"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter paper instructions..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Question Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Questions</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedQuestions(questions)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedQuestions([])}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedQuestions.find(q => q.id === question.id)
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleQuestionToggle(question)}
            >
              <input
                type="checkbox"
                checked={!!selectedQuestions.find(q => q.id === question.id)}
                onChange={() => handleQuestionToggle(question)}
                className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{getQuestionTypeIcon(question.type)}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {question.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {getQuestionMarks(question.type)} mark{getQuestionMarks(question.type) !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    Level {question.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-900 line-clamp-2">{question.question}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedQuestions.length}</span> questions • 
            <span className="font-medium"> {totalMarks}</span> marks • 
            <span className="font-medium"> {timeLimit}</span> minutes
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('pdf', false)}
              disabled={loading || selectedQuestions.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={() => handleExport('pdf', true)}
              disabled={loading || selectedQuestions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Exporting...' : 'PDF + Answer Key'}
            </button>
            <button
              onClick={() => handleExport('docx', false)}
              disabled={loading || selectedQuestions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Exporting...' : 'Export Word'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperCreator;
