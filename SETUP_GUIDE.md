# 🚀 Setup Guide - Go-Pontren Backend

Panduan lengkap setup backend Go-Pontren dari awal hingga deployment.

---

## 📋 Prerequisites

Pastikan Anda sudah memiliki:
- [x] Node.js (v18 atau lebih baru)
- [x] npm atau yarn
- [x] Akun Firebase (Free tier sudah cukup)
- [x] Akun Vercel (Free tier sudah cukup)
- [x] Git

---

## 🔥 Step 1: Firebase Setup

### 1.1 Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add Project"
3. Beri nama project (contoh: "gopontren")
4. Disable Google Analytics (opsional untuk MVP)
5. Tunggu project dibuat

### 1.2 Enable Firestore

1. Di Firebase Console, pilih project Anda
2. Klik "Firestore Database" di menu kiri
3. Klik "Create Database"
4. Pilih mode:
   - **Start in test mode** (untuk development)
   - **Start in production mode** (untuk production, dengan security rules)
5. Pilih lokasi: `asia-southeast1` (Singapore - terdekat dengan Indonesia)

### 1.3 Get Firebase Client Config

1. Di Firebase Console, klik ⚙️ (Settings) > Project Settings
2. Scroll ke bawah ke "Your apps"
3. Klik ikon Web (</>) untuk "Add app"
4. Register app dengan nickname (contoh: "gopontren-web")
5. Copy Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 1.4 Get Firebase Admin SDK

1. Di Firebase Console, klik ⚙️ (Settings) > Project Settings
2. Klik tab "Service accounts"
3. Klik "Generate new private key"
4. Download file JSON
5. File JSON berisi credentials Admin SDK

---

## ⚙️ Step 2: Local Development Setup

### 2.1 Clone Repository

```bash
# Clone repository Anda
git clone https://github.com/your-username/gopontren.git
cd gopontren
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Setup Environment Variables

Buat file `.env.local` di root project:

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan credentials Firebase Anda:

```env
# Firebase Client Config (dari Step 1.3)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (dari file JSON Step 1.4)
FIREBASE_ADMIN_PROJECT_ID=your-project
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...\n-----END PRIVATE KEY-----\n"

# API Secret (generate random string)
API_SECRET_KEY=your_random_secret_key_here

# Environment
NODE_ENV=development
```

⚠️ **Penting**: 
- Private key harus dalam satu baris dengan `\n` untuk newlines
- Wrap private key dengan double quotes

### 2.4 Setup Firestore Security Rules

Buat file `firestore.rules` di root project (jika belum ada):

```bash
# File sudah disediakan di repository
# Jika belum ada, copy dari BACKEND_DOCUMENTATION.md
```

Deploy security rules ke Firebase:

```bash
# Install Firebase CLI jika belum
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Initialize Firebase (pilih Firestore)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### 2.5 Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 2.6 Test API Endpoint

Test dengan curl atau Postman:

```bash
# Test register pesantren
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

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Push to GitHub

```bash
git add .
git commit -m "Setup backend with Firebase"
git push origin main
```

### 3.2 Deploy to Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik "Add New Project"
3. Import repository GitHub Anda
4. Configure Project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.3 Set Environment Variables di Vercel

1. Di Vercel project settings, buka tab "Environment Variables"
2. Tambahkan SEMUA environment variables dari `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `API_SECRET_KEY`
   - `NODE_ENV=production`

⚠️ **Penting untuk Private Key**:
- Copy paste langsung dari file JSON (dengan newlines)
- Atau gunakan format `\n` untuk newlines dalam satu baris

### 3.4 Deploy!

1. Klik "Deploy"
2. Tunggu build selesai (1-3 menit)
3. Vercel akan memberikan URL production: `https://your-app.vercel.app`

### 3.5 Test Production API

```bash
# Test dengan production URL
curl -X POST https://your-app.vercel.app/api/auth/register-pesantren \
  -H "Content-Type: application/json" \
  -d '{
    "pesantrenName": "PP. Production Test",
    "address": "Jl. Test No. 1",
    "phone": "081234567890",
    "santriCount": 10,
    "ustadzCount": 5,
    "adminName": "Admin Test",
    "adminEmail": "admin@prodtest.com"
  }'
```

---

## 🔄 Step 4: Update Frontend to Use New Backend

### 4.1 Update Admin API File

Edit `admin/src/services/api.js`:

```javascript
// Di bagian atas file, tambahkan:
const API_BASE_URL = 'https://your-app.vercel.app/api';

// Ganti semua fungsi untuk menggunakan real API
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Dan seterusnya untuk endpoint lainnya...
```

### 4.2 Update Config Files

Buat file `admin/src/services/config.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://your-app.vercel.app/api',
  TIMEOUT: 30000,
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

### 4.3 Update Modul Lainnya

Ulangi untuk:
- `toko/src/js/api.js`
- `ustadz/src/js/api.js`
- `wali/src/services/api.js`

---

## 🎯 Step 5: Seed Initial Data (Optional)

Buat script untuk populate data awal:

```javascript
// scripts/seed-data.js
const admin = require('firebase-admin');

// Initialize admin
// ... (gunakan credentials Anda)

async function seedData() {
  const db = admin.firestore();
  
  // Create platform admin
  await db.collection('users').doc('platform-admin-1').set({
    email: 'platform_admin@gopontren.com',
    name: 'Admin Platform',
    role: 'platform_admin',
    tenantId: null,
    status: 'active',
    createdAt: new Date(),
  });
  
  // Create sample pesantren
  await db.collection('pesantren').doc('pesantren-nf').set({
    name: 'PP. Nurul Fikri',
    address: 'Jl. Damai No. 1, Jakarta',
    contact: '081234567890',
    status: 'active',
    santriCount: 0,
    ustadzCount: 0,
    createdAt: new Date(),
  });
  
  console.log('✅ Data seeded successfully!');
}

seedData();
```

Run script:

```bash
node scripts/seed-data.js
```

---

## ✅ Checklist Setup Complete

- [x] Firebase project dibuat
- [x] Firestore database enabled
- [x] Firebase credentials didapat
- [x] Environment variables di-setup
- [x] Firestore security rules deployed
- [x] Development server berjalan
- [x] API endpoints tested locally
- [x] Code pushed ke GitHub
- [x] Deployed to Vercel
- [x] Environment variables di Vercel
- [x] Production API tested
- [x] Frontend updated untuk gunakan new API

---

## 🐛 Troubleshooting

### Error: "Firebase Admin initialization error"

**Solusi**:
- Pastikan `FIREBASE_ADMIN_PRIVATE_KEY` format benar
- Copy paste langsung dari JSON file
- Pastikan wrapped dengan double quotes

### Error: "Unauthorized" saat hit API

**Solusi**:
- Pastikan token disimpan setelah login
- Pastikan header `Authorization: Bearer <token>` di-set
- Check apakah token expired

### Error: "Permission denied" di Firestore

**Solusi**:
- Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- Pastikan user authenticated
- Check role dan tenantId user

### Error: Module not found

**Solusi**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Referensi

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Deployment](https://vercel.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

Selamat! Backend Go-Pontren sudah ready! 🎉
