# API Key Setup Guide

## Generated API Key

**IMPORTANT**: Generate your own secure API key using one of these methods:

### Method 1: Using OpenSSL (Linux/Mac/Git Bash)
```bash
openssl rand -hex 32
```

### Method 2: Using PowerShell (Windows)
```powershell
-join ((48..57) + (65..70) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Method 3: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 4: Online Generator
Use a secure online hex generator: https://www.random.org/strings/

**Example generated key format**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

---

## Step 1: Set BACKEND_API_KEY in Fly.io

### Option A: Using Fly.io CLI

```bash
# Replace YOUR_GENERATED_KEY with your actual generated key
fly secrets set BACKEND_API_KEY=YOUR_GENERATED_KEY
```

### Option B: Using Fly.io Dashboard

1. Go to https://fly.io/dashboard
2. Select your app: **backend-dawn-wind-7381**
3. Click on **Secrets** tab (left sidebar)
4. Click **Add Secret** button
5. Enter:
   - **Key**: `BACKEND_API_KEY`
   - **Value**: Your generated API key
6. Click **Save**
7. Backend will automatically restart

### Verify Backend Secret

```bash
fly secrets list
```

You should see `BACKEND_API_KEY` in the list.

---

## Step 2: Set VITE_API_KEY in Vercel Frontend

1. Go to https://vercel.com/dashboard
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Click **Add Environment Variable**
5. Enter:
   - **Key**: `VITE_API_KEY`
   - **Value**: **Same exact value as BACKEND_API_KEY** (must match exactly)
   - **Environments**: Select all (Production, Preview, Development)
6. Click **Save**

### Important Notes:
- `VITE_API_KEY` and `BACKEND_API_KEY` must be **exactly the same**
- After adding, you need to **redeploy** your Vercel app for the variable to take effect

---

## Step 3: Redeploy Vercel Frontend

After setting `VITE_API_KEY`:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **...** (three dots) → **Redeploy**
4. Or push a new commit to trigger automatic deployment

---

## Step 4: Verify Fix

### Check Backend Logs

```bash
fly logs -a backend-dawn-wind-7381
```

You should **NOT** see this warning anymore:
```
⚠️ WARNING: BACKEND_API_KEY not set. API key authentication is disabled.
```

### Test API Call

1. Open your frontend app
2. Open Browser Console (F12)
3. Try making an API call
4. Should work without CORS or authentication errors

---

## Troubleshooting

### Warning Still Appears

- Check that `BACKEND_API_KEY` is set in Fly.io secrets
- Verify backend has restarted (check Fly.io logs)
- Make sure secret name is exactly `BACKEND_API_KEY` (case-sensitive)

### Frontend API Calls Fail

- Check that `VITE_API_KEY` is set in Vercel
- Verify you redeployed after adding the variable
- Check that `VITE_API_KEY` matches `BACKEND_API_KEY` exactly
- Check browser console for errors

### 401 Unauthorized Errors

- Verify `VITE_API_KEY` and `BACKEND_API_KEY` are exactly the same
- Check that frontend is sending `X-API-Key` header (should be automatic)
- Verify backend is reading the header correctly

---

## Security Best Practices

- ✅ Never commit API keys to git
- ✅ Never share API keys publicly
- ✅ Use different keys for development and production (optional)
- ✅ Rotate keys periodically
- ✅ Keep keys secure and private

---

## Quick Checklist

- [ ] Generated secure API key (64 characters hex)
- [ ] Set `BACKEND_API_KEY` in Fly.io secrets
- [ ] Set `VITE_API_KEY` in Vercel environment variables (same value)
- [ ] Selected all environments in Vercel (Production, Preview, Development)
- [ ] Redeployed Vercel frontend
- [ ] Verified backend logs - no warning
- [ ] Tested API calls from frontend

---

**After completing these steps, the `BACKEND_API_KEY not set` warning should be resolved!**
