# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build 
- `npm run build:dev` - Development build
- `npm run lint` - Lint code with ESLint
- `npm run preview` - Preview production build

### Testing
No test scripts are currently configured in this project.

## Project Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript, Vite build system
- **UI Framework**: Shadcn UI components built on Radix UI primitives
- **Styling**: TailwindCSS with custom theme and animations
- **State Management**: React Query for server state, React Context for auth
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Routing**: React Router v6 with protected routes

### Key Dependencies
- **AI/ML**: OpenAI, Anthropic Claude, Google Gemini, AssemblyAI for transcription
- **Audio**: Custom audio recording hooks with Google Cloud Speech-to-Text
- **PDF Generation**: jsPDF with autotable for document exports
- **Payments**: Stripe and Paystack integration
- **Forms**: React Hook Form with Zod validation

### Application Structure

This is a B2B medical documentation platform called "Precision Notes" with multiple user tiers:

1. **Individual Users** - Personal medical documentation
2. **B2B Organizations** - Enterprise medical documentation with credit system
3. **Hospital Management** - Full hospital system modules (emergency, billing, pharmacy, etc.)
4. **Admin Interface** - System administration and organization management

### Core Architecture Patterns

#### Authentication & Authorization
- `src/contexts/AuthContext.tsx` - Main user authentication context
- `src/contexts/AdminAuthContext.tsx` - Separate admin authentication system
- `src/components/auth/ProtectedRoute.tsx` - Route protection for regular users
- `src/components/admin/AdminProtectedRoute.tsx` - Admin route protection with permission system

#### Document Processing Flow
1. **Audio Recording** (`src/hooks/useAudioRecording.ts`) - Custom audio capture
2. **Transcription** (`src/services/transcription.ts`) - Multiple provider support (AssemblyAI, Google)
3. **AI Processing** (`src/services/documents/`) - Convert transcripts to formatted medical documents
4. **Document Management** (`src/components/documentation/`) - CRUD operations, sharing, PDF export

#### Key Service Layers
- **Payment Services** (`src/services/payment/`) - Multi-provider payment handling (Stripe, Paystack)
- **Document Services** (`src/services/documents/`) - Document CRUD and processing
- **Admin Services** (`src/services/adminApiService.ts`) - B2B organization management
- **Supabase Integration** (`src/integrations/supabase/`) - Database client and types

### Component Organization

#### Major Feature Areas
- `src/components/documentation/` - Core medical documentation interface
- `src/components/hospital/` - Hospital management modules (emergency, billing, pharmacy, etc.)
- `src/components/admin/` - Admin interface for managing B2B organizations
- `src/components/landing/` - Marketing and pricing pages
- `src/components/subscription/` - Billing and credit management

#### UI Components
- `src/components/ui/` - Shadcn UI component library
- Custom theme defined in `tailwind.config.ts` with medical/sunshine color palettes
- Uses Inter font family for consistent typography

### Data Models

#### Document Templates
- Defined in `src/data/documentTemplates.ts`
- Supports SOAP notes, H&P, progress notes, consultation notes, specialty formats
- Template-driven document generation with AI provider selection

#### Supabase Schema
- User authentication and profiles
- Credit management system for B2B organizations  
- Document storage and sharing permissions
- Admin user management with role-based permissions

### B2B Features

#### Organization Management
- Multi-tenant architecture with credit-based usage
- Admin panel for managing organization credits and API keys
- Usage tracking and analytics
- Regional pricing support

#### API Integration
- Edge functions in `supabase/functions/` for secure server-side operations
- Webhook handling for payment providers
- Admin middleware for protected B2B operations

### Development Notes

#### File Structure Conventions
- Pages in `src/pages/` follow route structure
- Components organized by feature domain
- Hooks for reusable logic (`src/hooks/`)
- Services for API interactions (`src/services/`)
- Types defined per domain (`src/types/`)

#### Build Configuration
- Vite with React SWC for fast builds
- TypeScript with strict settings
- ESLint with React and TypeScript rules (unused vars disabled)
- Terser minification with console.log removal in production

#### Environment Variables
The application expects these environment variables:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` - Supabase connection
- `VITE_ASSEMBLYAI_API_KEY` - Speech-to-text transcription
- `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_GEMINI_API_KEY` - AI providers

#### Special Considerations
- Medical data handling requires careful attention to security and privacy
- Multi-provider AI system allows fallback options for document generation
- Credit-based billing system requires careful transaction handling
- Audio processing happens client-side with real-time transcription capabilities