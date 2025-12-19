# 🔧 Firebase Domain Authorization Fix

## ❌ Error:
```
Firebase: Error (auth/unauthorized-domain)
```

## ✅ Solution: Add Vercel Domain to Firebase

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your project: **robotopup-21902**

### Step 2: Navigate to Authentication Settings
1. Click **Authentication** in left sidebar
2. Click **Settings** tab (gear icon at top)
3. Scroll down to **Authorized domains** section

### Step 3: Add Vercel Domain
1. Click **Add domain** button
2. Enter: `robotopup.vercel.app`
3. Click **Add**
4. Domain will be added to the list

### Step 4: Verify Domain List
Your authorized domains should include:
- ✅ `localhost` (for local development)
- ✅ `robotopup-21902.firebaseapp.com` (Firebase default)
- ✅ `robotopup.vercel.app` (your Vercel domain)
- ✅ `your-custom-domain.com` (if using custom domain - **IMPORTANT!**)
- ✅ `www.your-custom-domain.com` (if using www subdomain)

### Step 5: Test
1. Go to your Vercel app: https://robotopup.vercel.app
2. Try to login/signup
3. Error should be resolved!

## 📝 Important Notes:

- **No code changes needed** - This is a Firebase Console configuration
- **Takes effect immediately** - No deployment required
- **Works for all auth methods** - Email/password and Google Sign-in

## 🔍 If Still Not Working:

1. **Check domain format**:
   - ✅ Correct: `robotopup.vercel.app`
   - ✅ Correct: `your-custom-domain.com` (for custom domain)
   - ❌ Wrong: `https://robotopup.vercel.app` (no https://)
   - ❌ Wrong: `robotopup.vercel.app/` (no trailing slash)
   - ❌ Wrong: `https://your-custom-domain.com` (no https://)

2. **Custom Domain Users**:
   - **CRITICAL**: Custom domain add করলে Firebase authorized domains এ **must add** করতে হবে
   - Example: যদি আপনার domain `example.com` হয়, তাহলে Firebase এ `example.com` add করুন
   - `www` subdomain use করলে `www.example.com` ও add করুন

2. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Check Firebase project**:
   - Make sure you're in the correct Firebase project
   - Project ID: `robotopup-21902`

4. **Verify environment variables**:
   - Check Vercel environment variables are set correctly
   - All `VITE_FIREBASE_*` variables should be present

## 🎯 Quick Checklist:

- [ ] Firebase Console opened
- [ ] Authentication → Settings → Authorized domains
- [ ] Added `robotopup.vercel.app`
- [ ] Domain appears in list
- [ ] Tested login on Vercel app
- [ ] Error resolved!

---

**Need more help?** Check Firebase docs: https://firebase.google.com/docs/auth/web/domain-restriction










