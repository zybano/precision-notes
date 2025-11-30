# Session Creation & Validation Debug Guide

## What We Fixed

Added comprehensive logging and error handling to:
1. **`createSessionForUser`** - Now logs when sessions are created and throws errors if insertion fails
2. **`requireSession`** - Now logs detailed info about why session validation fails

## How to Test

### Step 1: Clear Old Session
```javascript
// In browser console
localStorage.clear();
window.location.href = '/admin/login';
```

### Step 2: Login and Watch Logs

Open two terminals:

**Terminal 1 - Watch function logs:**
```bash
npx supabase functions logs organization-auth --follow
```

**Terminal 2 - Watch database logs (optional):**
```bash
npx supabase db logs
```

### Step 3: Login

Go to `/admin/login` and login. You should see in the logs:

**✅ Success looks like:**
```
=== Creating Session ===
User ID: <uuid>
Organization ID: <uuid>
Token length: 72
✓ Session created successfully: <session-id>
```

**❌ Failure looks like:**
```
ERROR: Failed to insert session: <error details>
```

### Step 4: Navigate to Protected Page

After login, go to `/admin/dashboard` or any protected route. You should see:

**✅ Success looks like:**
```
=== Session Validation Debug ===
Auth header present: true
Auth header value: Bearer e172649c-0625...
Token extracted, length: 72
Current time: 2025-11-30T...
Session found: {
  user_id: <uuid>,
  role: admin,
  expires_at: 2025-12-01T...
}
Session validation successful!
```

**❌ Common failures:**

1. **No Bearer token:**
```
ERROR: No Bearer token in header
```
→ Check frontend is sending `Authorization: Bearer ${token}`

2. **Session not found:**
```
ERROR: No session found for token
Session does not exist in database
```
→ Session wasn't created properly during login

3. **Session expired:**
```
Session exists but invalid:
- Expires at: 2025-11-29T12:00:00Z
- Is expired: true
```
→ Login again (sessions last 24 hours)

## Common Issues & Solutions

### Issue 1: Session Creation Fails

**Logs show:**
```
ERROR: Failed to insert session: ...
```

**Possible causes:**
- `organization_user_sessions` table doesn't exist
- RLS policies blocking insert
- Invalid foreign key (user_id or organization_id doesn't exist)

**Solution:**
```bash
# Check if table exists
npx supabase db pull

# If table missing, run migration
npx supabase db push
```

### Issue 2: Session Created But Not Found

**Logs show:**
```
✓ Session created successfully: <id>
```
But later:
```
Session does not exist in database
```

**Possible causes:**
- Using different Supabase projects (local vs remote)
- Database connection issue
- Token mismatch

**Solution:**
Check the token in localStorage matches what was created:
```javascript
// In browser console
const { session } = JSON.parse(localStorage.getItem('org_auth_state'));
console.log('Token in localStorage:', session.token);
```

Then check in Supabase Dashboard:
- Table Editor → `organization_user_sessions`
- Search for the token

### Issue 3: Foreign Key Constraint Violation

**Logs show:**
```
ERROR: Failed to insert session: insert or update on table "organization_user_sessions" violates foreign key constraint
```

**Solution:**
The user or organization doesn't exist. Check:
```bash
# In supabase dashboard, run this SQL:
SELECT id, email, organization_id FROM organization_users WHERE email = 'your@email.com';
SELECT id, name FROM organizations WHERE id = '<org-id>';
```

## Verify Everything Works

**Run this test script in browser console:**

```javascript
async function testAuth() {
  console.log('=== AUTH SYSTEM TEST ===\n');

  // 1. Check localStorage
  const stored = localStorage.getItem('org_auth_state');
  if (!stored) {
    console.error('❌ No auth state in localStorage');
    console.log('→ Please login first');
    return;
  }

  const { session, user } = JSON.parse(stored);
  console.log('✓ Auth state found');
  console.log('  User:', user.email);
  console.log('  Role:', user.role);
  console.log('  Token length:', session.token.length);
  console.log('  Expires:', session.expires_at);

  // 2. Check expiration
  const isExpired = new Date(session.expires_at) < new Date();
  if (isExpired) {
    console.error('❌ Session expired');
    console.log('→ Please login again');
    return;
  }
  console.log('✓ Session not expired');

  // 3. Test API
  console.log('\n=== TESTING API ===\n');

  try {
    const response = await fetch(
      'https://rdjzeayewevditzekveb.supabase.co/functions/v1/organization-auth/usage',
      {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✓ API request successful!');
      console.log('  Credits:', data.organizationUsage.credits);
      console.log('  Last login:', data.userUsage.lastLogin);
      console.log('\n✅ EVERYTHING WORKING!');
    } else {
      console.error('❌ API returned error:', response.status);
      console.log('  Error:', data.error);
      console.log('\n→ Check function logs for details');
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message);
    console.log('\n→ Check network tab and function logs');
  }
}

testAuth();
```

## Next Steps

Once everything is working:

1. **Remove debug logs (optional):** The `console.log` statements in production can be removed
2. **Add session validation:** Consider adding automatic session validation on app load
3. **Monitor logs:** Watch for any unusual session creation failures

## Need Help?

If you're still having issues:

1. Run the test script above
2. Copy the function logs from both terminals
3. Check the Network tab in browser DevTools
4. Share all three outputs for debugging
