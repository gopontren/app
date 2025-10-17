/**
 * src/js/pages/akunSaya.js
 * [FILE BARU]
 * Menginisialisasi halaman "Akun Saya" dan memuat data pengguna yang sedang login.
 */

import { appState } from '../app.js';
import { createIcons } from '../ui.js';

function renderContent(ustadz) {
    const container = document.getElementById('akun-saya-content');
    if (!container) return;

    // Menangani kasus jika data ustadz tidak ada
    const name = ustadz ? ustadz.name : 'Gagal Memuat';
    const photoUrl = ustadz ? ustadz.photoUrl : 'https://placehold.co/96x96/e2e8f0/e2e8f0';
    const email = ustadz ? `${ustadz.id}@gopontren.id` : 'tidak diketahui';

    container.innerHTML = `
        <div class="flex flex-col items-center mb-10">
            <img src="${photoUrl}" alt="${name}" class="w-24 h-24 rounded-full mb-4 ring-4 ring-white shadow-lg bg-slate-200">
            <h2 class="text-xl font-semibold">${name}</h2>
            <p class="text-slate-500">Ustadz Pengajar</p>
        </div>

        <div class="space-y-4">
            <div>
                <label class="text-sm font-medium text-slate-500">Nama Lengkap</label>
                <input type="text" value="${name}" class="w-full mt-1 px-4 py-3 border border-slate-300 rounded-xl bg-slate-100" readonly>
            </div>
            <div>
                <label class="text-sm font-medium text-slate-500">Email</label>
                <input type="email" value="${email}" class="w-full mt-1 px-4 py-3 border border-slate-300 rounded-xl bg-slate-100" readonly>
            </div>
            <button class="w-full mt-6 bg-teal-600 text-white py-3 rounded-xl font-semibold text-lg">
                Edit Profil
            </button>
        </div>
    `;
}

export function initAkunSaya() {
  // Ambil data dari appState yang sudah dimuat saat di beranda
  const currentUser = appState.currentUser;
  
  // Render konten halaman
  renderContent(currentUser);
  
  // Pastikan semua ikon di-render
  createIcons();
}
