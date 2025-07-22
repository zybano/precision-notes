# Admin Authentication Setup Guide

This guide explains how to set up the admin authentication system for your Precision Notes B2B management interface.


### 1. Update Your B2B Functions

Add admin authentication to your existing B2B organization management functions:

```typescript
// In your b2b-organization-management function
import { requireAdminAuth } from './admin-middleware.ts'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Validate admin session
  const authResult = await requireAdminAuth(req, supabaseClient, 'organizations')
  if (!authResult.success) {
    return authResult.response!
  }

  const adminUser = authResult.adminUser!
  
  // Your existing function logic here...
  // Now you have access to adminUser.admin_id, adminUser.role, etc.
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 2. Copy Admin Middleware

Copy the `supabase/edge_function_admin_middleware.ts` file to your Supabase functions directory and import it in your B2B functions.

## 🚀 Frontend Integration

### 1. Admin Routes Added

The following routes are now available:

- `/admin/login` - Admin login page
- `/admin` - Protected admin dashboard (redirects to login if not authenticated)

### 2. Admin Context Provider

The `AdminAuthContext` provides:

```typescript
const { 
  adminUser,        // Current admin user or null
  isLoading,        // Loading state
  signIn,           // Sign in function
  signOut,          // Sign out function
  sessionToken,     // Session token for API calls
  hasPermission     // Check permissions function
} = useAdminAuth();
```

### 3. Protected Components

Use `AdminProtectedRoute` to protect admin components:

```typescript
<AdminProtectedRoute requiredPermission="organizations">
  <YourAdminComponent />
</AdminProtectedRoute>
```

## 🔐 Permission System

### Permission Types

- `organizations` - Create, view, and manage B2B organizations
- `analytics` - View system analytics and reports  
- `settings` - Change system configuration
- `users` - Manage admin users (super_admin only)

### Role Hierarchy

1. **super_admin** - Full access to everything
2. **admin** - Limited access based on permissions

### Customizing Permissions

Update admin permissions in the database:

```sql
UPDATE admin_users 
SET permissions = '{"organizations": true, "analytics": true, "settings": false}'::jsonb
WHERE email = 'admin@example.com';
```

## 🔧 API Authentication

### Making Authenticated API Calls

The `adminApiService` handles authenticated requests:

```typescript
import { adminApiService } from '@/services/adminApiService';

// List organizations
const response = await adminApiService.listOrganizations(sessionToken);

// Create organization
const response = await adminApiService.createOrganization(sessionToken, orgData);

// Manage credits
const response = await adminApiService.manageCredits(sessionToken, orgId, amount, description);
```

### API Headers

All admin API calls include:

```
x-admin-session-token: admin_123_1234567890_abc123
```

## 👥 Managing Admin Users

## 🔒 Security Features

### Session Management

- Sessions expire after 24 hours
- Only one active session per admin user
- Automatic cleanup of expired sessions
- Session tokens are cryptographically secure

### Password Security

- Passwords are hashed using bcrypt
- Minimum complexity requirements (implement client-side validation)
- No plaintext password storage

### Permission Validation

- Server-side permission checking
- Role-based access control
- Fine-grained permissions per feature

### Audit Trail

- Last login tracking
- Session activity monitoring
- IP address and user agent logging

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid session" errors**
   - Check if session token is being sent in headers
   - Verify session hasn't expired (24 hour limit)
   - Ensure admin user is active

2. **"Permission denied" errors**
   - Check admin user permissions in database
   - Verify correct permission string is being checked
   - Super admins should have access to everything

3. **Login failures**
   - Verify email and password are correct
   - Check if admin user account is active
   - Ensure database functions are properly created

