# 📚 Go-Pontren Backend API Documentation

## 🎯 Arsitektur

Backend Go-Pontren menggunakan:
- **Framework**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication dengan Custom Tokens
- **Deployment**: Vercel

---

## 🔐 Authentication

### Header Authentication
Semua endpoint (kecuali login dan register) memerlukan token JWT di header:

```
Authorization: Bearer <firebase_custom_token>
```

### Roles
- `platform_admin`: Admin utama platform
- `pesantren_admin`: Admin pesantren
- `koperasi_admin`: Admin koperasi/toko
- `ustadz`: Ustadz/Pengajar
- `wali_santri`: Wali santri

---

## 📡 API Endpoints

### **Authentication**

#### POST `/api/auth/login`
Login untuk semua roles

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "user123",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "pesantren_admin",
      "tenantId": "pesantren-nf",
      "pesantrenName": "PP. Nurul Fikri"
    }
  }
}
```

#### POST `/api/auth/register-pesantren`
Registrasi pesantren baru

**Request Body:**
```json
{
  "pesantrenName": "PP. Nurul Fikri",
  "address": "Jl. Example No. 1",
  "phone": "081234567890",
  "santriCount": 100,
  "ustadzCount": 20,
  "adminName": "Admin Name",
  "adminEmail": "admin@pesantren.com",
  "logo": "base64_or_url"
}
```

---

### **Platform Admin**

#### GET `/api/platform/summary`
Dashboard summary untuk platform admin

**Auth Required**: `platform_admin`

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalPesantren": 5,
    "totalSantri": 250,
    "totalTransaksiBulanan": 125000000,
    "pendapatanPlatform": 6250000
  }
}
```

#### GET `/api/platform/pesantren`
List semua pesantren

**Auth Required**: `platform_admin`

**Query Params:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `query`: Search by name or ID
- `status`: Filter by status (all, pending, active, rejected)

**Response:**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "limit": 10
  }
}
```

#### POST `/api/platform/pesantren/[id]/approve`
Approve pendaftaran pesantren

**Auth Required**: `platform_admin`

**Response:**
```json
{
  "status": "success",
  "data": {
    "success": true,
    "message": "Pesantren berhasil disetujui"
  }
}
```

#### POST `/api/platform/pesantren/[id]/reject`
Reject pendaftaran pesantren

**Auth Required**: `platform_admin`

**Request Body:**
```json
{
  "reason": "Dokumen tidak lengkap"
}
```

---

### **Pesantren Admin**

#### GET `/api/pesantren/[tenantId]/santri`
List santri dalam pesantren

**Auth Required**: `platform_admin`, `pesantren_admin`

**Query Params:**
- `page`: Page number
- `limit`: Items per page
- `query`: Search by name or NIS
- `status`: Filter by status (all, active, izin)

#### POST `/api/pesantren/[tenantId]/santri`
Tambah santri baru

**Auth Required**: `platform_admin`, `pesantren_admin`

**Request Body:**
```json
{
  "name": "Ahmad Zaki",
  "nis": "20240001",
  "classId": "kelas-1"
}
```

#### GET `/api/pesantren/[tenantId]/tagihan`
List tagihan

**Auth Required**: `platform_admin`, `pesantren_admin`

#### POST `/api/pesantren/[tenantId]/tagihan`
Buat tagihan baru

**Auth Required**: `platform_admin`, `pesantren_admin`

**Request Body:**
```json
{
  "title": "SPP Oktober 2025",
  "amount": 750000,
  "dueDate": "2025-10-10",
  "mandatory": true,
  "targets": []
}
```

---

### **Toko/Koperasi**

#### GET `/api/toko/[koperasiId]/products`
List produk dalam koperasi

**Auth Required**: `koperasi_admin`, `pesantren_admin`

#### POST `/api/toko/[koperasiId]/products`
Tambah produk baru

**Auth Required**: `koperasi_admin`, `pesantren_admin`

**Request Body:**
```json
{
  "name": "Chitato Sapi Panggang",
  "sku": "MR-001",
  "barcode": "899001123456",
  "price": 10000,
  "costPrice": 8000,
  "stock": 50,
  "categoryId": "cat-1",
  "image": "url_or_base64"
}
```

---

### **Wali Santri**

#### GET `/api/wali/santri/[santriId]/detail`
Get detail santri (keuangan, saldo, tagihan)

**Auth Required**: `wali_santri`

**Response:**
```json
{
  "status": "success",
  "data": {
    "santri": {
      "id": "santri-123",
      "name": "Ahmad Zaki",
      "balance": 50000
    },
    "keuangan": {
      "tagihan": [...]
    },
    "goKop": {
      "saldo": 50000
    },
    "activityLog": [...]
  }
}
```

---

## 🗄️ Database Schema

### Collections Structure

```
users/
  - {userId}
    - email
    - name
    - role
    - tenantId
    - status
    - createdAt
    - updatedAt

