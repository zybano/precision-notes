# Test Authorization Issue

## Steps to Debug

### 1. Deploy the Updated Function
```bash
npx supabase functions deploy organization-auth
```

### 2. Check Browser Console
Open your browser developer tools and run this in the console:

```javascript
// Get the stored session
const stored = localStorage.getItem('org_auth_state');
console.log('Stored auth:', JSON.parse(stored));

// Copy the token
const { session } = JSON.parse(stored);
console.log('Token:', session.token);
console.log('Token length:', session.token.length);
console.log('Expires at:', session.expires_at);
console.log('Is expired?', new Date(session.expires_at) < new Date());
```

### 3. Test the API Directly
```javascript
// Replace with your actual token from step 2
const token = 'YOUR_TOKEN_HERE';

// Test /usage endpoint
fetch('https://rdjzeayewevditzekveb.supabase.co/functions/v1/organization-auth/usage', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### 4. View Logs
In a separate terminal:
```bash
npx supabase functions logs organization-auth --follow
```

Then make a request from your app and watch the logs.

## Common Issues & Solutions

### Issue 1: Session Expired
**Symptom:** Logs show "Is expired: true"
**Solution:**
```javascript
// Logout and login again
const { logout } = useOrgAuth();
logout();
// Then login again
```

### Issue 2: Wrong Header Format
**Symptom:** Logs show "ERROR: No Bearer token in header"
**Solution:** Check that you're sending `Authorization: Bearer <token>`, not just `Authorization: <token>`

### Issue 3: Token Not in Database
**Symptom:** Logs show "Session does not exist in database"
**Possible Causes:**
- Database was reset/migrations changed
- Session was manually deleted
- Using wrong Supabase project

**Solution:** Login again to create a new session

### Issue 4: User Not Found
**Symptom:** Logs show "ERROR: User not found for user_id"
**Solution:** Check that the organization_users table has the user record

## Quick Fix Script

Run this in your browser console to get detailed info:

```javascript
(async function debugAuth() {
  const stored = localStorage.getItem('org_auth_state');
  if (!stored) {
    console.error('❌ No auth state in localStorage');
    return;
  }

  const { session, user } = JSON.parse(stored);

  console.log('=== AUTH DEBUG ===');
  console.log('✓ Session exists');
  console.log('User:', user.email);
  console.log('Role:', user.role);
  console.log('Token length:', session.token.length);
  console.log('Expires:', session.expires_at);
  console.log('Expired?', new Date(session.expires_at) < new Date());

  // Test the API
  console.log('\nTesting API...');
  try {
    const response = await fetch('https://rdjzeayewevditzekveb.supabase.co/functions/v1/organization-auth/usage', {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✓ API works!', data);
    } else {
      console.error('❌ API error:', response.status, data);
    }
  } catch (err) {
    console.error('❌ Request failed:', err);
  }
})();
```

## If All Else Fails

1. Clear localStorage and login again:
```javascript
localStorage.removeItem('org_auth_state');
window.location.reload();
```

2. Check Supabase dashboard:
   - Go to Table Editor
   - Check `organization_user_sessions` table
   - Verify your session exists and isn't expired/revoked

3. Check the database function logs in Supabase:
   - Dashboard > Logs > Functions
   - Look for organization-auth logs
