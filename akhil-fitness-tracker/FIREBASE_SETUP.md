# Firebase Setup Instructions for ReddyFit

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name your project "ReddyFit" (or any name you prefer)
4. Enable Google Analytics (optional)
5. Wait for project creation

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Set your project's public-facing name to "ReddyFit"
6. Add your email as project support email

## 3. Add Web App

1. Go to project settings (gear icon)
2. Click "Add app" and select Web (</> icon)
3. Register app with nickname "ReddyFit Web"
4. Copy the config object

## 4. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Replace the values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 5. Add Authorized Domains

1. In Firebase Console, go to Authentication > Settings > Authorized domains
2. Add your production domain when deploying
3. For Azure Static Web Apps, add: `yourdomain.azurestaticapps.net`

## 6. Test Locally

1. Run `npm run dev`
2. Navigate to `/login`
3. Try signing in with Google

That's it! Your authentication should now work.