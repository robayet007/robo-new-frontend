# Environment Variables Setup Guide

## Required Environment Variables

For the frontend to work securely, you **must** set these environment variables:

### 1. `VITE_BACKEND_URL` (Required)
- **Description**: Backend API base URL
- **Example**: `https://backend-dawn-wind-7381.fly.dev`
- **Note**: Do NOT hardcode this in the code. Always use environment variables.

### 2. `VITE_SOCKET_URL` (Required)
- **Description**: Socket.IO server URL (usually same as backend URL)
- **Example**: `https://backend-dawn-wind-7381.fly.dev`
- **Note**: Must match your backend deployment URL

### 3. `VITE_API_KEY` (Required)
- **Description**: API key for backend authentication
- **Example**: `your-secret-api-key-here`
- **Note**: Must match `BACKEND_API_KEY` in backend environment variables
- **Security**: Generate a strong random string (e.g., `openssl rand -hex 32`)

## Local Development Setup

1. Create a `.env.local` file in the `frontend` directory:

```bash
VITE_BACKEND_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_API_KEY=your-local-api-key-here
```

2. Make sure your backend is running with matching `BACKEND_API_KEY`

## Vercel Deployment Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all three variables:
   - `VITE_BACKEND_URL` = Your Fly.io backend URL
   - `VITE_SOCKET_URL` = Your Fly.io backend URL (same as above)
   - `VITE_API_KEY` = Your secret API key (must match backend)

4. **Important**: After adding variables, redeploy your application

## Security Notes

- ✅ Environment variables are NOT exposed in client-side code (Vite prefixes with `VITE_`)
- ✅ Backend URL is not hardcoded - stored securely in environment variables
- ✅ API key authentication prevents unauthorized access
- ❌ Never commit `.env.local` or `.env` files to git
- ❌ Never share your API keys publicly

## Troubleshooting

### Error: "VITE_BACKEND_URL environment variable is not set"
- Make sure you've set the variable in Vercel dashboard
- Redeploy after adding environment variables
- Check that variable name is exactly `VITE_BACKEND_URL` (case-sensitive)

### Error: "VITE_API_KEY environment variable is not set"
- Set `VITE_API_KEY` in Vercel dashboard
- Make sure it matches `BACKEND_API_KEY` in backend
- Redeploy after adding

### API requests failing with 401 Unauthorized
- Check that `VITE_API_KEY` matches `BACKEND_API_KEY` in backend
- Verify API key is set correctly in both frontend and backend
