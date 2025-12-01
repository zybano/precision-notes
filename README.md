# Precision Notes

Precision Notes App is a modern web application for medical documentation and transcription management, designed to streamline the creation, organization, and sharing of medical documents for healthcare professionals.

## Overview

Precision Notes transforms the way healthcare professionals handle documentation by combining the power of AI-powered transcription with intelligent document generation. It enables physicians and medical practitioners to create comprehensive medical documentation faster and with greater accuracy.

## Key Features

### 🎤 Audio Transcription
- Real-time audio recording with noise cancellation
- Automatic speaker diarization (doctor vs. patient)
- Multiple transcription service providers support
- Upload pre-recorded audio files

### 📝 AI-Powered Document Generation
- Converts transcriptions into properly formatted medical documents
- Multiple document formats supported:
  - SOAP Notes
  - History & Physical Reports
  - Progress Notes
  - Discharge Summaries
  - Consultation Notes
  - Specialty-specific formats (Cardiology, Psychiatry, etc.)
- Choose from multiple AI providers (Claude, GPT-4, Gemini)

### 📚 Document Management
- Create, view, edit, and organize medical documents
- Search and filter capabilities
- Share documents with colleagues
- Export to PDF

### 👥 User Management
- Secure authentication
- Role-based access control
- Personal document libraries

## Technical Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Shadcn UI components based on Radix UI
- TailwindCSS for styling
- React Query for data fetching
- React Hook Form for form handling

### Backend
- Supabase for database and authentication
- PostgreSQL with custom SQL functions
- Row-level security for data protection

### AI/ML Integrations
- AssemblyAI for speech-to-text transcription
- OpenAI (GPT-4) for document generation
- Anthropic (Claude) for document generation
- Google (Gemini) for document generation

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/documedly.git
cd documedly

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the development server
npm run dev
```

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Security Considerations

Precision Notes is designed with security in mind, particularly for handling sensitive medical information:

- All data is stored securely in your Supabase project
- Row-level security ensures data is only accessible to authorized users
- Authentication is handled securely via Supabase Auth

**Note:** When deploying to production, ensure your environment meets all requirements for handling PHI (Protected Health Information) according to applicable regulations like HIPAA.

## License

[MIT](LICENSE)
