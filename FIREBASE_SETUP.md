# 🔥 Firebase Setup Instructions

Firebase credentials Anda sudah dikonfigurasi! Sekarang ikuti langkah berikut:

---

## ⚠️ PENTING: Download Service Account Key

Backend memerlukan **Firebase Admin SDK credentials** untuk berjalan.

### Langkah-langkah:

1. **Buka Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Pilih project: `gopontren-app`

2. **Download Service Account Key**
   - Klik ⚙️ (Settings) > **Project Settings**
   - Pilih tab **Service accounts**
   - Klik tombol **"Generate new private key"**
   - File JSON akan terdownload

3. **Update .env.local**
   
   Buka file JSON yang baru didownload, kemudian copy 3 values ini ke `.env.local`:

   ```env
   # Dari file JSON:
   FIREBASE_ADMIN_PROJECT_ID=gopontren-app
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@gopontren-app.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...(copy semua)...KEY-----\n"
   ```

   **Note**: Private key harus dalam format satu baris dengan `\n` untuk newlines, dan wrapped dengan double quotes.

---

## 📝 Step-by-Step Setup

### Step 1: Install Dependencies (1 menit)

```bash
npm install
```

### Step 2: Setup Firebase CLI (2 menit)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Verify project
firebase projects:list
```

### Step 3: Deploy Firestore Rules & Indexes (1 menit)

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Expected output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/gopontren-app/overview
```

### Step 4: Enable Firestore Database (jika belum)

Jika Firestore belum enabled:

1. Buka Firebase Console: https://console.firebase.google.com/project/gopontren-app/firestore
2. Klik **"Create database"**
3. Pilih mode:
   - **Test mode** (untuk development) - Rules akan di-override dengan firestore.rules
   - **Production mode** (recommended) - Langsung pakai security rules
4. Pilih lokasi: **asia-southeast1** (Singapore - terdekat dengan Indonesia)
5. Klik **Enable**

### Step 5: Seed Initial Data (2 menit)

Setelah mendapatkan Admin SDK credentials:

```bash
# Set environment variables (Linux/Mac)
export FIREBASE_ADMIN_PROJECT_ID="gopontren-app"
export FIREBASE_ADMIN_CLIENT_EMAIL="your-email@gopontren-app.iam.gserviceaccount.com"
export FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Or on Windows (PowerShell)
$env:FIREBASE_ADMIN_PROJECT_ID="gopontren-app"
$env:FIREBASE_ADMIN_CLIENT_EMAIL="your-email@gopontren-app.iam.gserviceaccount.com"
$env:FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Run seed script
node scripts/seed-data.js
```

**Ini akan membuat:**
- ✅ 1 Platform admin (email: `platform_admin@gopontren.com`, password: `123456`)
- ✅ 1 Pesantren: PP. Nurul Fikri
- ✅ 1 Pesantren admin (email: `admin@pesantren-nf.com`, password: `123456`)
- ✅ 2 Santri: Ahmad Zaki & Fatimah Az-Zahra
- ✅ 1 Ustadz: Ustadz Abdullah
- ✅ 1 Wali santri (email: `aisyah@email.com`, password: `123456`)
- ✅ 1 Tagihan: SPP Oktober 2025
- ✅ 4 Content categories
- ✅ Platform settings

### Step 6: Run Development Server (30 detik)

```bash
npm run dev
```

Server akan berjalan di: http://localhost:3000

### Step 7: Test API (1 menit)

**Test 1: Home Page**
```bash
# Buka browser
open http://localhost:3000
```

**Test 2: Register Pesantren (tanpa auth)**
```bash
curl -X POST http://localhost:3000/api/auth/register-pesantren \
  -H "Content-Type: application/json" \
  -d '{
    "pesantrenName": "PP. Test Baru",
    "address": "Jl. Test No. 123, Jakarta",
    "phone": "081234567890",
    "santriCount": 50,
    "ustadzCount": 10,
    "adminName": "Admin Test",
    "adminEmail": "admin.test@example.com"
  }'
```

