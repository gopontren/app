// src/pages/js/topup.js
// FILE BARU: Logika untuk halaman pemilihan nominal top-up.

import { getSantriDetail } from '/src/services/api.js';

let selectedAmount = 0;
let currentSantriId = null;

/**
 * Memperbarui status UI tombol dan input berdasarkan nominal yang dipilih.
 */
function updateUI() {
    const nominalButtons = document.querySelectorAll('.nominal-btn');
    const customInput = document.getElementById('custom-amount');
    const continueButton = document.getElementById('continue-topup-button');

    // Reset semua tombol
    nominalButtons.forEach(btn => {
        btn.classList.remove('bg-emerald-50', 'border-emerald-500');
    });

    // Cek apakah ada nominal yang cocok di tombol
    const matchingButton = document.querySelector(`.nominal-btn[data-amount="${selectedAmount}"]`);
    if (matchingButton) {
        matchingButton.classList.add('bg-emerald-50', 'border-emerald-500');
        if (document.activeElement !== customInput) {
             customInput.value = '';
        }
    }
    
    // Validasi tombol "Lanjutkan"
    continueButton.disabled = selectedAmount < 10000;
}


// Fungsi utama yang dipanggil oleh router
export default async function initTopUp(santriId) {
    currentSantriId = santriId;
    if (!currentSantriId) {
        document.getElementById('app-content').innerHTML = '<p class="p-8 text-center text-red-500">ID Santri tidak ditemukan. Silakan kembali.</p>';
        return;
    }

    // Setel URL tombol kembali agar bisa kembali ke halaman sebelumnya
    const backButton = document.getElementById('back-button');
    if (window.history.length > 1) {
        // Trik sederhana untuk kembali ke halaman sebelumnya (misal: checkout atau home)
        backButton.href = "javascript:history.back()";
    } else {
        // Fallback jika tidak ada history
        backButton.href = `#home`;
    }

    try {
        const detailResponse = await getSantriDetail(currentSantriId);
        const { saldo } = detailResponse.data.goKop;
        
        // Mengambil nama dari ID santri untuk ditampilkan
        const santriNameDisplay = currentSantriId.split('-').slice(1).map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
        
        document.getElementById('topup-santri-name').textContent = `Isi saldo untuk: ${santriNameDisplay}`;
        document.getElementById('current-balance').textContent = `Rp ${saldo.toLocaleString('id-ID')}`;

    } catch (error) {
        console.error("Gagal memuat detail santri untuk top-up:", error);
        document.getElementById('topup-santri-name').textContent = 'Gagal memuat data santri';
        document.getElementById('current-balance').textContent = 'Rp -';
    }
    
    // Event listener untuk tombol nominal
    document.getElementById('nominal-options').addEventListener('click', (e) => {
        if (e.target.classList.contains('nominal-btn')) {
            selectedAmount = parseInt(e.target.dataset.amount);
            document.getElementById('custom-amount').value = ''; // Hapus input custom jika tombol diklik
            updateUI();
        }
    });

    // Event listener untuk input kustom
    const customInput = document.getElementById('custom-amount');
    customInput.addEventListener('input', () => {
        selectedAmount = parseInt(customInput.value) || 0;
        updateUI();
    });

    // Event listener untuk tombol Lanjutkan
    document.getElementById('continue-topup-button').addEventListener('click', () => {
        if (selectedAmount >= 10000) {
            window.location.hash = `#topup-payment/${currentSantriId}/${selectedAmount}`;
        }
    });

    updateUI(); // Inisialisasi UI
}
