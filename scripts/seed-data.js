/**
 * Seed Initial Data to Firestore
 * 
 * Usage:
 * 1. Set environment variables untuk Firebase Admin
 * 2. Run: node scripts/seed-data.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Gunakan environment variables atau service account file
if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
} else {
  // Alternative: use service account JSON file
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function seedData() {
  console.log('🌱 Starting data seeding...\n');

  try {
    // ============================================
    // 1. CREATE PLATFORM ADMIN USER
    // ============================================
    console.log('👤 Creating platform admin user...');
    
    const platformAdminRef = db.collection('users').doc('platform-admin-001');
    await platformAdminRef.set({
      email: 'platform_admin@gopontren.com',
      name: 'Admin Platform Go-Pontren',
      role: 'platform_admin',
      tenantId: null,
      pesantrenName: null,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('   ✅ Platform admin created\n');

    // ============================================
    // 2. CREATE SAMPLE PESANTREN
    // ============================================
    console.log('🏫 Creating sample pesantren...');
    
    const pesantrenRef = db.collection('pesantren').doc('pesantren-nf');
    await pesantrenRef.set({
      name: 'PP. Nurul Fikri',
      address: 'Jl. Damai No. 1, Jakarta Selatan',
      contact: '081234567890',
      logoUrl: '',
      documentUrl: '',
      santriCount: 0,
      ustadzCount: 0,
      status: 'active',
      subscriptionUntil: new Date('2026-12-31'),
      admin: {
        name: 'Admin Nurul Fikri',
        email: 'admin@pesantren-nf.com',
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('   ✅ Pesantren "PP. Nurul Fikri" created\n');

    // ============================================
    // 3. CREATE PESANTREN ADMIN USER
    // ============================================
    console.log('👤 Creating pesantren admin user...');
    
    const pesantrenAdminRef = db.collection('users').doc('admin-nf-001');
    await pesantrenAdminRef.set({
      email: 'admin@pesantren-nf.com',
      name: 'Admin Nurul Fikri',
      role: 'pesantren_admin',
      tenantId: 'pesantren-nf',
      pesantrenName: 'PP. Nurul Fikri',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('   ✅ Pesantren admin created\n');

    // ============================================
    // 4. CREATE SAMPLE SANTRI
    // ============================================
    console.log('👨‍🎓 Creating sample santri...');
    
    const santriData = [
      {
        id: 'santri-nf-001',
        name: 'Ahmad Zaki',
        nis: '20240001',
        classId: 'kelas-1',
        balance: 50000,
        status: 'active',
        permitInfo: null,
        transactionPin: 'hashed_123456',
      },
      {
        id: 'santri-nf-002',
        name: 'Fatimah Az-Zahra',
        nis: '20240002',
        classId: 'kelas-1',
        balance: 75000,
        status: 'active',
        permitInfo: null,
        transactionPin: 'hashed_123456',
      },
    ];

    for (const santri of santriData) {
      const santriRef = pesantrenRef.collection('santri').doc(santri.id);
      await santriRef.set({
        ...santri,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ Santri "${santri.name}" created`);
    }
    
    // Update santri count
    await pesantrenRef.update({
      santriCount: santriData.length,
    });
    
    console.log('');

    // ============================================
    // 5. CREATE SAMPLE USTADZ
    // ============================================
    console.log('👨‍🏫 Creating sample ustadz...');
    
    const ustadzRef = pesantrenRef.collection('ustadz').doc('ustadz-nf-001');
    await ustadzRef.set({
      name: 'Ustadz Abdullah',
      email: 'ustadz.abdullah@pesantren-nf.com',
      subject: 'Fiqih',
      photoUrl: '',
      password: 'hashed_123456',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    await pesantrenRef.update({
      ustadzCount: 1,
    });
    
    console.log('   ✅ Ustadz "Ustadz Abdullah" created\n');

    // ============================================
    // 6. CREATE WALI SANTRI USER
    // ============================================
    console.log('👨‍👩‍👧 Creating wali santri user...');
    
    const waliRef = db.collection('users').doc('wali-001');
    await waliRef.set({
      email: 'aisyah@email.com',
      name: 'Bunda Aisyah',
      role: 'wali_santri',
      tenantId: 'pesantren-nf',
      santriIds: ['santri-nf-001', 'santri-nf-002'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('   ✅ Wali santri "Bunda Aisyah" created\n');

    // ============================================
    // 7. CREATE SAMPLE TAGIHAN
    // ============================================
    console.log('💰 Creating sample tagihan...');
    
    const tagihanRef = pesantrenRef.collection('tagihan').doc('tagihan-001');
    await tagihanRef.set({
      title: 'SPP Oktober 2025',
      amount: 750000,
      dueDate: '2025-10-10',
      mandatory: true,
      targets: [],
      totalTargets: 2,
      paidCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('   ✅ Tagihan "SPP Oktober 2025" created\n');

    // ============================================
    // 8. CREATE PLATFORM SETTINGS
    // ============================================
    console.log('⚙️  Creating platform settings...');
    
    const settingsRef = db.collection('platform_settings').doc('monetization');
    await settingsRef.set({
      tagihanFee: 2500,
      topupFee: 2000,
      koperasiCommission: 1.5,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('   ✅ Platform settings created\n');

    // ============================================
    // 9. CREATE CONTENT CATEGORIES
    // ============================================
    console.log('📚 Creating content categories...');
    
    const categories = [
      { id: 'cat-1', name: 'Fiqih & Ibadah' },
      { id: 'cat-2', name: 'Kisah Inspiratif' },
      { id: 'cat-3', name: 'Info Acara Pesantren' },
      { id: 'cat-4', name: 'Tips & Trik Belajar' },
    ];

    for (const category of categories) {
      const catRef = db.collection('content_categories').doc(category.id);
      await catRef.set({
        name: category.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ Category "${category.name}" created`);
    }
    
    console.log('');

    // ============================================
    // DONE!
    // ============================================
    console.log('✅ Data seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log('   - 1 Platform admin');
    console.log('   - 1 Pesantren (PP. Nurul Fikri)');
    console.log('   - 1 Pesantren admin');
    console.log('   - 2 Santri');
    console.log('   - 1 Ustadz');
    console.log('   - 1 Wali santri');
    console.log('   - 1 Tagihan');
    console.log('   - 4 Content categories');
    console.log('   - Platform settings\n');
    
    console.log('🔑 Default credentials (password: 123456):');
    console.log('   Platform Admin: platform_admin@gopontren.com');
    console.log('   Pesantren Admin: admin@pesantren-nf.com');
    console.log('   Wali Santri: aisyah@email.com\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run seeding
seedData();
