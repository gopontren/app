/**
 * Modul ini bertanggung jawab untuk semua logika yang terkait dengan mode offline.
 * Menyimpan, mengambil, dan menyinkronkan transaksi yang tertunda.
 */

import { addTransaction as sendTransactionToServer } from './api.js';
import { showNotification } from './ui.js';

const STORAGE_KEY = 'pending_transactions';

/**
 * Menyimpan transaksi ke localStorage saat aplikasi offline.
 * @param {object} txData - Data transaksi yang akan disimpan.
 */
export const saveTransactionOffline = (txData) => {
    const queue = getOfflineTransactions();
    // Tambahkan ID unik untuk pelacakan offline & waktu penyimpanan
    const offlineTx = {
        ...txData,
        offlineId: `offline-${Date.now()}`,
        savedAt: new Date().toISOString()
    };
    queue.push(offlineTx);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    console.log('Transaksi disimpan secara lokal:', offlineTx);
};

/**
 * Mengambil semua transaksi yang tersimpan dari localStorage.
 * @returns {Array} Antrian transaksi.
 */
export const getOfflineTransactions = () => {
    try {
        const queue = localStorage.getItem(STORAGE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error("Gagal membaca transaksi offline:", error);
        return [];
    }
};

/**
 * Menghapus satu transaksi dari antrian localStorage setelah berhasil disinkronkan.
 * @param {string} offlineId - ID unik dari transaksi offline yang akan dihapus.
 */
const removeOfflineTransaction = (offlineId) => {
    let queue = getOfflineTransactions();
    queue = queue.filter(tx => tx.offlineId !== offlineId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

/**
 * Proses utama untuk menyinkronkan semua transaksi yang tertunda ke server.
 */
export const syncOfflineTransactions = async () => {
    const queue = getOfflineTransactions();
    if (queue.length === 0) {
        console.log('Tidak ada transaksi untuk disinkronkan.');
        return;
    }

    showNotification(`Menyinkronkan ${queue.length} transaksi tertunda...`, 'info');

    let successCount = 0;
    // Gunakan for...of agar bisa menggunakan await di dalam loop
    for (const tx of queue) {
        try {
            // Panggil fungsi API untuk mengirim data, tandai sebagai sinkronisasi
            await sendTransactionToServer(tx, true); 
            // Hapus dari antrian HANYA jika berhasil
            removeOfflineTransaction(tx.offlineId);
            successCount++;
        } catch (error) {
            console.error(`Gagal menyinkronkan transaksi ${tx.offlineId}:`, error);
            showNotification(`Gagal menyinkronkan sebagian transaksi. Akan dicoba lagi nanti.`, 'error');
            // Hentikan proses jika ada satu yang gagal agar urutan tidak rusak
            break; 
        }
    }

    if (successCount > 0 && successCount === queue.length) {
        showNotification('Sinkronisasi selesai. Semua data telah diperbarui.', 'success');
    }
};

