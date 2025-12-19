import React, { useState, useEffect } from 'react';
import { QuestionBank as QuestionBankType, Question } from '../types';
import { apiService } from '../services/api';
import QuestionBank from '../components/QuestionBank';

const QuestionBanks: React.FC = () => {
  const [questionBanks, setQuestionBanks] = useState<QuestionBankType[]>([]);
  const [selectedBank, setSelectedBank] = useState<QuestionBankType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankDescription, setNewBankDescription] = useState('');

  useEffect(() => {
    loadQuestionBanks();
  }, []);

  const loadQuestionBanks = async () => {
    try {
      setLoading(true);
      const banks = await apiService.getQuestionBanks();
      setQuestionBanks(banks);
    } catch (err) {
      setError('Failed to load question banks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBank = async () => {
    if (!newBankName.trim()) {
      setError('Bank name is required');
      return;
    }

    try {
      setLoading(true);
      const newBank = await apiService.createQuestionBank({
        title: newBankName,
        description: newBankDescription,
        subject: 'General',
        grade_level: 'All Grades',
        questions: [],
        answer_key: [],
        user_id: 'me'
      });
      
      setQuestionBanks([...questionBanks, newBank]);
      setSelectedBank(newBank);
      setShowCreateForm(false);
      setNewBankName('');
      setNewBankDescription('');
      setError('');
    } catch (err) {
      setError('Failed to create question bank');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!window.confirm('Are you sure you want to delete this question bank? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteQuestionBank(bankId);
      setQuestionBanks(questionBanks.filter(bank => bank.id !== bankId));
      if (selectedBank?.id === bankId) {
        setSelectedBank(null);
      }
    } catch (err) {
      setError('Failed to delete question bank');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionEdit = (question: Question) => {
    // TODO: Implement question editing modal
    console.log('Edit question:', question);
  };

  const handleQuestionDelete = (questionId: string) => {
    // TODO: Implement question deletion
    console.log('Delete question:', questionId);
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Question Banks</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Create New Bank
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Create Bank Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Question Bank</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="Enter bank name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={newBankDescription}
                onChange={(e) => setNewBankDescription(e.target.value)}
                placeholder="Enter description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateBank}
              disabled={loading || !newBankName.trim()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Bank'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewBankName('');
                setNewBankDescription('');
                setError('');
              }}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Question Banks List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Banks</h3>
            {questionBanks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No question banks yet</p>
                <p className="text-sm">Create your first bank to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questionBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBank?.id === bank.id
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBank(bank)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{bank.title}</h4>
                        <p className="text-sm text-gray-600">{bank.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{bank.subject}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{bank.grade_level}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {bank.questions?.length || 0} questions
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBank(bank.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Bank"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Bank Details */}
        <div className="lg:col-span-2">
          {selectedBank ? (
            <QuestionBank
              onQuestionSelect={(question) => console.log('Selected question:', question)}
              onEditQuestion={handleQuestionEdit}
              onDeleteQuestion={handleQuestionDelete}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Question Bank</h3>
              <p className="text-gray-600">
                Choose a question bank from the list to view and manage its questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBanks;
