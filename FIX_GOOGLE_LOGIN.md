# 🔧 Fix Google Login Issue

## Problem
Google login fails on the deployed Azure app because the domain isn't authorized in Firebase.

## Solution - Add Authorized Domain to Firebase

### **Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com
2. Select project: **reddyfit-dcf41**

### **Step 2: Add Authorized Domain**
1. Click **Authentication** in the left menu
2. Click **Settings** tab
3. Scroll to **Authorized domains** section
4. Click **Add domain**
5. Add this domain:
   ```
   agreeable-water-04e942910.1.azurestaticapps.net
   ```
6. Click **Add**

### **Step 3: Verify Settings**
Ensure these domains are listed:
- ✅ `localhost` (for local development)
- ✅ `reddyfit-dcf41.firebaseapp.com` (default)
- ✅ `agreeable-water-04e942910.1.azurestaticapps.net` (your Azure app)

### **Step 4: Enable Google Sign-In (if not enabled)**
1. In Firebase Console → Authentication
2. Click **Sign-in method** tab
3. Find **Google** in the list
4. If disabled, click it and toggle **Enable**
5. Add support email: your email
6. Click **Save**

---

## Alternative: Check Google Cloud Console OAuth Settings

If the issue persists, also check Google Cloud Console:

1. Go to: https://console.cloud.google.com
2. Select project: **reddyfit-dcf41**
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click to edit
6. Under **Authorized JavaScript origins**, add:
   ```
   https://agreeable-water-04e942910.1.azurestaticapps.net
   ```
7. Under **Authorized redirect URIs**, add:
   ```
   https://agreeable-water-04e942910.1.azurestaticapps.net/__/auth/handler
   ```
8. Click **Save**

---

## After Adding Domain

The Google login should work immediately. No code changes or redeployment needed!

Just refresh the app and try logging in again:
**https://agreeable-water-04e942910.1.azurestaticapps.net**

---

## Test Login
1. Open: https://agreeable-water-04e942910.1.azurestaticapps.net
2. Click "Sign in with Google"
3. Should see Google account picker
4. Select your account
5. Should redirect back and be logged in ✅

---

## If Still Having Issues

### Check Browser Console for Errors:
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for error messages
4. Common errors:
   - "auth/unauthorized-domain" → Domain not authorized (follow steps above)
   - "auth/popup-blocked" → Browser blocking popup (allow popups for the site)
   - "auth/operation-not-allowed" → Google sign-in not enabled in Firebase

### Screenshot the Error
If you see an error, take a screenshot and we can fix it specifically.

---

## Current Firebase Configuration (Verified ✅)

```javascript
{
  apiKey: "AIzaSyBFhGoxAAR4vLYLXNn8nDlKabiqhCPnWJk",
  authDomain: "reddyfit-dcf41.firebaseapp.com",
  projectId: "reddyfit-dcf41",
  storageBucket: "reddyfit-dcf41.firebasestorage.app",
  messagingSenderId: "123730832729",
  appId: "1:123730832729:web:16ce63a0f2d5401f60b048",
  measurementId: "G-ECC4W6B3JN"
}
```

This configuration is correct and already deployed! ✅

The only missing piece is the authorized domain in Firebase Console.
