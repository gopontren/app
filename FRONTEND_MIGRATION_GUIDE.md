# 🔄 Frontend Migration Guide

Panduan untuk mengupdate frontend agar menggunakan backend API yang baru.

---

## 📝 Overview

Saat ini, semua modul (admin, toko, ustadz, wali) menggunakan **mock data** di file `api.js` masing-masing. Kita akan mengupdate mereka untuk memanggil **real API endpoints**.

---

## 🎯 Strategy

Kita akan menggunakan pendekatan **incremental migration**:
1. Buat API client utility baru
2. Update satu endpoint pada satu waktu
3. Test setiap perubahan
4. Rollback jika ada issue

---

## 📁 File Structure

```
lib/utils/
  └── api-client.js          # ✅ Sudah dibuat - Utility untuk API calls

admin/src/services/
  ├── api.js                 # 🔄 Update ini
  ├── api-new.js             # 📝 Buat ini dulu (parallel implementation)
  └── state.js               # ⚠️ Perlu update untuk handle token

toko/src/js/
  ├── api.js                 # 🔄 Update ini
  └── config.js              # 📝 Tambahkan API config

ustadz/src/js/
  └── api.js                 # 🔄 Update ini

wali/src/services/
  └── api.js                 # 🔄 Update ini
```

---

## 🔧 Step 1: Setup API Client di Setiap Modul

### Admin Module

Buat file baru `admin/src/services/api-new.js`:

```javascript
/**
 * New API implementation using real backend
 */

const API_BASE_URL = 'https://your-app.vercel.app/api';

// Helper untuk get token
function getAuthToken() {
    const session = JSON.parse(localStorage.getItem('goPontrenDashboardSession') || '{}');
    return session.token || null;
}

// Helper untuk API call
async function apiCall(endpoint, options = {}) {
    const { method = 'GET', body = null, requireAuth = true } = options;
    
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (requireAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    const config = {
        method,
        headers,
    };
    
    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export async function login(email, password) {
    const response = await apiCall('/auth/login', {
        method: 'POST',
        body: { email, password },
        requireAuth: false,
    });
    
    // Simpan token dan user data
    if (response.status === 'success') {
        localStorage.setItem('goPontrenDashboardSession', JSON.stringify({
            token: response.data.token,
            user: response.data.user,
        }));
    }
    
    return response;
}

export async function registerPesantren(data) {
    return apiCall('/auth/register-pesantren', {
        method: 'POST',
        body: data,
        requireAuth: false,
    });
}

// ============================================
// PLATFORM ENDPOINTS
// ============================================

export async function getPlatformSummary() {
    return apiCall('/platform/summary');
}

export async function getPesantrenList(options = {}) {
    const { page = 1, limit = 10, query = '', status = 'all' } = options;
    const params = new URLSearchParams({ page, limit, query, status });
    return apiCall(`/platform/pesantren?${params}`);
}

export async function approvePesantren(id) {
    return apiCall(`/platform/pesantren/${id}/approve`, {
        method: 'POST',
    });
}

export async function rejectPesantren(id, reason) {
    return apiCall(`/platform/pesantren/${id}/reject`, {
        method: 'POST',
        body: { reason },
    });
}

// ============================================
// PESANTREN ENDPOINTS
// ============================================

export async function getSantriForPesantren(tenantId, options = {}) {
    const { page = 1, limit = 10, query = '', status = 'all' } = options;
    const params = new URLSearchParams({ page, limit, query, status });
    return apiCall(`/pesantren/${tenantId}/santri?${params}`);
}

export async function addSantriToPesantren(tenantId, data) {
    return apiCall(`/pesantren/${tenantId}/santri`, {
        method: 'POST',
        body: data,
    });
}

export async function getTagihanForPesantren(tenantId, options = {}) {
    const { page = 1, limit = 10, query = '' } = options;
    const params = new URLSearchParams({ page, limit, query });
    return apiCall(`/pesantren/${tenantId}/tagihan?${params}`);
}

export async function addTagihanToPesantren(tenantId, data) {
    return apiCall(`/pesantren/${tenantId}/tagihan`, {
        method: 'POST',
        body: data,
    });
}

// ... Tambahkan endpoint lainnya sesuai kebutuhan
```

### Toko Module

Buat file baru `toko/src/js/api-new.js`:

```javascript
const API_BASE_URL = 'https://your-app.vercel.app/api';

function getAuthToken() {
    // Sesuaikan dengan storage key di toko module
    return localStorage.getItem('tokoAuthToken') || null;
}

async function apiCall(endpoint, options = {}) {
    // ... (sama seperti admin module)
}

// Products
export async function getProducts(koperasiId) {
    return apiCall(`/toko/${koperasiId}/products`);
}

export async function saveProduct(koperasiId, productData) {
    const method = productData.id ? 'PUT' : 'POST';
    const endpoint = productData.id 
        ? `/toko/${koperasiId}/products/${productData.id}`
        : `/toko/${koperasiId}/products`;
    
    return apiCall(endpoint, {
        method,
        body: productData,
    });
}

// ... endpoint lainnya
```

