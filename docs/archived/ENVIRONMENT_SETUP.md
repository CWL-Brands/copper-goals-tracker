# Environment Setup Guide

This guide explains how to configure environment variables for the Copper Goals Tracker application.

## Required Environment Files

Create two environment files:
- `.env.local` - For local development
- `.env.production` - For production deployment

## Environment Variables

### Firebase Configuration (Client-side)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Where to find:** Firebase Console → Project Settings → General

### Firebase Admin (Server-side)

```env
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

**Where to find:** Firebase Console → Project Settings → Service Accounts → Generate New Private Key

**Important:** The private key must be wrapped in double quotes and include `\n` for line breaks.

### Admin Users

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin1@kanvabotanicals.com,admin2@cwlbrands.com
```

Comma-separated list of admin user emails. These users will have access to:
- User management
- System configuration
- JustCall admin dashboard

### Copper SDK

```env
NEXT_PUBLIC_COPPER_SDK_URL=https://cdn.jsdelivr.net/npm/copper-sdk@latest/dist/copper-sdk.min.js
```

URL to the Copper SDK. Default value shown above.

### JustCall API (NEW)

```env
JUSTCALL_API_KEY=your_justcall_api_key
JUSTCALL_API_SECRET=your_justcall_api_secret
```

**Where to find:** JustCall Dashboard → Settings → Integrations → API

**Steps to get credentials:**
1. Log in to JustCall
2. Navigate to Settings → Integrations
3. Find "API" section
4. Click "Generate API Key"
5. Copy both API Key and API Secret

## Domain Configuration

The application supports two email domains:
- `@kanvabotanicals.com`
- `@cwlbrands.com`

Users from either domain can:
- Authenticate and access the dashboard
- Be created via admin user management
- View their JustCall metrics (if email matches)

## Security Best Practices

1. **Never commit `.env.local` or `.env.production` to version control**
   - These files are already in `.gitignore`

2. **Use different credentials for development and production**
   - Separate Firebase projects recommended
   - Different JustCall API keys if available

3. **Rotate API keys periodically**
   - Update JustCall API credentials every 90 days
   - Update Firebase service account keys annually

4. **Limit admin access**
   - Only add trusted users to `NEXT_PUBLIC_ADMIN_EMAILS`
   - Review admin list quarterly

## Verification

After setting up environment variables, verify the configuration:

### 1. Check Firebase Connection

```bash
npm run dev
```

Navigate to `/login` and attempt to sign in. If successful, Firebase is configured correctly.

### 2. Check JustCall Integration

Navigate to `/admin/justcall`. You should see:
- List of JustCall users
- No "JustCall API not configured" error

If you see an error, verify:
- `JUSTCALL_API_KEY` is set correctly
- `JUSTCALL_API_SECRET` is set correctly
- No extra spaces in the values
- Application has been restarted after adding variables

### 3. Check Admin Access

Sign in with an admin email from `NEXT_PUBLIC_ADMIN_EMAILS`. You should have access to:
- `/admin/users`
- `/admin/justcall`
- User management features

## Troubleshooting

### "Firebase not configured" error
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Check for typos in variable names
- Ensure values don't have extra quotes or spaces

### "JustCall API not configured" error
- Verify `JUSTCALL_API_KEY` and `JUSTCALL_API_SECRET` are set
- Restart the development server or redeploy
- Check JustCall dashboard to ensure API access is enabled

### "Unauthorized" when accessing admin pages
- Verify your email is in `NEXT_PUBLIC_ADMIN_EMAILS`
- Ensure email matches exactly (case-insensitive)
- Check for extra spaces in the comma-separated list

### Private key format issues
- Ensure `FIREBASE_ADMIN_PRIVATE_KEY` is wrapped in double quotes
- Line breaks should be `\n` not actual line breaks
- Copy the entire key including BEGIN/END markers

## Example Configuration

Here's a complete example (with fake values):

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbc123Def456Ghi789
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=copper-goals.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=copper-goals
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=copper-goals.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=copper-goals
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-abc123@copper-goals.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"

# Admin Users
NEXT_PUBLIC_ADMIN_EMAILS=admin@kanvabotanicals.com,manager@cwlbrands.com

# Copper SDK
NEXT_PUBLIC_COPPER_SDK_URL=https://cdn.jsdelivr.net/npm/copper-sdk@latest/dist/copper-sdk.min.js

# JustCall API
JUSTCALL_API_KEY=jc_live_abc123def456
JUSTCALL_API_SECRET=sk_live_xyz789uvw012
```
