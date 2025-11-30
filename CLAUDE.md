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
- **State Management**: React Query for server state, Context API for auth
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Routing**: React Router v6 with protected routes

### Key Dependencies
- **AI/ML**: OpenAI, Anthropic Claude, Google Gemini, AssemblyAI for transcription
- **Audio**: Custom audio recording hooks with Google Cloud Speech-to-Text
- **PDF Generation**: jsPDF with autotable for document exports
- **Payments**: Stripe and Paystack integration
- **Forms**: React Hook Form with Zod validation

### Application Structure

This is an organizational B2B medical documentation platform called "Precision Notes" with a custom authentication system:

**Current Focus**: The app is primarily configured for organizational/B2B usage with a custom authentication system separate from Supabase Auth. The main entry point routes to organizational documentation pages.

### Core Architecture Patterns

#### Custom Organization Authentication System
The app uses a **custom authentication system** separate from Supabase Auth, managed through Edge Functions:

- `src/contexts/OrgAuthContext.tsx` - Organization authentication context with localStorage persistence
- `src/services/orgAuthApi.ts` - API client for organization auth endpoints
- `src/components/auth/OrgProtectedRoute.tsx` - Route protection for organizational users
- `supabase/functions/organization-auth/index.ts` - Edge Function handling all auth operations

**Authentication Flow**:
1. Admin onboarding creates organization + admin user
2. Password-based login OR OTP-based login (via email)
3. Session token stored in localStorage (key: `org_auth_state`)
4. Token passed as `Authorization: Bearer {token}` header to Edge Functions
5. Role-based routing: admins see StaffManagementPage, staff see StaffDashboardPage

**Key Routes**:
- `/` - Organizational documentation page (public)
- `/admin/onboard` - Admin onboarding flow
- `/admin/login` - Admin/staff login
- `/admin/reset-password` - Password reset flow
- `/admin/dashboard` - Protected dashboard (role-based routing)

#### Document Processing Flow
1. **Audio Recording** (`src/hooks/useAudioRecording.ts`) - Custom audio capture
2. **Transcription** (`src/services/transcription.ts`) - Multiple provider support (AssemblyAI, Google)
3. **AI Processing** (`src/services/documents/`) - Convert transcripts to formatted medical documents
4. **Document Management** (`src/components/documentation/`) - CRUD operations, sharing, PDF export

#### Supabase Edge Functions Architecture
All server-side operations are handled via Edge Functions in `supabase/functions/`:

**Organization Auth** (`organization-auth/`):
- `/admin-onboard` - Create organization + admin user
- `/login` - Password login
- `/request-otp` + `/verify-otp` - OTP-based login
- `/request-password-reset` + `/reset-password` - Password reset flow
- `/staff` - CRUD for staff members (admin only)
- `/staff/bulk-upload` - Bulk staff upload (admin only)
- `/organization` - Get organization details
- `/usage` - Get organization usage summary

**B2B API** (`b2b-*` functions):
- `b2b-transcribe-audio` - Audio transcription for B2B orgs
- `b2b-generate-document` - AI document generation
- `b2b-combined-request` - Combined transcription + generation
- `b2b-organization-management` - Organization CRUD operations

**Payment Webhooks**:
- `stripe-webhook`, `paystack-webhook`, `enhanced-paystack-webhook`, `unified-webhook`
- Checkout functions for various payment flows

**Email**:
- `send-email-html`, `send-email-template` - Email sending via ZeptoMail
- Used by `organization-auth` for OTP and password reset emails

### Key Service Layers
- **Organization Auth** (`src/services/orgAuthApi.ts`) - Custom auth API client with typed responses
- **Payment Services** (`src/services/payment/`) - Multi-provider payment handling
- **Document Services** (`src/services/documents/`) - Document CRUD and processing
- **Transcription** (`src/services/transcription.ts`) - Multi-provider transcription

### React Query Configuration
QueryClient is configured in `src/App.tsx` with:
- `refetchOnWindowFocus: false`
- `retry: 1`
- `staleTime: 5 minutes`

### Build Configuration
- **Vite** with React SWC for fast builds
- **Path alias**: `@/` maps to `src/`
- **Port**: Development server runs on port 8080
- **Terser minification**: Removes `console.log`, `console.debug`, `console.info` in production
- **TypeScript**: Strict mode enabled
- **ESLint**: React + TypeScript rules (unused vars disabled)

### Environment Variables
The application expects these environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key
- `VITE_SUPABASE_EDGE_URL` - (Optional) Custom Edge Function URL, defaults to Supabase project URL
- `VITE_ASSEMBLYAI_API_KEY` - Speech-to-text transcription
- `VITE_OPENAI_API_KEY` - OpenAI for document generation
- `VITE_ANTHROPIC_API_KEY` - Anthropic Claude for document generation
- `VITE_GEMINI_API_KEY` - Google Gemini for document generation

### File Structure Conventions
- **Pages**: `src/pages/` organized by feature (`auth/`, `admin/`, `staff/`)
- **Components**: `src/components/` organized by domain
- **Contexts**: `src/contexts/` for React context providers
- **Hooks**: `src/hooks/` for reusable logic
- **Services**: `src/services/` for API clients and business logic
- **Types**: `src/types/` for TypeScript type definitions
- **UI Components**: `src/components/ui/` for Shadcn UI library

### Important Implementation Details

#### Authentication State Persistence
- Auth state stored in localStorage with key `org_auth_state`
- Contains `{ session: OrgSession, user: OrganizationUser }`
- Loaded on app initialization in `OrgAuthContext`
- Cleared on logout

#### Role-Based Access
- Two roles: `admin` and `staff`
- Admins can manage staff, view organization details, upload bulk staff
- Staff can only access their own dashboard
- Role determined by `user.role` field in session

#### Security Considerations
- Medical data handling requires HIPAA compliance considerations
- Edge Functions validate session tokens for all protected endpoints
- Row-level security in Supabase for data protection
- Password reset tokens expire (tracked in Edge Function responses)
- OTP codes expire (tracked in Edge Function responses)