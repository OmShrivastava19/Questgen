import React, { useState, useEffect } from 'react';
import { Question, QuestionBank as QuestionBankType } from '../types';
import { apiService } from '../services/api';
import PaperCreator from '../components/PaperCreator';

const CreatePaper: React.FC = () => {
  const [questionBanks, setQuestionBanks] = useState<QuestionBankType[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handlePaperCreated = (paper: any) => {
    console.log('Paper created:', paper);
    // TODO: Show success message and redirect to papers list
  };

  if (loading && questionBanks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Question Paper</h1>
        <p className="text-gray-600 mt-2">
          Select questions from your question banks to create a professional question paper.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Question Bank Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Question Bank</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Bank
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {questionBanks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.title} ({bank.questions?.length || 0} questions)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Questions
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
              {questions.length} questions
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Marks
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
              {questions.reduce((total, q) => {
                switch (q.type) {
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
              }, 0)} marks
            </div>
          </div>
        </div>
      </div>

      {/* Paper Creator */}
      {questions.length > 0 ? (
        <PaperCreator
          questions={questions}
          onPaperCreated={handlePaperCreated}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
          <p className="text-gray-600 mb-4">
            {selectedBank 
              ? 'The selected question bank is empty. Add some questions first.'
              : 'Please select a question bank to get started.'
            }
          </p>
          {selectedBank && (
            <button
              onClick={() => window.location.href = '/generate'}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Generate Questions
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatePaper;
