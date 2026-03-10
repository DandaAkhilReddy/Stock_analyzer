# 🏋️‍♂️ ReddyFit - Social Fitness Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Azure%20Static%20Web%20Apps-blue)](https://agreeable-water-04e942910-preview.centralus.1.azurestaticapps.net)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Azure](https://img.shields.io/badge/Azure-0078D4?logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **A comprehensive social media platform designed exclusively for fitness enthusiasts to connect, share their journey, and find like-minded workout partners.**

## 🌟 **Live Application**

🚀 **Experience ReddyFit:** [https://agreeable-water-04e942910-preview.centralus.1.azurestaticapps.net](https://agreeable-water-04e942910-preview.centralus.1.azurestaticapps.net)

---

## 🎯 **Vision**

ReddyFit bridges the gap between fitness tracking and social connection. It's a platform where fitness enthusiasts can:

- **Track their fitness journey** with comprehensive analytics
- **Share progress and motivate others** through social features
- **Find workout partners** who match their fitness level and goals
- **Connect romantically** with like-minded fitness enthusiasts
- **Build lasting relationships** through shared passion for health and wellness

---

## ✨ **Features**

### 🏠 **Core Fitness Tracking**
- **📊 Smart Dashboard** - Comprehensive fitness overview with real-time progress tracking
- **🍽️ Meal Planner** - Intelligent nutrition planning with calorie and macro tracking
- **💪 Workout Tracker** - Exercise logging with custom routines and progress analytics
- **📈 Progress Tracking** - Visual charts, milestone tracking, and transformation photos
- **🥗 Recipe Library** - High-protein vegetarian recipes with step-by-step instructions
- **⚙️ Settings** - Personalized preferences and account management

### 🌟 **Social Media Features**
- **👥 Community Feed** - Share workouts, progress, nutrition tips, and motivation
- **❤️ Fitness Match** - Tinder-style matching for workout partners and dating
- **👤 User Profiles** - Comprehensive fitness profiles with achievements and badges
- **🏆 Achievement System** - Earn badges and showcase fitness milestones
- **💬 Social Interactions** - Like, comment, and share community posts
- **🔍 Smart Discovery** - Find users by fitness level, goals, and location

### ☁️ **Cloud Infrastructure**
- **🗄️ Azure Blob Storage** - Unlimited media storage with global CDN
- **🔥 Firebase Authentication** - Secure user management and authentication
- **🌍 Global Delivery** - Fast loading times worldwide with Azure CDN
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Git for version control
- Firebase account (free tier sufficient)
- Azure account (free tier sufficient)

### **1. Clone & Install**
```bash
git clone https://github.com/DandaAkhilReddy/reddyfit.git
cd reddyfit
npm install
```

### **2. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
nano .env
```

### **3. Firebase Configuration**
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore
3. Copy your Firebase config to `.env`

### **4. Azure Storage Setup** (Optional but Recommended)
1. Create Azure Storage Account
2. Configure CORS for web uploads
3. Copy connection string to `.env`

### **5. Start Development**
```bash
npm run dev
```

🎉 Open [http://localhost:5173](http://localhost:5173) to see ReddyFit in action!

---

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Azure Storage (Recommended for production)
VITE_AZURE_STORAGE_ACCOUNT_NAME=reddyfitstorage
VITE_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
VITE_AZURE_CDN_ENDPOINT=https://yourcdn.azureedge.net

# Application Settings
VITE_APP_NAME=ReddyFit
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

---

## 🏗️ **Architecture**

### **Frontend Stack**
```
React 18 + TypeScript + Vite
├── 🎨 Styling: TailwindCSS + Custom Components
├── 🧭 Routing: React Router v6
├── 🔄 State: React Hooks + Context API
├── 📡 HTTP: Fetch API with error handling
└── 🎭 Icons: Lucide React
```

### **Backend Services**
```
Firebase + Azure Cloud Services
├── 🔐 Authentication: Firebase Auth
├── 🗄️ Database: Firestore
├── 📁 Storage: Azure Blob Storage
├── 🌐 CDN: Azure Front Door
└── ☁️ Hosting: Azure Static Web Apps
```

---

## 📱 **Usage**

### **For Fitness Enthusiasts**
1. **🔐 Sign Up/Login** - Create your account with Firebase Auth
2. **📊 Track Progress** - Log workouts, meals, and monitor your journey
3. **📸 Share Updates** - Post progress photos, workouts, and achievements
4. **👥 Join Community** - Engage with posts, like, comment, and motivate others
5. **❤️ Find Partners** - Use the matching system to find workout buddies or dates
6. **🏆 Earn Achievements** - Unlock badges and showcase your fitness milestones

### **For Developers**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run test suite

# Deployment
npm run deploy       # Deploy to Azure Static Web Apps
```

---

## ☁️ **Deployment**

### **Azure Static Web Apps (Current)**
The application is deployed at: [https://agreeable-water-04e942910-preview.centralus.1.azurestaticapps.net](https://agreeable-water-04e942910-preview.centralus.1.azurestaticapps.net)

### **Deploy Your Own**
```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Build and deploy
npm run build
swa deploy dist --app-name your-app-name --resource-group your-rg
```

---

## 🤝 **Contributing**

We welcome contributions from the fitness and developer community!

### **Ways to Contribute**
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

---

## 📄 **License**

This project is licensed under the **MIT License**.

---

## 🙏 **Acknowledgments**

### **Special Thanks**
- **Firebase Team** for excellent authentication and database services
- **Microsoft Azure** for reliable cloud infrastructure
- **React Community** for the amazing ecosystem
- **Fitness Community** for inspiration and feedback

---

<div align="center">

**Made with 💪 for the fitness community**

[🌐 Live Demo](https://agreeable-water-04e942910-preview.centralus.1.azurestaticapps.net) •
[📝 Documentation](https://github.com/DandaAkhilReddy/reddyfit) •
[🐛 Report Bug](https://github.com/DandaAkhilReddy/reddyfit/issues) •
[✨ Request Feature](https://github.com/DandaAkhilReddy/reddyfit/issues)

**© 2024 ReddyFit. Empowering fitness journeys through social connection.**

</div>
