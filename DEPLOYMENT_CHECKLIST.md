# ✅ Deployment Checklist - Go-Pontren Backend

Checklist lengkap untuk deploy backend Go-Pontren ke production.

---

## 🔥 Phase 1: Firebase Setup

### 1.1 Firebase Project
- [x] Firebase project "gopontren-app" sudah ada
- [x] Firebase credentials sudah dikonfigurasi
- [ ] **Download Service Account JSON** ⚠️ PENTING!
  - Go to: Firebase Console > Project Settings > Service Accounts
  - Click "Generate new private key"
  - Save file JSON dengan aman

### 1.2 Firestore Database
- [ ] Enable Firestore Database
  - Go to: https://console.firebase.google.com/project/gopontren-app/firestore
  - Click "Create database"
  - Location: `asia-southeast1` (Singapore)
  - Mode: **Production mode** (with security rules)

### 1.3 Firebase Authentication
- [ ] Enable Email/Password authentication
  - Go to: Firebase Console > Authentication
  - Click "Get started"
  - Enable "Email/Password" provider

### 1.4 Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

---

## 💻 Phase 2: Local Development

### 2.1 Environment Setup
- [x] `.env.local` file created
- [ ] Update Admin SDK credentials in `.env.local`
  ```env
  FIREBASE_ADMIN_PROJECT_ID=gopontren-app
  FIREBASE_ADMIN_CLIENT_EMAIL=(from JSON)
  FIREBASE_ADMIN_PRIVATE_KEY=(from JSON)
  ```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Seed Initial Data
```bash
# Set environment variables first
export FIREBASE_ADMIN_PROJECT_ID="gopontren-app"
export FIREBASE_ADMIN_CLIENT_EMAIL="..."
export FIREBASE_ADMIN_PRIVATE_KEY="..."

# Run seed
node scripts/seed-data.js
```

### 2.4 Run Development Server
```bash
npm run dev
# Should run on http://localhost:3000
```

### 2.5 Test API Endpoints
- [ ] Test home page: `http://localhost:3000`
- [ ] Test register: `POST /api/auth/register-pesantren`
- [ ] Test login: `POST /api/auth/login`
- [ ] Test with auth: `GET /api/platform/summary`

---

## 📦 Phase 3: Git & GitHub

### 3.1 Commit Changes
```bash
git add .
git commit -m "Setup Firebase backend with real credentials"
git push origin main
```

### 3.2 Verify Repository
- [ ] All files pushed to GitHub
- [ ] `.env.local` NOT pushed (check .gitignore)
- [ ] Documentation files included

---

## 🚀 Phase 4: Vercel Deployment

### 4.1 Import Project
- [ ] Go to: https://vercel.com/new
- [ ] Import GitHub repository
- [ ] Framework: **Next.js** (auto-detected)
- [ ] Root directory: `./`

### 4.2 Configure Environment Variables

Add these in Vercel project settings:

**Firebase Client (Public)**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDjbE3MtCZZLpo6xgxlcuAZabGHXNGlqNk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gopontren-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gopontren-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gopontren-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=10625212943
NEXT_PUBLIC_FIREBASE_APP_ID=1:10625212943:web:ff229490d2802652ebf97a
```

**Firebase Admin (Secret)**
```
FIREBASE_ADMIN_PROJECT_ID=gopontren-app
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@gopontren-app.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Other**
```
API_SECRET_KEY=gopontren_secret_key_2025_production
NODE_ENV=production
```

### 4.3 Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Get deployment URL (e.g., `https://gopontren.vercel.app`)

### 4.4 Test Production API
```bash
# Replace with your Vercel URL
VERCEL_URL="https://your-app.vercel.app"

# Test login
curl -X POST $VERCEL_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"platform_admin@gopontren.com","password":"123456"}'
```

---

## 🔐 Phase 5: Security & Verification

### 5.1 Verify Security Rules
- [ ] Rules deployed to Firestore
- [ ] Test unauthorized access (should be denied)
- [ ] Test authorized access (should work)

