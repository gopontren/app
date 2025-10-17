/**
 * src/js/app.js
 * PEMBARUAN:
 * - Menambahkan `currentUser` untuk menyimpan data ustadz yang login.
 * - `selectedActivity` diubah menjadi `currentActionConfig` untuk menyimpan
 * konfigurasi aksi yang lebih lengkap, termasuk kebutuhan PIN.
 */

export const appState = {
    // Menyimpan riwayat layar untuk fungsi 'kembali'
    screenHistory: [],
    
    // Menyimpan data ustadz yang sedang login
    currentUser: null,
    
    // Menyimpan data santri sementara saat proses scan kartu (untuk PIN)
    tempSantri: null,
    
    // Menyimpan konfigurasi aksi yang sedang berjalan
    currentActionConfig: null,
    
    // Menyimpan PIN yang sedang dimasukkan oleh pengguna
    currentPin: "",
};