**Expected response:**
```json
{
  "status": "success",
  "data": {
    "success": true,
    "message": "Pendaftaran berhasil, menunggu verifikasi.",
    "pesantrenId": "..."
  }
}
```

**Test 3: Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "platform_admin@gopontren.com",
    "password": "123456"
  }'
```

**Expected response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "...",
      "name": "Admin Platform Go-Pontren",
      "email": "platform_admin@gopontren.com",
      "role": "platform_admin"
    }
  }
}
```

**Test 4: Get Platform Summary (with auth)**
```bash
# Save token from login response
TOKEN="eyJhbGc..."

curl -X GET http://localhost:3000/api/platform/summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🌐 Deploy to Vercel

### Option 1: Via Web Dashboard

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Setup Firebase backend"
   git push origin main
   ```

2. **Import di Vercel**
   - Go to: https://vercel.com/new
   - Import your GitHub repository
   - Framework preset: **Next.js**
   - Root directory: `./`

3. **Add Environment Variables**
   
   Di Vercel project settings, add semua environment variables dari `.env.local`:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDjbE3MtCZZLpo6xgxlcuAZabGHXNGlqNk
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gopontren-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=gopontren-app
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gopontren-app.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=10625212943
   NEXT_PUBLIC_FIREBASE_APP_ID=1:10625212943:web:ff229490d2802652ebf97a
   
   FIREBASE_ADMIN_PROJECT_ID=gopontren-app
   FIREBASE_ADMIN_CLIENT_EMAIL=(dari service account JSON)
   FIREBASE_ADMIN_PRIVATE_KEY=(dari service account JSON)
   
   API_SECRET_KEY=gopontren_secret_key_2025_production
   NODE_ENV=production
   ```

4. **Deploy!**
   - Klik "Deploy"
   - Tunggu ~2 menit
   - Done! 🎉

### Option 2: Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🧪 Test Production API

Setelah deploy ke Vercel:

```bash
# Replace dengan Vercel URL Anda
VERCEL_URL="https://your-app.vercel.app"

# Test API
curl -X POST $VERCEL_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "platform_admin@gopontren.com",
    "password": "123456"
  }'
```

---

## ✅ Checklist

Setup Firebase:
- [ ] Download service account JSON
- [ ] Update .env.local dengan admin credentials
- [ ] Enable Firestore Database
- [ ] Deploy firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

Run Locally:
- [ ] Install dependencies: `npm install`
- [ ] Seed data: `node scripts/seed-data.js`
- [ ] Run dev server: `npm run dev`
- [ ] Test API endpoints
- [ ] Verify dalam Firebase Console

Deploy to Vercel:
- [ ] Push to GitHub
- [ ] Import project di Vercel
- [ ] Set environment variables
- [ ] Deploy!
- [ ] Test production API

---

## 🐛 Troubleshooting

### Error: "Firebase Admin initialization error"

**Problem**: Missing or invalid Admin SDK credentials

**Solution**:
1. Make sure you downloaded the service account JSON
2. Copy the exact values from JSON to .env.local
3. Private key must be wrapped in double quotes
4. Private key must include `\n` for newlines

### Error: "Permission denied" in Firestore

**Problem**: Security rules not deployed

**Solution**:
```bash
firebase deploy --only firestore:rules
```

### Error: "Collection does not exist"

**Problem**: No data in Firestore

**Solution**:
```bash
# Seed initial data
node scripts/seed-data.js
```

---

## 📚 Next Steps

1. ✅ Complete Firebase setup (this guide)
2. 📖 Read `BACKEND_DOCUMENTATION.md` for API reference
3. 🎨 Update frontend following `FRONTEND_MIGRATION_GUIDE.md`
4. 🚀 Deploy to production
5. 🎉 Go live!

---

## 📞 Need Help?

- Check Firebase Console for errors
- Read error messages carefully
- See `SETUP_GUIDE.md` for detailed troubleshooting
- Check Vercel logs for deployment issues

---

**Your Firebase project: https://console.firebase.google.com/project/gopontren-app**

Good luck! 🚀
