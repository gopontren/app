# 🕌 Go-Pontren Platform - Backend with Firebase

Platform Manajemen Pesantren Terpadu dengan Backend Dinamis & Database Real-time.

---

## 🎯 Overview

Go-Pontren adalah platform multi-tenant yang menghubungkan:
- **Platform Admin**: Kelola seluruh pesantren, konten, dan monetisasi
- **Pesantren Admin**: Kelola santri, ustadz, wali, tagihan, dan koperasi
- **Toko/Koperasi**: POS system, inventory, dan e-commerce
- **Ustadz**: Absensi, scan QR, dan manajemen tugas
- **Wali Santri**: Monitor santri, bayar tagihan, dan belanja online

---

## 🏗️ Tech Stack

### Backend
- **Framework**: Next.js 14 (API Routes)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + Custom Tokens
- **Storage**: Firebase Storage
- **Hosting**: Vercel

### Frontend (Existing)
- **HTML/CSS/JavaScript** (Vanilla)
- **Tailwind CSS**
- **Lucide Icons**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm atau yarn
- Firebase Account
- Vercel Account (untuk deployment)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/gopontren.git
cd gopontren
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Download Firebase config
4. Copy `.env.example` ke `.env.local`
5. Isi environment variables dengan Firebase credentials

### 4. Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 5. Test API

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

---

## 📁 Project Structure

```
gopontren/
├── api/                      # API Routes (Backend)
│   ├── auth/                 # Authentication endpoints
│   ├── platform/             # Platform admin endpoints
│   ├── pesantren/            # Pesantren admin endpoints
│   ├── toko/                 # Toko/Koperasi endpoints
│   ├── ustadz/               # Ustadz endpoints
│   └── wali/                 # Wali santri endpoints
│
├── lib/                      # Backend utilities
│   ├── firebase/             # Firebase config & admin
│   ├── middleware/           # Auth middleware
│   └── utils/                # Helper functions
│
├── admin/                    # Admin Platform Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── index.html
│
├── toko/                     # Toko/Koperasi Frontend
├── ustadz/                   # Ustadz Frontend
├── wali/                     # Wali Santri Frontend
│
├── public/                   # Static files
├── next.config.js            # Next.js configuration
├── vercel.json               # Vercel deployment config
├── package.json
└── README.md
```

---

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Panduan setup lengkap dari awal
- **[BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)** - API documentation lengkap
- **[FRONTEND_MIGRATION_GUIDE.md](./FRONTEND_MIGRATION_GUIDE.md)** - Cara update frontend ke backend baru

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register-pesantren` - Register pesantren baru

### Platform Admin
- `GET /api/platform/summary` - Dashboard summary
- `GET /api/platform/pesantren` - List pesantren
- `POST /api/platform/pesantren/[id]/approve` - Approve pesantren
- `POST /api/platform/pesantren/[id]/reject` - Reject pesantren

### Pesantren Admin
- `GET /api/pesantren/[tenantId]/santri` - List santri
- `POST /api/pesantren/[tenantId]/santri` - Add santri
- `GET /api/pesantren/[tenantId]/tagihan` - List tagihan
- `POST /api/pesantren/[tenantId]/tagihan` - Create tagihan

### Toko/Koperasi
- `GET /api/toko/[koperasiId]/products` - List products
- `POST /api/toko/[koperasiId]/products` - Add product

### Wali Santri
- `GET /api/wali/santri/[santriId]/detail` - Get santri detail

*Lihat [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) untuk endpoint lengkap.*

---

## 🗄️ Database Schema

### Main Collections

```
users/                      # User accounts
  - email, name, role, tenantId, status

pesantren/                  # Pesantren data
  - name, address, status, santriCount
  
  santri/                   # Sub-collection: Santri
  ustadz/                   # Sub-collection: Ustadz
  wali/                     # Sub-collection: Wali
  tagihan/                  # Sub-collection: Tagihan
  koperasi/                 # Sub-collection: Koperasi

koperasi/                   # Koperasi/Toko data
  products/                 # Sub-collection: Products
  transactions/             # Sub-collection: Transactions
```

*Lihat [lib/firebase/collections.js](./lib/firebase/collections.js) untuk schema lengkap.*

---

## 🔒 Security

### Authentication
- JWT tokens dengan Firebase Auth
- Custom claims untuk role-based access
- Automatic token refresh

### Authorization
- Role-based access control (RBAC)
- Tenant isolation (multi-tenancy)
- Firestore security rules

### Data Protection
- HTTPS only
- Environment variables untuk secrets
- Input validation & sanitization

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy!

```bash
# Deploy with Vercel CLI
npm install -g vercel
vercel --prod
```

### Manual Deployment

```bash
npm run build
npm start
```

---

## 🧪 Testing

### Test API Locally

```bash
# Test dengan curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Test dengan Postman

1. Import collection dari `/docs/postman-collection.json`
2. Set environment variables
3. Run requests

---

## 📊 Monitoring & Logs

### Development
- Console logs di terminal
- Browser DevTools Network tab

### Production
- Vercel Analytics
- Firebase Console logs
- Vercel Functions logs

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 Roadmap

### Phase 1: Backend Core (Current)
- [x] Next.js setup
- [x] Firebase integration
- [x] Authentication API
- [x] Platform admin API (partial)
- [x] Pesantren admin API (partial)
- [ ] Complete all API endpoints

### Phase 2: Frontend Integration
- [ ] Update admin frontend
- [ ] Update toko frontend
- [ ] Update ustadz frontend
- [ ] Update wali frontend

### Phase 3: Advanced Features
- [ ] Real-time updates (Firestore listeners)
- [ ] Push notifications
- [ ] File upload (images, documents)
- [ ] Payment gateway integration
- [ ] WhatsApp notifications
- [ ] Analytics dashboard

### Phase 4: Optimization
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] PWA implementation
- [ ] Offline mode
- [ ] Caching strategy

---

## ⚙️ Configuration

### Environment Variables

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# API
API_SECRET_KEY=
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Firebase Admin Error**
```
Solution: Check private key format in .env
Make sure newlines are preserved
```

**2. CORS Error**
```
Solution: Check vercel.json CORS headers
```

**3. 401 Unauthorized**
```
Solution: Check token in Authorization header
Verify token hasn't expired
```

Lihat [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting) untuk solusi lengkap.

---

## 📞 Support

- **Email**: support@gopontren.com
- **GitHub Issues**: [Create issue](https://github.com/your-username/gopontren/issues)
- **Documentation**: [Backend Docs](./BACKEND_DOCUMENTATION.md)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments

- Firebase for amazing backend services
- Vercel for seamless deployment
- Next.js for powerful API routes
- Tailwind CSS for beautiful UI

---

**Built with ❤️ for Pesantren di Indonesia**

🕌 Go-Pontren - Digitalisasi Pesantren untuk Indonesia Maju
