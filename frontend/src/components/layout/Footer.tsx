import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-sm font-medium text-gray-600">QuestGen</span>
          </div>
          
          <div className="text-sm text-gray-500">
            © 2024 QuestGen. AI-powered question generation for educators.
          </div>
          
          <div className="flex space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:text-primary-600 transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="hover:text-primary-600 transition-colors duration-200">
              Terms
            </a>
            <a href="#" className="hover:text-primary-600 transition-colors duration-200">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
