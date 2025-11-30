# Fix: Session Not Found in Database

## Problem
Your session token is stored in localStorage but doesn't exist in the database because:
- The database migrations were repaired/reapplied
- Old sessions were cleared during migration

## Solution

### Option 1: Clear LocalStorage (Recommended - Quick Fix)

**In your browser console:**
```javascript
// Clear the old session
localStorage.removeItem('org_auth_state');

// Reload the page
window.location.reload();

// Then login again
```

### Option 2: Add Auto-Cleanup to Your App

Add this to your `OrgAuthContext.tsx` to automatically detect and clear invalid sessions:

```typescript
// In OrgAuthProvider, after loading from localStorage:
useEffect(() => {
  if (!session?.token) return;

  // Check if session is expired
  const isExpired = new Date(session.expires_at) < new Date();
  if (isExpired) {
    console.log('Session expired, clearing...');
    clearAuth();
  }
}, [session]);
```

### Option 3: Test the Session on App Load

Add session validation when the app loads:

```typescript
// In OrgAuthContext.tsx
useEffect(() => {
  if (!token) return;

  const validateSession = async () => {
    try {
      // Try to fetch user data
      await fetchUsageSummary(token);
    } catch (error) {
      // If unauthorized, clear the session
      if (error.message.includes('Unauthorized')) {
        console.log('Invalid session, clearing...');
        clearAuth();
      }
    }
  };

  validateSession();
}, [token]);
```

## Quick Fix for Right Now

**Run this in your browser console:**

```javascript
// 1. Clear the bad session
localStorage.clear();

// 2. Reload
window.location.href = '/admin/login';
```

Then login again. The new session will be created in the database correctly.

## Why This Happened

1. You ran `supabase migration repair` which marked migrations as applied
2. The `organization_user_sessions` table already existed from migration `20250722120000`
3. But the old session tokens in the table were created before the repair
4. Your localStorage still had the old token, but it's not in the current database

## Permanent Fix

I recommend adding session validation to your app so this doesn't happen again. Would you like me to implement that?
