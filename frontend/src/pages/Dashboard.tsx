import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QuestionBank } from '../types';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalBanks: 0,
    totalPapers: 0,
    recentActivity: 0
  });
  const [recentBanks, setRecentBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const banks = await apiService.getQuestionBanks();
        
        const totalQuestions = banks.reduce((acc, bank) => acc + bank.questions.length, 0);
        
        setStats({
          totalQuestions,
          totalBanks: banks.length,
          totalPapers: Math.floor(totalQuestions / 10), // Estimate papers
          recentActivity: banks.filter(bank => {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            return new Date(bank.updated_at) > lastWeek;
          }).length
        });
        
        setRecentBanks(banks.slice(0, 3)); // Get 3 most recent
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.display_name || 'Teacher'}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Ready to create amazing questions with AI? Let's get started!
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/generate"
          className="card hover:shadow-medium transition-shadow duration-200 group"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors duration-200">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Questions</h3>
            <p className="text-sm text-gray-600">Upload content and generate AI-powered questions</p>
          </div>
        </Link>

        <Link
          to="/banks"
          className="card hover:shadow-medium transition-shadow duration-200 group"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success-200 transition-colors duration-200">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Banks</h3>
            <p className="text-sm text-gray-600">Manage and organize your question collections</p>
          </div>
        </Link>

        <Link
          to="/create-paper"
          className="card hover:shadow-medium transition-shadow duration-200 group"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning-200 transition-colors duration-200">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Paper</h3>
            <p className="text-sm text-gray-600">Build question papers from your question banks</p>
          </div>
        </Link>

        <div className="card hover:shadow-medium transition-shadow duration-200 group">
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary-200 transition-colors duration-200">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">View insights and performance metrics</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl">❓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Question Banks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBanks}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Papers Created</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPapers}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Question Banks */}
      {recentBanks.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Question Banks</h2>
            <Link to="/banks" className="text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentBanks.map((bank) => (
              <div key={bank.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{bank.title}</h3>
                  <p className="text-sm text-gray-600">
                    {bank.questions.length} questions • {bank.subject || 'General'}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(bank.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started Guide */}
      {stats.totalBanks === 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started with QuestGen</h2>
            <p className="text-gray-600 mb-6">
              Welcome to QuestGen! Here's how to get started creating AI-powered questions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                <p className="text-sm text-gray-700">Upload your PDF or DOCX files</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                <p className="text-sm text-gray-700">Configure question types and difficulty</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                <p className="text-sm text-gray-700">Generate and export your questions</p>
              </div>
            </div>
            <Link
              to="/generate"
              className="btn-primary mt-6 inline-block"
            >
              Start Creating Questions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
