/**
 * src/js/pages/profil.js
 * [DIROMBAK TOTAL]
 * - Menginisialisasi halaman profil baru yang berfungsi sebagai pusat konten.
 * - Mengimplementasikan logika untuk sistem tab (Artikel vs Video).
 * - Menyesuaikan data-action pada Floating Action Button (FAB) berdasarkan tab yang aktif.
 */

import { createIcons } from '../ui.js';

let activeTab = 'artikel'; // Menyimpan state tab yang sedang aktif

/**
 * Fungsi untuk beralih antar tab.
 * @param {string} tabName - Nama tab yang akan diaktifkan ('artikel' atau 'video').
 */
function switchTab(tabName) {
    activeTab = tabName;

    // 1. Update tombol tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    // 2. Update konten tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-content`);
    });

    // 3. Update data-action pada FAB
    const fab = document.querySelector('[data-action="create-new-content"]');
    if (fab) {
        if (tabName === 'artikel') {
            // Konfigurasi untuk membuka editor artikel
            fab.dataset.actionConfig = JSON.stringify({
                isEditor: true,
                editorPage: 'editor',
                editorParams: { title: "Buat Artikel Baru", type: "Artikel" }
            });
        } else {
            // Konfigurasi untuk membuka editor video
            fab.dataset.actionConfig = JSON.stringify({
                isEditor: true,
                editorPage: 'videoEditor'
            });
        }
    }
}


export function initProfil() {
    // 1. Inisialisasi ikon-ikon
    createIcons();

    // 2. Tambahkan event listener ke semua tombol tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });

    // 3. Atur tab default saat halaman pertama kali dimuat
    switchTab('artikel');
}
