# QuestGen Frontend

AI-powered question generation for educators - React frontend application.

## Features

- 🚀 **AI-Powered Question Generation** - Uses T5 models for intelligent question creation
- 📁 **File Upload** - Support for PDF and DOCX files with drag-and-drop
- 🎯 **Question Types** - MCQ, True/False, Short Answer, Long Answer, and HOTS questions
- 📚 **Question Bank Management** - Organize and manage your question collections
- 📄 **Paper Creation** - Build question papers from your question banks
- 📤 **Export Functionality** - Export as PDF or Word documents
- 🔐 **Authentication** - Firebase-based user authentication
- 📱 **Responsive Design** - Mobile-friendly interface with Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.development` file in the frontend root directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password)
4. Get your project configuration from Project Settings
5. Update the `.env.development` file with your Firebase credentials

### 4. Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Header, Footer, Navigation
│   └── common/         # Shared components
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Generate.tsx    # Question generation
│   ├── Login.tsx       # Authentication
│   └── ...
├── services/           # API and external services
│   └── api.ts         # Backend API integration
├── context/            # React Context providers
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # CSS and styling
    └── index.css       # Main styles with Tailwind
```

## API Integration

The frontend connects to the QuestGen backend API at `http://localhost:5000`:

- **File Upload**: `/api/upload` - Upload and process PDF/DOCX files
- **Question Generation**: `/api/generate` - Generate AI-powered questions
- **Question Management**: `/api/questions` - CRUD operations for question banks
- **Export**: `/api/export` - Export questions as PDF/Word

## Key Components

### Dashboard
- Overview of question banks and statistics
- Quick actions for common tasks
- Getting started guide for new users

### Generate Questions
- File upload with drag-and-drop
- Real-time processing status
- Question type and difficulty configuration
- AI-powered question generation

### Authentication
- User registration and login
- Firebase integration
- Protected routes

## Styling

- **Tailwind CSS** for utility-first styling
- **Custom Components** with consistent design system
- **Responsive Design** for all device sizes
- **Professional UI** suitable for educators

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **React Hooks** for state management

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

For production, create a `.env.production` file with your production API URL and Firebase configuration.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for `http://localhost:3000`
2. **Firebase Errors**: Check your Firebase configuration in environment variables
3. **API Connection**: Verify backend is running at `http://localhost:5000`

### Getting Help

- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure backend services are running and accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
