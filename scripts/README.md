# 🛠️ Scripts

Utility scripts untuk setup dan maintenance.

---

## 📝 Available Scripts

### `seed-data.js`

Populate database dengan initial data untuk testing.

**Usage:**

```bash
# Set environment variables
export FIREBASE_ADMIN_PROJECT_ID="your-project-id"
export FIREBASE_ADMIN_CLIENT_EMAIL="your-service-account@firebase.com"
export FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Run script
node scripts/seed-data.js
```

**Alternative** (menggunakan service account JSON):

```bash
# Download service account JSON dari Firebase Console
# Simpan sebagai scripts/firebase-service-account.json

# Run script
node scripts/seed-data.js
```

**Data yang di-create:**
- 1 Platform admin user
- 1 Pesantren (PP. Nurul Fikri)
- 1 Pesantren admin user
- 2 Santri
- 1 Ustadz
- 1 Wali santri user
- 1 Tagihan (SPP)
- 4 Content categories
- Platform monetization settings

**Default Credentials:**
- Email: `platform_admin@gopontren.com` | Password: `123456`
- Email: `admin@pesantren-nf.com` | Password: `123456`
- Email: `aisyah@email.com` | Password: `123456`

---

## ⚠️ Important Notes

1. **Jangan run seed script di production!**
   - Script ini untuk testing/development saja
   - Akan overwrite data yang sudah ada

2. **Backup data sebelum run script**
   - Export Firestore data jika perlu
   - Atau test di Firestore emulator

3. **Ubah password default**
   - Setelah seed, segera ubah password
   - Atau implement proper password hashing

---

## 🔮 Future Scripts

Scripts yang akan dibuat:

- `backup-database.js` - Export Firestore data
- `restore-database.js` - Import Firestore data
- `migrate-schema.js` - Database schema migration
- `cleanup-data.js` - Clean up test data
- `generate-reports.js` - Generate sample reports

---

## 📚 References

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
