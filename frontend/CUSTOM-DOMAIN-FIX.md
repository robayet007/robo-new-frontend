# 🔧 Custom Domain Fix Guide - Vercel

## ❌ Problem:
Custom domain এ website load হচ্ছে না, frontend দেখা যাচ্ছে না

## ✅ Solution Steps:

### Step 1: Vercel Domain Configuration

1. **Vercel Dashboard এ যান**:
   - https://vercel.com → আপনার Project → **Settings** → **Domains**

2. **Custom Domain Add করুন**:
   - "Add Domain" button click করুন
   - আপনার custom domain enter করুন (যেমন: `example.com` বা `www.example.com`)
   - Vercel automatically SSL certificate configure করবে

3. **DNS Configuration**:
   - Vercel আপনাকে DNS records দেবে
   - আপনার domain provider (Namecheap, GoDaddy, etc.) এ এই records add করুন:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```
   - **Important**: DNS propagation হতে 24-48 ঘন্টা লাগতে পারে

### Step 2: Firebase Authorized Domains (CRITICAL!)

**এটা সবচেয়ে important step!**

1. **Firebase Console এ যান**:
   - https://console.firebase.google.com
   - Project select করুন: **robotopup-21902**

2. **Authentication Settings**:
   - Left sidebar → **Authentication** → **Settings** tab
   - Scroll down → **Authorized domains** section

3. **Custom Domain Add করুন**:
   - "Add domain" button click করুন
   - আপনার custom domain enter করুন (যেমন: `example.com`)
   - **Important**: `https://` বা trailing slash (`/`) দেবেন না
   - ✅ Correct: `example.com`
   - ❌ Wrong: `https://example.com` বা `example.com/`

4. **Verify Domain List**:
   আপনার authorized domains এ থাকতে হবে:
   - ✅ `localhost` (local development)
   - ✅ `robotopup-21902.firebaseapp.com` (Firebase default)
   - ✅ `robotopup.vercel.app` (Vercel default domain)
   - ✅ `your-custom-domain.com` (আপনার custom domain)
   - ✅ `www.your-custom-domain.com` (যদি www subdomain use করেন)

### Step 3: Vercel Environment Variables Check

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. **Verify সব Firebase variables আছে**:
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_FIREBASE_MEASUREMENT_ID
   ```
3. **Important**: `VITE_FIREBASE_AUTH_DOMAIN` এর value হবে:
   - `robotopup-21902.firebaseapp.com` (এটা Firebase এর default domain, custom domain নয়!)

### Step 4: Redeploy After Changes

1. **Vercel Dashboard** → **Deployments**
2. **Latest deployment** → **"..." menu** → **Redeploy**
3. অথবা নতুন commit push করুন

### Step 5: Clear Browser Cache

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) বা `Cmd+Shift+R` (Mac)
2. অথবা **Incognito/Private window** এ test করুন
3. **Service Worker Clear**:
   - Browser DevTools → Application → Service Workers → Unregister
   - Application → Storage → Clear site data

### Step 6: Verify DNS Propagation

1. **Check DNS**: https://dnschecker.org
2. আপনার domain enter করুন
3. সব location এ DNS propagate হয়েছে কিনা check করুন
4. যদি সব location এ না থাকে, wait করুন (24-48 hours)

## 🔍 Troubleshooting:

### Issue 1: Blank Page / White Screen

**Possible Causes**:
- Firebase domain not authorized
- Asset paths not loading
- Service worker caching issue

**Solutions**:
1. ✅ Firebase authorized domains check করুন (Step 2)
2. ✅ Browser console এ errors check করুন (F12)
3. ✅ Network tab এ failed requests check করুন
4. ✅ Service worker unregister করুন

### Issue 2: Firebase Auth Error

**Error**: `auth/unauthorized-domain`

**Solution**:
- Firebase Console → Authentication → Settings → Authorized domains
- Custom domain add করুন (Step 2 দেখুন)

### Issue 3: Assets Not Loading (404 errors)

**Possible Causes**:
- Base path issue
- Vercel configuration issue

**Solutions**:
1. ✅ `vercel.json` file check করুন (rewrites configured আছে)
2. ✅ Browser console → Network tab → failed assets check করুন
3. ✅ Vercel deployment logs check করুন

### Issue 4: DNS Not Working

**Symptoms**:
- Domain not resolving
- SSL certificate error

**Solutions**:
1. ✅ DNS records correctly configured আছে কিনা check করুন
2. ✅ DNS propagation wait করুন (24-48 hours)
3. ✅ Vercel domain settings → DNS configuration verify করুন

### Issue 5: SSL Certificate Error

**Solution**:
- Vercel automatically SSL configure করে
- যদি error থাকে, Vercel Dashboard → Domains → SSL status check করুন
- SSL provision হতে কিছু সময় লাগতে পারে

## 📝 Quick Checklist:

- [ ] Custom domain Vercel এ add করা হয়েছে
- [ ] DNS records correctly configured হয়েছে
- [ ] Firebase authorized domains এ custom domain add করা হয়েছে
- [ ] Vercel environment variables সব set আছে
- [ ] Redeploy করা হয়েছে
- [ ] Browser cache clear করা হয়েছে
- [ ] DNS propagation complete হয়েছে (24-48 hours wait)
- [ ] SSL certificate active হয়েছে
- [ ] Website test করা হয়েছে

## 🎯 Most Common Issue:

**90% ক্ষেত্রে সমস্যা হয় Firebase authorized domains এ custom domain add না করার জন্য!**

✅ **Solution**: Firebase Console → Authentication → Settings → Authorized domains → Custom domain add করুন

## 💡 Pro Tips:

1. **Test Both Domains**: 
   - Vercel default domain (`robotopup.vercel.app`) test করুন
   - Custom domain test করুন
   - দুটোই কাজ করলে সব ঠিক আছে

2. **Use Browser DevTools**:
   - F12 → Console tab → Errors check করুন
   - Network tab → Failed requests check করুন
   - Application tab → Service Workers → Status check করুন

3. **Check Vercel Logs**:
   - Vercel Dashboard → Deployments → Latest → Logs
   - Build errors বা runtime errors check করুন

4. **DNS Propagation Check**:
   - https://dnschecker.org use করুন
   - সব location এ propagate হয়েছে কিনা verify করুন

---

**Still Not Working?** 
1. Browser console এর exact error message share করুন
2. Vercel deployment logs check করুন
3. Network tab এর failed requests screenshot নিন
