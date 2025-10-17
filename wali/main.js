import { initRouter } from './src/services/router.js';

// Jalankan aplikasi saat seluruh struktur halaman (DOM) sudah siap.
document.addEventListener('DOMContentLoaded', () => {
    console.log("Aplikasi Go-Pontren Dimuat");
    // Memulai router untuk menangani navigasi
    initRouter();
});
