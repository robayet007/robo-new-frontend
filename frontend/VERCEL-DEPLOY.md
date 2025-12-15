# 🚀 Vercel Deployment Guide

## Step 1: Vercel Account Setup

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with GitHub account (recommended)
3. **Import your repository**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository `robayet007/robotopup`
   - Click "Import"

## Step 2: Configure Project Settings

### Build Settings (Auto-detected by Vercel):
- **Framework Preset**: Vite (auto-detected)
- **Root Directory**: `frontend` (if your repo has frontend folder)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### If your repo structure is:
```
robotopup/
  ├── frontend/     ← Your React app is here
  └── backend/      ← Your backend (if any)
```

**Set Root Directory to**: `frontend`

## Step 3: Environment Variables (IMPORTANT!)

### Add Firebase Environment Variables:

1. In Vercel project settings, go to **Settings** → **Environment Variables**
2. Add these variables (one by one):

```
VITE_FIREBASE_API_KEY
Value: AIzaSyCbLo1seJxkaneK6u6EoceIuJtiROf1Mds

VITE_FIREBASE_AUTH_DOMAIN
Value: robotopup-21902.firebaseapp.com

VITE_FIREBASE_PROJECT_ID
Value: robotopup-21902

VITE_FIREBASE_STORAGE_BUCKET
Value: robotopup-21902.firebasestorage.app

VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 738273773108

VITE_FIREBASE_APP_ID
Value: 1:738273773108:web:e119d99dc1f2126fdd2c61

VITE_FIREBASE_MEASUREMENT_ID
Value: G-FK6RVTY86D
```

3. **Select environments**: 
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Click **Save** after each variable

## Step 4: Deploy

1. Click **Deploy** button
2. Vercel will:
   - Install dependencies
   - Build your app
   - Deploy to production
3. Wait for deployment to complete (2-3 minutes)

## Step 5: Verify Deployment

1. **Check deployment URL**: 
   - Vercel will provide: `https://your-project-name.vercel.app`
   - Or custom domain if configured

2. **Test the app**:
   - Open the URL in browser
   - Test login/signup
   - Test Firebase features
   - Test PWA installation

## Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically configure SSL

## 🔧 Troubleshooting

### Build Fails:
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check `package.json` scripts
- Ensure `vite.config.ts` is correct

### Environment Variables Not Working:
- Make sure all variables start with `VITE_`
- Redeploy after adding variables
- Check variable names match exactly

### Routing Issues (404 on refresh):
- `vercel.json` is already configured with rewrites
- Should work automatically

### Firebase Errors:
- Verify all environment variables are set
- Check Firebase project settings
- Ensure Firebase Auth domains include your Vercel domain

## 📝 Quick Deploy Checklist:

- [ ] Vercel account created
- [ ] Repository imported
- [ ] Root directory set (if needed: `frontend`)
- [ ] All 7 Firebase environment variables added
- [ ] Build settings verified
- [ ] Deployed successfully
- [ ] App tested and working

## 🎯 After Deployment:

1. **Update Firebase Auth Domains**:
   - Go to Firebase Console → Authentication → Settings
   - Add authorized domain: `your-project.vercel.app`
   - Add custom domain if used

2. **Test PWA Installation**:
   - Open app on mobile
   - Test "Install App" button
   - Verify service worker works

3. **Monitor**:
   - Check Vercel analytics
   - Monitor Firebase usage
   - Check error logs

## 💡 Pro Tips:

- **Automatic Deployments**: Every push to main branch auto-deploys
- **Preview Deployments**: PRs get preview URLs
- **Rollback**: Easy rollback from deployment history
- **Analytics**: Built-in analytics in Vercel dashboard

---

**Need Help?** Check Vercel docs: https://vercel.com/docs