### Wali Module

Buat file baru `wali/src/services/api-new.js`:

```javascript
const API_BASE_URL = 'https://your-app.vercel.app/api';

function getAuthToken() {
    const session = JSON.parse(localStorage.getItem('goPontrenSession') || '{}');
    return session.token || null;
}

async function apiCall(endpoint, options = {}) {
    // ... (sama seperti admin module)
}

// Santri detail
export async function getSantriDetail(santriId) {
    return apiCall(`/wali/santri/${santriId}/detail`);
}

// Products
export async function getStoreProducts(options = {}) {
    const { search = '', page = 1, limit = 8 } = options;
    const params = new URLSearchParams({ search, page, limit });
    return apiCall(`/wali/products?${params}`);
}

// ... endpoint lainnya
```

---

## 🔄 Step 2: Testing Strategy

### Phase 1: Parallel Implementation (Recommended)

Jalankan API lama dan baru secara parallel:

```javascript
// Di file yang menggunakan API, misalnya login.js
import * as oldApi from './services/api.js';
import * as newApi from './services/api-new.js';

// Toggle antara old dan new API
const USE_NEW_API = true; // Set ke false untuk rollback

async function handleLogin(email, password) {
    const api = USE_NEW_API ? newApi : oldApi;
    
    try {
        const response = await api.login(email, password);
        // ... handle response
    } catch (error) {
        console.error('Login error:', error);
        // Fallback ke old API jika new API gagal
        if (USE_NEW_API) {
            console.log('Falling back to old API...');
            const response = await oldApi.login(email, password);
            // ... handle response
        }
    }
}
```

### Phase 2: Gradual Migration

Migrate satu halaman pada satu waktu:

1. **Week 1**: Login & Registration
2. **Week 2**: Dashboard & Summary
3. **Week 3**: CRUD Operations (Santri, Ustadz, dll)
4. **Week 4**: Advanced features (Keuangan, Laporan)

### Phase 3: Full Switch

Setelah semua tested:

```javascript
// Rename api-new.js menjadi api.js
// atau update import statements
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: CORS Error

**Problem**: `Access to fetch at 'https://...' from origin 'http://localhost' has been blocked by CORS policy`

**Solution**: Sudah handled di `vercel.json`, tapi pastikan headers CORS di-set dengan benar.

### Issue 2: Token Expired

**Problem**: API returns 401 Unauthorized setelah beberapa waktu

**Solution**: Implement token refresh atau redirect ke login:

```javascript
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(...);
        
        if (response.status === 401) {
            // Token expired, redirect to login
            localStorage.clear();
            window.location.href = '/admin/src/pages/auth/login.html';
            return;
        }
        
        // ... rest of code
    } catch (error) {
        // ...
    }
}
```

### Issue 3: Different Data Structure

**Problem**: Backend returns data dalam structure berbeda dari mock data

**Solution**: Buat adapter function:

```javascript
function adaptSantriData(apiResponse) {
    // Convert API response structure to frontend expected structure
    return {
        id: apiResponse.id,
        nis: apiResponse.nis,
        name: apiResponse.name,
        // ... map other fields
    };
}
```

---

## 📊 Progress Tracking

Buat checklist untuk tracking progress:

### Admin Module
- [x] Login
- [x] Register Pesantren
- [x] Platform Summary
- [x] Pesantren List
- [x] Approve/Reject Pesantren
- [ ] Santri CRUD
- [ ] Ustadz CRUD
- [ ] Tagihan CRUD
- [ ] ... (add more)

### Toko Module
- [ ] Login
- [ ] Products CRUD
- [ ] Transactions
- [ ] Orders
- [ ] ... (add more)

### Ustadz Module
- [ ] Login
- [ ] Schedule
- [ ] Scan QR
- [ ] Pickup Tasks
- [ ] ... (add more)

### Wali Module
- [ ] Login
- [ ] Santri List
- [ ] Santri Detail
- [ ] Products
- [ ] Orders
- [ ] Payments
- [ ] ... (add more)

---

## 🧪 Testing Checklist

Untuk setiap endpoint yang di-migrate:

- [ ] ✅ API call succeeds
- [ ] ✅ Response structure correct
- [ ] ✅ Data displays correctly in UI
- [ ] ✅ Error handling works
- [ ] ✅ Loading states work
- [ ] ✅ Pagination works (if applicable)
- [ ] ✅ Search/filter works (if applicable)
- [ ] ✅ Works on production (Vercel)

---

## 🚀 Deployment Strategy

1. **Development**: Test di local dengan mock data
2. **Staging**: Deploy ke Vercel preview branch, test dengan real API
3. **Production**: Merge ke main branch setelah semua test pass

---

## 📝 Notes

- Backup file `api.js` lama sebelum replace
- Document setiap perubahan di git commit message
- Gunakan feature flags untuk easy rollback
- Monitor error logs di production

---

Selamat melakukan migration! 🎉
