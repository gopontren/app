# ⚡ Quick Start Guide

Get Go-Pontren backend up and running in 10 minutes!

---

## 🎯 What You Need

- ✅ Firebase Account (free tier OK)
- ✅ Firebase config credentials
- ✅ 10 minutes of your time

---

## 🚀 5-Step Setup

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Setup Firebase (3 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**
4. Get your config:
   - Go to Project Settings > General
   - Scroll to "Your apps"
   - Click Web icon (</>)
   - Copy the config object

### Step 3: Configure Environment (2 min)

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and paste your Firebase config
# Use your favorite editor (nano, vim, vscode, etc.)
nano .env.local
```

**Paste your Firebase credentials:**

```env
# Firebase Client (from Step 2)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (get from Project Settings > Service Accounts)
FIREBASE_ADMIN_PROJECT_ID=your-project
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Generate a random secret
API_SECRET_KEY=your_random_secret_key_here

NODE_ENV=development
```

**Pro Tip**: Untuk `FIREBASE_ADMIN_PRIVATE_KEY`:
1. Di Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Open downloaded JSON file
4. Copy nilai `private_key` (dengan quotes dan \n)

### Step 4: Deploy Firestore Rules (2 min)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (pilih Firestore saja)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 5: Run & Test (2 min)

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# Test API
curl -X POST http://localhost:3000/api/auth/register-pesantren \
  -H "Content-Type: application/json" \
  -d '{
    "pesantrenName": "PP. Test",
    "address": "Jl. Test No. 1",
    "phone": "081234567890",
    "santriCount": 10,
    "ustadzCount": 5,
    "adminName": "Admin Test",
    "adminEmail": "admin@test.com"
  }'
```

✅ **Done!** Backend is now running!

---

## 🌱 Optional: Seed Sample Data

Want to start with sample data?

```bash
# Set environment variables (or use service account JSON)
export FIREBASE_ADMIN_PROJECT_ID="your-project"
export FIREBASE_ADMIN_CLIENT_EMAIL="your-email@firebase.com"
export FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN..."

# Run seed script
node scripts/seed-data.js
```

This creates:
- ✅ Platform admin (email: `platform_admin@gopontren.com`, pass: `123456`)
- ✅ Sample pesantren "PP. Nurul Fikri"
- ✅ 2 Santri
- ✅ 1 Ustadz
- ✅ 1 Wali santri (email: `aisyah@email.com`, pass: `123456`)

---

## 🌐 Deploy to Vercel (5 min)

### Option 1: Web Dashboard

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables (same as `.env.local`)
6. Click "Deploy"

### Option 2: CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Don't forget** to set environment variables in Vercel dashboard!

---

## 🧪 Test Your Deployment

```bash
# Replace with your Vercel URL
VERCEL_URL="https://your-app.vercel.app"

# Test API
curl -X POST $VERCEL_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"platform_admin@gopontren.com","password":"123456"}'
```

---

## 🎉 Next Steps

1. **Update Frontend**: Follow [FRONTEND_MIGRATION_GUIDE.md](./FRONTEND_MIGRATION_GUIDE.md)
2. **Read API Docs**: Check [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
3. **Customize**: Add more features and endpoints!

---

## ❓ Need Help?

- **Setup Issues**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Troubleshooting**: Check troubleshooting section in setup guide
- **API Reference**: See [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)

---

## 🎯 Summary

```
✅ 1. npm install
✅ 2. Setup Firebase project
✅ 3. Configure .env.local
✅ 4. Deploy Firestore rules
✅ 5. npm run dev
✅ 6. Deploy to Vercel (optional)
✅ 7. Seed data (optional)
✅ 8. Update frontend
```

**Total time**: 10-15 minutes

---

**You're all set! Happy coding! 🚀**
