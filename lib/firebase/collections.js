/**
 * Firestore Collections Structure
 * Definisi struktur database untuk Go-Pontren Platform
 */

export const COLLECTIONS = {
  // Root Collections
  USERS: 'users',
  PESANTREN: 'pesantren',
  PLATFORM_SETTINGS: 'platform_settings',
  CONTENT_CATEGORIES: 'content_categories',
  GLOBAL_CONTENT: 'global_content',
  ADS: 'ads',
  WITHDRAWAL_REQUESTS: 'withdrawal_requests',
  
  // Pesantren Sub-collections (tenant-scoped)
  // Format: pesantren/{pesantrenId}/santri
  SANTRI: 'santri',
  USTADZ: 'ustadz',
  WALI: 'wali',
  TAGIHAN: 'tagihan',
  KOPERASI: 'koperasi',
  ANNOUNCEMENTS: 'announcements',
  DISCUSSIONS: 'discussions',
  JADWAL: 'jadwal',
  PERIZINAN: 'perizinan',
  KEGIATAN: 'kegiatan',
  TASK_GROUPS: 'task_groups',
  MASTER_DATA: 'master_data',
  
  // Koperasi Sub-collections
  // Format: pesantren/{pesantrenId}/koperasi/{koperasiId}/products
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SUPPLIERS: 'suppliers',
  TRANSACTIONS: 'transactions',
  ONLINE_ORDERS: 'online_orders',
  PURCHASES: 'purchases',
  EXPENSES: 'expenses',
  NOTIFICATIONS: 'notifications',
  
  // Ustadz Collections
  PICKUP_TASKS: 'pickup_tasks',
  PERMISSIONS: 'permissions',
  
  // Wali Collections  
  ORDERS: 'orders',
  PAYMENTS: 'payments',
};

/**
 * Helper untuk mendapatkan path collection dengan tenant scope
 */
export const getCollectionPath = (collection, pesantrenId = null, subId = null) => {
  if (!pesantrenId) {
    return collection;
  }
  
  if (subId) {
    return `${COLLECTIONS.PESANTREN}/${pesantrenId}/${collection}/${subId}`;
  }
  
  return `${COLLECTIONS.PESANTREN}/${pesantrenId}/${collection}`;
};

/**
 * Database Schema Documentation
 */
export const SCHEMA = {
  users: {
    id: 'string (auto)',
    email: 'string',
    name: 'string',
    role: 'platform_admin | pesantren_admin | koperasi_admin | ustadz | wali_santri',
    tenantId: 'string (pesantren id)',
    status: 'active | pending | rejected',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  
  pesantren: {
    id: 'string (auto)',
    name: 'string',
    address: 'string',
    contact: 'string',
    logoUrl: 'string',
    documentUrl: 'string',
    santriCount: 'number',
    ustadzCount: 'number',
    status: 'pending | active | inactive | rejected',
    subscriptionUntil: 'date',
    admin: {
      name: 'string',
      email: 'string',
    },
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  
  santri: {
    id: 'string (auto)',
    nis: 'string',
    name: 'string',
    classId: 'string',
    balance: 'number',
    status: 'active | izin',
    permitInfo: 'object | null',
    transactionPin: 'string (hashed)',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  
  // ... (schema lainnya akan didefinisikan saat implementasi)
};
