// src/pages/js/topup-payment.js
// [PEROMBAKAN BESAR]
// - Mengambil data santri dan biaya layanan untuk ditampilkan.
// - Mengimplementasikan alur pembayaran 'pending' yang lebih realistis.

import { processTopUp, completeMockTopUp, getSantriList, getAdminSettings } from '/src/services/api.js';
import { getSession } from '/src/services/state.js';

// Fungsi utama yang dipanggil oleh router
export default async function initTopUpPayment(santriId, amount) {
    const content = document.getElementById('payment-content');
    const confirmButton = document.getElementById('confirm-payment-button');
    const amountValue = parseInt(amount);

    // Validasi parameter dari URL
    if (!santriId || isNaN(amountValue) || amountValue <= 0) {
        content.innerHTML = `<p class="p-8 text-center text-red-500">Data top-up tidak valid.</p>`;
        if(confirmButton) confirmButton.disabled = true;
        return;
    }
    
    // Atur tombol kembali ke halaman pemilihan nominal
    const backButtonContainer = document.getElementById('header-container');
    backButtonContainer.querySelector('a').href = `#topup/${santriId}`;

    try {
        const session = getSession();
        // Ambil semua data yang diperlukan secara bersamaan
        const [santriListResponse, settingsResponse] = await Promise.all([
            getSantriList(session.user.santri),
            getAdminSettings()
        ]);

        const santriProfile = santriListResponse.data.find(s => s.id === santriId);
        const settings = settingsResponse.data;

        if (!santriProfile) {
            throw new Error('Profil santri tidak ditemukan.');
        }

        const serviceFee = settings.biaya_layanan_spp || 2500;
        const grandTotal = amountValue + serviceFee;
        
        // Mock data kelas karena tidak ada di 'detail' user-end
        const mockKelas = santriId.includes('ahmad-zaki') ? "1 Tsanawiyah A" : "2 Aliyah B";

        // Tampilkan informasi detail santri
        document.getElementById('payment-santri-avatar').src = santriProfile.avatar;
        document.getElementById('payment-santri-name').textContent = santriProfile.name;
        document.getElementById('payment-santri-details').textContent = `NIS: ${santriProfile.nis} | Kelas: ${mockKelas}`;

        // Tampilkan data rincian pembayaran
        document.getElementById('payment-subtotal').textContent = `Rp ${amountValue.toLocaleString('id-ID')}`;
        document.getElementById('payment-service-fee').textContent = `Rp ${serviceFee.toLocaleString('id-ID')}`;
        document.getElementById('payment-grand-total').textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;
        
        // Tampilkan konten asli setelah semua data siap
        document.getElementById('payment-skeleton-loader').classList.add('hidden');
        document.getElementById('payment-real-content').classList.remove('hidden');

        // Tambahkan event listener untuk tombol konfirmasi
        confirmButton.addEventListener('click', async () => {
            confirmButton.textContent = 'Memproses...';
            confirmButton.disabled = true;

            try {
                // 1. Panggil API untuk membuat transaksi 'pending'
                const response = await processTopUp(santriId, amountValue);
                
                // 2. Jika berhasil, panggil simulasi konfirmasi pembayaran
                if (response.status === 'pending' && response.data.transactionId) {
                    completeMockTopUp(santriId, response.data.transactionId);
                }

                // 3. Beri notifikasi ke pengguna dan arahkan ke halaman riwayat
                alert(`Permintaan top-up sebesar Rp ${amountValue.toLocaleString('id-ID')} untuk ananda ${santriProfile.name} sedang diproses. Status akan diperbarui otomatis.`);
                
                window.location.hash = '#riwayat';

            } catch (error) {
                alert(`Gagal memproses top-up: ${error.message}`);
                confirmButton.textContent = 'Konfirmasi & Bayar';
                confirmButton.disabled = false;
            }
        });

    } catch (error) {
        console.error("Gagal memuat halaman konfirmasi top-up:", error);
        content.innerHTML = `<p class="p-8 text-center text-red-500">${error.message}</p>`;
        if(confirmButton) confirmButton.disabled = true;
    }
}
