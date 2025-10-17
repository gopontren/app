// src/services/utils.js
// FILE BARU: Berisi fungsi-fungsi bantuan yang bisa digunakan di banyak tempat.

/**
 * Mengubah tanggal ISO menjadi format "time ago" (misal: "5 menit yang lalu").
 * @param {string} dateString - String tanggal dalam format ISO.
 * @returns {string} String format "time ago".
 */
export function timeAgo(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun yang lalu";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan yang lalu";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari yang lalu";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam yang lalu";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit yang lalu";
    
    return "Baru saja";
}