pesantren/
  - {pesantrenId}
    - name
    - address
    - status
    - santriCount
    - ustadzCount
    - ...
    
    santri/
      - {santriId}
        - name
        - nis
        - classId
        - balance
        - status
        - ...
    
    ustadz/
      - {ustadzId}
        - name
        - email
        - subject
        - ...
    
    wali/
      - {waliId}
        - name
        - email
        - santriIds[]
        - ...
    
    tagihan/
      - {tagihanId}
        - title
        - amount
        - dueDate
        - paidCount
        - totalTargets
        - ...

koperasi/
  - {koperasiId}
    - name
    - tenantId
    - ...
    
    products/
      - {productId}
        - name
        - price
        - stock
        - ...
    
    transactions/
      - {transactionId}
        - date
        - total
        - items[]
        - ...
```

---

## 🔒 Security Rules

Firestore Security Rules (simpan di `firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isPlatformAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'platform_admin';
    }
    
    function belongsToTenant(tenantId) {
      return isAuthenticated() && 
        (isPlatformAdmin() || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantId == tenantId);
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin() || request.auth.uid == userId;
    }
    
    // Pesantren collection
    match /pesantren/{pesantrenId} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin();
      
      // Santri sub-collection
      match /santri/{santriId} {
        allow read: if belongsToTenant(pesantrenId);
        allow write: if belongsToTenant(pesantrenId);
      }
      
      // Other sub-collections follow same pattern
      match /{subcollection}/{docId} {
        allow read: if belongsToTenant(pesantrenId);
        allow write: if belongsToTenant(pesantrenId);
      }
    }
    
    // Koperasi collection
    match /koperasi/{koperasiId} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin();
      
      match /{subcollection}/{docId} {
        allow read, write: if isAuthenticated();
      }
    }
  }
}
```

---

## 🚀 Deployment

### Environment Variables

Buat file `.env.local` untuk development:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@firebase.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Vercel Deployment

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables di Vercel dashboard
4. Deploy!

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🧪 Testing API

Gunakan Postman atau curl:

```bash
# Login
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"123456"}'

# Get with authentication
curl -X GET https://your-domain.vercel.app/api/platform/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 TODO / Endpoints Belum Diimplementasi

Endpoint-endpoint berikut masih perlu diimplementasi:

### Platform Admin
- [ ] `/api/platform/content` - Manajemen konten global
- [ ] `/api/platform/ads` - Manajemen iklan
- [ ] `/api/platform/withdrawals` - Penarikan dana
- [ ] `/api/platform/monetization` - Pengaturan monetisasi

### Pesantren Admin
- [ ] `/api/pesantren/[id]/ustadz` - CRUD ustadz
- [ ] `/api/pesantren/[id]/wali` - CRUD wali
- [ ] `/api/pesantren/[id]/koperasi` - CRUD koperasi
- [ ] `/api/pesantren/[id]/jadwal` - Manajemen jadwal
- [ ] `/api/pesantren/[id]/perizinan` - Manajemen perizinan
- [ ] `/api/pesantren/[id]/kegiatan` - Log kegiatan

### Toko/Koperasi
- [ ] `/api/toko/[id]/categories` - CRUD kategori
- [ ] `/api/toko/[id]/transactions` - Transaksi kasir
- [ ] `/api/toko/[id]/orders` - Pesanan online
- [ ] `/api/toko/[id]/reports` - Laporan

### Ustadz
- [ ] `/api/ustadz/schedule` - Jadwal ustadz
- [ ] `/api/ustadz/absensi` - Absensi
- [ ] `/api/ustadz/pickup-tasks` - Tugas pengambilan paket

### Wali Santri
- [ ] `/api/wali/orders` - Riwayat pesanan
- [ ] `/api/wali/payments` - Pembayaran tagihan
- [ ] `/api/wali/topup` - Top-up saldo

---

## 📞 Support

Jika ada pertanyaan atau issue, silakan buat issue di GitHub repository.
