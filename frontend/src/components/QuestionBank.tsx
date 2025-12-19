import React, { useState, useEffect } from 'react';
import { Question, QuestionBank as QuestionBankType } from '../types';
import { apiService } from '../services/api';

interface QuestionBankProps {
  onQuestionSelect?: (question: Question) => void;
  onEditQuestion?: (question: Question) => void;
  onDeleteQuestion?: (questionId: string) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({
  onQuestionSelect,
  onEditQuestion,
  onDeleteQuestion
}) => {
  const [questionBanks, setQuestionBanks] = useState<QuestionBankType[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    loadQuestionBanks();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      loadQuestions(selectedBank);
    }
  }, [selectedBank]);

  const loadQuestionBanks = async () => {
    try {
      setLoading(true);
      const banks = await apiService.getQuestionBanks();
      setQuestionBanks(banks);
      if (banks.length > 0) {
        setSelectedBank(banks[0].id);
      }
    } catch (err) {
      setError('Failed to load question banks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (bankId: string) => {
    try {
      setLoading(true);
      const bank = await apiService.getQuestionBank(bankId);
      setQuestions(bank.questions || []);
    } catch (err) {
      setError('Failed to load questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const text = (question.question || '').toLowerCase();
    const topicText = ((question as any).topic ? String((question as any).topic) : '').toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase()) || topicText.includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || question.type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || Number(question.difficulty) === Number(filterDifficulty);
    return matchesSearch && matchesType && matchesDifficulty;
  });

  if (loading && questionBanks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Question Bank</h2>
        <div className="flex space-x-2">
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {questionBanks.map(bank => (
              <option key={bank.id} value={bank.id}>
                {bank.title} ({bank.questions?.length || 0} questions)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
          <option value="long_answer">Long Answer</option>
          <option value="hots">HOTS</option>
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Difficulties</option>
          <option value="1">Beginner</option>
          <option value="2">Easy</option>
          <option value="3">Medium</option>
          <option value="4">Hard</option>
          <option value="5">Expert</option>
        </select>
        <div className="text-sm text-gray-600">
          {filteredQuestions.length} of {questions.length} questions
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {questions.length === 0 ? 'No questions in this bank yet.' : 'No questions match your filters.'}
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onQuestionSelect?.(question)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {question.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Level {question.difficulty}
                    </span>
                    {Boolean((question as any).topic) && (
                      <span className="text-xs text-gray-500">
                        {(question as any).topic}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 mb-2">{question.question}</p>
                  {question.type === 'mcq' && question.options && (
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center">
                          <span className="w-4 h-4 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className={option === question.answer ? 'font-medium text-green-600' : ''}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Boolean((question as any).explanation) && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Explanation:</strong> {(question as any).explanation}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditQuestion?.(question);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Question"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteQuestion?.(question.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Question"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
