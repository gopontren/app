// src/pages/js/pembayaran.js
// [PEMBARUAN] Menambahkan logika untuk menampilkan detail santri (nama, NIS, kelas).

import { getSantriDetail, processPayment, getAdminSettings, getSantriList } from '/src/services/api.js';
import { getSession } from '/src/services/state.js';

// Fungsi utama yang dipanggil oleh router
export default async function initPembayaran(santriId, tagihanId) {
    const content = document.getElementById('payment-content');
    const confirmButton = document.getElementById('confirm-payment-button');

    // Cek apakah santriId dan tagihanId ada di URL
    if (!santriId || !tagihanId) {
        content.innerHTML = `<p class="p-8 text-center text-red-500">ID Santri atau Tagihan tidak valid.</p>`;
        if(confirmButton) confirmButton.disabled = true;
        return;
    }

    try {
        const session = getSession();
        // Ambil semua data yang diperlukan secara bersamaan untuk efisiensi
        const [detailResponse, settingsResponse, santriListResponse] = await Promise.all([
            getSantriDetail(santriId),
            getAdminSettings(),
            getSantriList(session.user.santri) // Kita butuh ini untuk data profil (nama, avatar)
        ]);
        
        const tagihan = detailResponse.data.keuangan?.tagihan.find(t => t.id === tagihanId);
        const settings = settingsResponse.data;
        const santriProfile = santriListResponse.data.find(s => s.id === santriId);
        
        // Mock data kelas karena tidak ada di 'detail' user-end, kita ambil dari struktur admin
        // Di aplikasi nyata, data ini seharusnya sudah termasuk dalam satu panggilan API.
        const mockKelas = santriId.includes('ahmad-zaki') ? "1 Tsanawiyah A" : "2 Aliyah B";

        if (!tagihan || !santriProfile) {
            throw new Error('Detail tagihan atau profil santri tidak ditemukan.');
        }

        const serviceFee = settings.biaya_layanan_spp || 0;
        const grandTotal = tagihan.amount + serviceFee;

        // Tampilkan informasi detail santri
        document.getElementById('payment-santri-avatar').src = santriProfile.avatar;
        document.getElementById('payment-santri-name').textContent = santriProfile.name;
        document.getElementById('payment-santri-details').textContent = `NIS: ${santriProfile.nis} | Kelas: ${mockKelas}`;

        // Tampilkan data rincian pembayaran
        document.getElementById('payment-title').textContent = tagihan.title;
        document.getElementById('payment-subtotal').textContent = `Rp ${tagihan.amount.toLocaleString('id-ID')}`;
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
                // Panggil API simulasi pembayaran dengan santriId dan tagihanId yang benar
                await processPayment(santriId, tagihanId);
                
                // Beri notifikasi sukses dan arahkan kembali
                alert(`Pembayaran untuk "${tagihan.title}" atas nama ananda ${santriProfile.name} berhasil!`);
                window.location.hash = '#tagihan';

            } catch (error) {
                alert(`Gagal memproses pembayaran: ${error.message}`);
                confirmButton.textContent = 'Konfirmasi Pembayaran';
                confirmButton.disabled = false;
            }
        });

    } catch (error) {
        console.error("Gagal memuat halaman pembayaran:", error);
        content.innerHTML = `<p class="p-8 text-center text-red-500">${error.message}</p>`;
        if(confirmButton) confirmButton.disabled = true;
    }
}

