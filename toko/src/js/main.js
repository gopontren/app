
import { initRouter } from './router.js';
import { updateBadges, initUI, updateConnectionStatusIndicator } from './ui.js';
import { initNavigation } from './navigation.js';
import { getOnlineOrders } from './api.js';
import { initProfileDropdown } from './auth.js';
import { initStore } from './store.js';
// PENAMBAHAN BARU: Impor fungsi sinkronisasi dan handler offline
import { syncOfflineTransactions } from './offline-handler.js';

/**
 * Titik masuk utama aplikasi.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Inisialisasi semua komponen UI global
    initUI();
    initNavigation(); 
    initProfileDropdown();
    
    // Inisialisasi data store sebelum router dijalankan
    await initStore();
    
    // Inisialisasi router untuk menangani navigasi halaman
    initRouter();

    // Inisialisasi/update badge notifikasi
    updateBadges();

    // --- PENAMBAHAN BARU: Logika Penanganan Koneksi ---
    
    // 1. Saat kembali online, update UI dan coba sinkronkan data
    window.addEventListener('online', () => {
        updateConnectionStatusIndicator(true);
        syncOfflineTransactions();
    });

    // 2. Saat offline, cukup update UI
    window.addEventListener('offline', () => {
        updateConnectionStatusIndicator(false);
    });

    // Logika untuk notifikasi suara pesanan baru (tidak berubah)
    let lastNewOrderCount = 0;
    let isFirstCheck = true;
    const audioEl = document.getElementById('notification-sound');

    const checkForNewOrders = async () => {
        try {
            // Hanya cek jika sedang online
            if (navigator.onLine) {
                const orders = await getOnlineOrders();
                const newOrdersCount = orders.filter(o => o.status === 'baru').length;

                if (isFirstCheck) {
                    lastNewOrderCount = newOrdersCount;
                    isFirstCheck = false;
                    return;
                }

                if (newOrdersCount > lastNewOrderCount) {
                    if (audioEl) {
                        audioEl.play().catch(e => console.error("Gagal memutar audio:", e));
                    }
                    updateBadges();
                }
                lastNewOrderCount = newOrdersCount;
            }
        } catch (error) {
            console.error("Gagal memeriksa pesanan baru:", error);
        }
    };

    setInterval(checkForNewOrders, 15000);
});
