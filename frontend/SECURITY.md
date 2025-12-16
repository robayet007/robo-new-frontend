# 🔒 Security Guide

## ⚠️ Important: Firebase API Key Security

The Firebase API key has been moved to environment variables for security.

## ✅ What Was Fixed:

1. **Removed hardcoded credentials** from `src/config/firebase.ts`
2. **Created `.env` file** with Firebase configuration
3. **Added `.env` to `.gitignore`** to prevent committing secrets
4. **Created `.env.example`** as a template

## 🔑 Setting Up Environment Variables:

### For Local Development:

1. The `.env` file is already created with your Firebase credentials
2. Make sure `.env` is in `.gitignore` (already done)
3. **NEVER commit `.env` file to git!**

### For Production/Deployment:

1. Set environment variables in your hosting platform:
   - **Vercel**: Go to Project Settings > Environment Variables
   - **Netlify**: Go to Site Settings > Environment Variables
   - **Render**: Go to Environment > Environment Variables

2. Add these variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

## 🔄 Rotating the Exposed API Key (Recommended):

Since the API key was exposed in git history, consider:

1. **Restrict API Key** in Firebase Console:
   - Go to Firebase Console > Project Settings > API Keys
   - Click on your API key
   - Add HTTP referrer restrictions
   - Restrict to your domain only

2. **Create a new API Key** (optional but recommended):
   - Create new API key in Firebase Console
   - Update `.env` file with new key
   - Deploy with new key
   - Delete old key after confirming new one works

## ✅ Verification:

After setup, verify:
- ✅ `.env` file exists and contains credentials
- ✅ `.env` is in `.gitignore`
- ✅ `.env` is NOT committed to git
- ✅ App works with environment variables
- ✅ Production environment variables are set

## 📝 Notes:

- Firebase API keys are safe to expose in frontend code (they're public by design)
- However, it's best practice to use environment variables for:
  - Different keys for dev/prod
  - Easy rotation
  - Better security practices
  - Compliance requirements









