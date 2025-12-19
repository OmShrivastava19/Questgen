import React from 'react';
import { Question } from '../types';

export const QuestionDisplay: React.FC<{ question: Question }> = ({ question }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <span className="badge badge-primary">{question.type.toUpperCase()}</span>
        {typeof question.difficulty === 'number' && (
          <span className="badge badge-secondary">Difficulty: {question.difficulty}</span>
        )}
      </div>
      <p className="text-gray-900 mb-3">{question.question}</p>
      {question.options && (
        <div className="space-y-2">
          {question.options.map((opt, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">{String.fromCharCode(65 + idx)}.</span>
              <span className="text-sm text-gray-700">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
