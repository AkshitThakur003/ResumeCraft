# ResumeCraft Frontend

A modern React application for AI-powered resume analysis and job application tracking.

## Features

- 🤖 **AI-Powered Resume Analysis** - Get intelligent insights and suggestions
- 💼 **Job Application Tracking** - Organize and track your job applications
- 📝 **Smart Notes & Tasks** - Stay organized with intelligent task management
- 📊 **Analytics Dashboard** - Monitor your job search progress
- 🌙 **Dark/Light Theme** - Customizable theme preferences
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Vitest** - Testing framework
- **React Testing Library** - Component testing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Environment Variables

Create a `.env.development` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ResumeCraft
VITE_APP_VERSION=1.0.0
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── auth/           # Authentication components
│   └── layout/         # Layout components
├── contexts/           # React contexts
├── pages/              # Page components
├── utils/              # Utility functions
├── styles/             # CSS files
└── App.jsx             # Main app component
```

## API Integration

The frontend communicates with the backend API using Axios. All API calls are centralized in `src/utils/api.js` with:

- Automatic token management
- Request/response interceptors
- Error handling
- Token refresh logic

## Authentication

- JWT-based authentication
- Automatic token refresh
- Protected routes
- Persistent login state

## Styling

- Tailwind CSS for utility classes
- Custom CSS variables for theming
- Dark/light mode support
- Responsive design patterns

## Testing

- Vitest for unit testing
- React Testing Library for component testing
- JSDoc for code documentation
- Coverage reporting

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Run tests and linting
5. Submit a pull request

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist` directory.

## Deployment

The frontend can be deployed to any static hosting service:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

Make sure to set the correct environment variables for production.
