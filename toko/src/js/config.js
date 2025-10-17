/**
 * config.js
 * * Berisi semua konstanta dan konfigurasi global untuk aplikasi.
 * ---
 * PERUBAHAN:
 * - Menambahkan status 'dalam_pengantaran_internal' ke dalam ORDER_STATUSES
 * untuk mendukung alur baru pengambilan paket oleh Ustadz.
 */

export const config = {
    // Pengaturan Paginasi
    pagination: {
        ITEMS_PER_PAGE: 5, // Jumlah item per halaman untuk tabel
        KASIR_ITEMS_PER_PAGE: 12, // Jumlah produk yang ditampilkan per 'halaman' di kasir
    },

    // Pengaturan API & Data
    api: {
        SIMULATED_DELAY: 300, // Penundaan dalam milidetik untuk simulasi panggilan API
    },

    // Pengaturan Notifikasi
    notifications: {
        DISPLAY_TIME: 3000, // Waktu notifikasi ditampilkan dalam milidetik
    },
    
    // Pengaturan Lainnya
    search: {
        DEBOUNCE_TIME: 300, // Waktu tunda sebelum pencarian dieksekusi setelah pengguna mengetik
    },
    
    stock: {
        LOW_STOCK_THRESHOLD: 20, // Batas stok dianggap menipis
    }
};

// --- PENGATURAN APLIKASI ---

// Konstanta untuk paginasi, digunakan di banyak halaman
export const ITEMS_PER_PAGE = 5;

// Batas stok untuk peringatan "Stok Menipis"
export const STOCK_ALERT_THRESHOLD = 20;

// ID Kategori default untuk produk yang ditambahkan melalui pintasan kasir
export const DEFAULT_CATEGORY_ID = 5; // ID untuk "Lain-lain"

// Daftar status pesanan untuk konsistensi
export const ORDER_STATUSES = ['baru', 'diproses', 'siap_diambil', 'dalam_pengantaran_internal', 'sedang_diantar', 'selesai'];

// Konfigurasi untuk halaman pengaturan
export const SETTINGS_SECTIONS = {
    profile: {
        template: 'src/pages/pengaturan/_profile.html',
    },
    store: {
        template: 'src/pages/pengaturan/_toko.html',
    },
    delivery: {
        template: 'src/pages/pengaturan/_pengiriman.html',
    },
    schedule: {
        template: 'src/pages/pengaturan/_jadwal.html',
    },
    security: {
        template: 'src/pages/pengaturan/_keamanan.html',
    }
};
