import React, { useState } from 'react';
import { QuestionPaper } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper | null;
  onExport: (format: 'pdf' | 'docx', includeAnswerKey: boolean) => Promise<void>;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, paper, onExport }) => {
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !paper) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      await onExport(format, includeAnswerKey);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeCount = () => {
    const counts: Record<string, number> = {};
    paper.questions.forEach(q => {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  };

  const questionTypeCounts = getQuestionTypeCount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Question Paper</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Paper Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{paper.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Total Questions:</span> {paper.questions.length}</p>
              <p><span className="font-medium">Total Marks:</span> {paper.total_marks}</p>
              <p><span className="font-medium">Time Limit:</span> {paper.duration_minutes} minutes</p>
            </div>
            
            {/* Question Type Breakdown */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Question Breakdown:</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                {Object.entries(questionTypeCounts).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type.replace('_', ' ')}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value as 'pdf' | 'docx')}
                    className="mr-2 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium text-gray-900">PDF</div>
                    <div className="text-xs text-gray-500">Print-ready format</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="format"
                    value="docx"
                    checked={format === 'docx'}
                    onChange={(e) => setFormat(e.target.value as 'pdf' | 'docx')}
                    className="mr-2 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Word</div>
                    <div className="text-xs text-gray-500">Editable format</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Answer Key Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeAnswerKey"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="includeAnswerKey" className="ml-2 text-sm text-gray-700">
                Include Answer Key
              </label>
            </div>

            {includeAnswerKey && (
              <div className="ml-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Answer key will be included as a separate section in the exported document.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Exporting...' : 'Export Paper'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