### 5.2 Verify Authentication
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Token-based API access works
- [ ] Unauthorized API access blocked

### 5.3 Verify Data Isolation
- [ ] Platform admin can access all data
- [ ] Pesantren admin can only access their tenant data
- [ ] Wali can only access their santri data

---

## 🎨 Phase 6: Frontend Integration

### 6.1 Update API Base URL

In each frontend module, update API base URL:

**Admin module** (`admin/src/services/api.js`):
```javascript
const API_BASE_URL = 'https://your-app.vercel.app/api';
```

**Toko module** (`toko/src/js/api.js`):
```javascript
const API_BASE_URL = 'https://your-app.vercel.app/api';
```

**Ustadz module** (`ustadz/src/js/api.js`):
```javascript
const API_BASE_URL = 'https://your-app.vercel.app/api';
```

**Wali module** (`wali/src/services/api.js`):
```javascript
const API_BASE_URL = 'https://your-app.vercel.app/api';
```

### 6.2 Update Authentication Flow
- [ ] Store token in localStorage after login
- [ ] Add Authorization header to API calls
- [ ] Handle token expiration
- [ ] Redirect to login on 401

### 6.3 Test Each Module
- [ ] Admin: Login, dashboard, pesantren management
- [ ] Toko: Login, products, transactions
- [ ] Ustadz: Login, schedule, scan
- [ ] Wali: Login, santri detail, e-commerce

---

## 📊 Phase 7: Monitoring & Testing

### 7.1 Setup Monitoring
- [ ] Check Vercel Analytics
- [ ] Check Firebase Console > Usage
- [ ] Setup error tracking (optional: Sentry)

### 7.2 Performance Testing
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Pagination working correctly

### 7.3 Load Testing
- [ ] Test with multiple concurrent users
- [ ] Test with large datasets
- [ ] Check Firebase quota limits

---

## 🐛 Phase 8: Troubleshooting

### Common Issues

**1. "Firebase Admin initialization error"**
- ✅ Check private key format
- ✅ Make sure it's wrapped in quotes
- ✅ Include \n for newlines

**2. "Permission denied" in Firestore**
- ✅ Deploy security rules: `firebase deploy --only firestore:rules`
- ✅ Check user role in token
- ✅ Verify tenantId matches

**3. "401 Unauthorized"**
- ✅ Check token is sent in header
- ✅ Token format: `Bearer <token>`
- ✅ Check token hasn't expired

**4. CORS errors**
- ✅ Check vercel.json CORS headers
- ✅ Redeploy if needed

---

## ✅ Final Checklist

### Firebase
- [ ] Project created
- [ ] Firestore enabled
- [ ] Authentication enabled
- [ ] Security rules deployed
- [ ] Indexes deployed
- [ ] Initial data seeded

### Development
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Dev server runs successfully
- [ ] API endpoints tested locally

### Deployment
- [ ] Code pushed to GitHub
- [ ] Imported to Vercel
- [ ] Environment variables set
- [ ] Production deployment successful
- [ ] Production API tested

### Frontend
- [ ] API URLs updated
- [ ] Authentication flow updated
- [ ] All modules tested
- [ ] Error handling works

### Security
- [ ] Security rules verified
- [ ] Authentication working
- [ ] Authorization working
- [ ] Data isolation verified

### Monitoring
- [ ] Analytics enabled
- [ ] Error tracking setup
- [ ] Performance monitored

---

## 🎯 Success Criteria

✅ Backend deployed and accessible
✅ API endpoints working
✅ Authentication functional
✅ Database connected
✅ Security rules active
✅ Frontend integrated
✅ No critical errors
✅ Performance acceptable

---

## 📞 Support

If you encounter issues:
1. Check this checklist
2. Read error messages
3. Check Firebase Console logs
4. Check Vercel Function logs
5. Read `FIREBASE_SETUP.md`
6. Read `SETUP_GUIDE.md`

---

**Firebase Console**: https://console.firebase.google.com/project/gopontren-app
**Vercel Dashboard**: https://vercel.com/dashboard

---

Good luck! 🚀
