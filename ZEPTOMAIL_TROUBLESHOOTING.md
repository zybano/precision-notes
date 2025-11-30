# ZeptoMail Email Troubleshooting Guide

## Changes Made

### 1. Added Fallback Mechanism
Both email functions now have automatic fallback from template to HTML:

**OTP Emails** (`sendOtpEmail`):
- Tries template email first if `ZEPTOMAIL_OTP_TEMPLATE_KEY` is set
- Falls back to HTML email if template fails
- Logs success/failure for debugging

**Password Reset Emails** (`sendPasswordResetEmail`):
- Tries template email first if `ZEPTOMAIL_RESET_TEMPLATE_KEY` is set
- Falls back to HTML email if template fails
- Logs success/failure for debugging

## Common ZeptoMail Issues & Solutions

### Issue 1: Environment Variables Not Set
**Check these environment variables in your Supabase Edge Function settings:**

```bash
ZEPTOMAIL_API_TOKEN         # Your ZeptoMail API token (required)
ZEPTOMAIL_FROM_EMAIL        # Verified sender email (required)
ZEPTOMAIL_FROM_NAME         # Sender name (optional, defaults to "Precision Notes")
ZEPTOMAIL_BASE_URL          # API URL (optional, defaults to https://api.zeptomail.com/v1.1)
ZEPTOMAIL_OTP_TEMPLATE_KEY  # Template key for OTP emails (optional)
ZEPTOMAIL_RESET_TEMPLATE_KEY # Template key for password reset (optional)
```

**How to check:**
```bash
# In Supabase Dashboard:
# Project Settings → Edge Functions → Secrets
```

### Issue 2: Email Domain Not Verified
**Error:** `Sender email not verified` or similar

**Solution:**
1. Go to ZeptoMail dashboard
2. Navigate to **Mail Domains**
3. Add and verify your sending domain
4. Update `ZEPTOMAIL_FROM_EMAIL` to use verified domain

### Issue 3: Invalid Template Key
**Error:** Template not found or invalid template key

**Solution:**
1. Check template exists in ZeptoMail dashboard
2. Verify template key matches exactly (case-sensitive)
3. If unsure, remove template keys to use HTML fallback:
   ```bash
   # Remove these variables to always use HTML emails:
   ZEPTOMAIL_OTP_TEMPLATE_KEY
   ZEPTOMAIL_RESET_TEMPLATE_KEY
   ```

### Issue 4: API Token Invalid
**Error:** `401 Unauthorized` or `Invalid API token`

**Solution:**
1. Generate new API token in ZeptoMail
2. Update `ZEPTOMAIL_API_TOKEN` in Supabase
3. Redeploy Edge Functions

### Issue 5: Rate Limiting
**Error:** `429 Too Many Requests`

**Solution:**
- Check your ZeptoMail plan limits
- Implement retry logic with exponential backoff
- Upgrade ZeptoMail plan if needed

## Testing Email Delivery

### Test OTP Email
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/organization-auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@yourdomain.com"}'
```

### Test Password Reset Email
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/organization-auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@yourdomain.com", "redirectUrl": "https://yourapp.com/reset-password"}'
```

### Check Edge Function Logs
```bash
# In Supabase Dashboard:
# Edge Functions → Select function → Logs tab

# Look for:
# - "OTP email sent successfully via template"
# - "OTP email sent successfully via HTML"
# - "Template email failed, falling back to HTML email"
# - "ZeptoMail request failed" (with error details)
```

## Debugging Checklist

- [ ] All required environment variables are set
- [ ] `ZEPTOMAIL_FROM_EMAIL` is verified in ZeptoMail dashboard
- [ ] API token is valid and not expired
- [ ] Template keys are correct (or removed to use fallback)
- [ ] Checked Edge Function logs for error messages
- [ ] Test emails are being sent to valid, accessible email addresses
- [ ] ZeptoMail account is active and within rate limits
- [ ] Firewall/DNS allows outbound connections to api.zeptomail.com

## Email Flow with Fallback

```
┌─────────────────────────┐
│ Email Request           │
└────────────┬────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Template Key Set?  │
    └────────┬───────────┘
             │
        ┌────┴────┐
        │   Yes   │
        └────┬────┘
             │
             ▼
    ┌──────────────────────┐
    │ Try Template Email   │
    └────────┬─────────────┘
             │
        ┌────┴────┐
    Success?│  Failed
        │        │
        ▼        ▼
    ┌─────┐  ┌──────────────────────┐
    │Done │  │ Log Error & Fallback │
    └─────┘  └────────┬─────────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Send HTML Email  │
             └────────┬─────────┘
                      │
                      ▼
                  ┌───────┐
                  │ Done  │
                  └───────┘
```

## Zoho Mail Configuration

If you're using Zoho Mail with ZeptoMail:

1. **Verify Domain in ZeptoMail:**
   - Add your domain in ZeptoMail (not Zoho Mail)
   - Complete DNS verification (TXT, DKIM, SPF records)

2. **Sender Email:**
   - Must be from verified domain
   - Can be different from your Zoho Mail account
   - Example: `noreply@yourdomain.com`

3. **Common Mistake:**
   - Don't confuse Zoho Mail with ZeptoMail
   - They are separate products
   - ZeptoMail is for transactional emails
   - Zoho Mail is for regular business email

## Next Steps

1. **Check your logs** for specific error messages
2. **Verify domain** in ZeptoMail dashboard
3. **Test with HTML fallback** by removing template keys
4. **Monitor delivery** in ZeptoMail analytics

## Support Resources

- [ZeptoMail Documentation](https://www.zoho.com/zeptomail/help/)
- [ZeptoMail API Reference](https://www.zoho.com/zeptomail/help/api/)
- [Supabase Edge Functions Logs](https://supabase.com/docs/guides/functions/logging)
