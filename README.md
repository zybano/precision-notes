# Precision Notes Admin

Precision Notes Admin is the platform administration frontend for Precision Notes. It provides operational tooling for org management, plans and billing, reporting, transcription sandboxing, and platform settings.

## Overview

This app is built with React + Vite and talks to the platform backend over the admin API. Authentication and authorization are handled by backend-issued admin session tokens.

## Key Features

### Platform Administration
- Organization lifecycle management
- Platform admin user management
- Permissions-aware route protection

### Plans and Billing
- Plan catalog management
- Contract plan assignment
- Payment transactions and webhook visibility

### Reporting and Operations
- Usage reporting views
- Sandbox tools for transcription provider testing
- Platform configuration management

## Technical Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Shadcn UI components based on Radix UI
- TailwindCSS for styling
- React Query for data fetching
- React Hook Form for form handling

### Backend Integration
- Platform Admin API (configured via environment variables)

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd precision-notes-admin

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start the development server
npm run dev
```

### Environment Variables
- `VITE_PLATFORM_ADMIN_API_BASE_URL`: Base URL for the platform admin backend API (default: `http://localhost:8080`)

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

- Never commit `.env` files or API keys.
- Use HTTPS for all backend API endpoints in non-local environments.
- Keep admin credentials and session tokens protected; rotate credentials regularly.
- Ensure deployment and data handling workflows satisfy your compliance requirements (for example HIPAA where applicable).

## License

[MIT](LICENSE)
