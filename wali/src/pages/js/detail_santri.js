// src/pages/js/detail_santri.js
// [PEMBARUAN BESAR]
// - Logika rendering dirombak total untuk menggunakan <template> dari file HTML.
// - Menghapus semua pembuatan string HTML dari JavaScript.
// - Kode menjadi jauh lebih bersih, deklaratif, dan mudah dikelola.

import { getSantriList, getSantriDetail } from '/src/services/api.js';
import { getSession, getActiveSantriId } from '/src/services/state.js';

// Helper untuk format tanggal
const formatDate = (isoString) => new Date(isoString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
const formatTime = (isoString) => new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

// Helper untuk ikon berdasarkan tipe aktivitas
const getActivityIcon = (type) => {
    const icons = {
        'absensi_sholat': 'moon-star',
        'absensi_ngaji': 'book-open-check',
        'setoran_hafalan': 'book-marked',
        'catat_spp': 'wallet',
        'pemeriksaan_kesehatan': 'heart-pulse',
        'default': 'clipboard-list'
    };
    return icons[type] || icons['default'];
};

/**
 * [BARU] Fungsi helper generik untuk merender daftar dari template.
 * @param {string} containerId - ID kontainer tempat item akan dirender.
 * @param {string} templateId - ID template yang akan digunakan.
 * @param {Array} data - Array data untuk dirender.
 * @param {Function} populator - Fungsi yang mengisi data ke dalam satu klon template.
 * @param {string} [emptyMessage] - Pesan yang ditampilkan jika data kosong.
 */
function renderListFromTemplate(containerId, templateId, data, populator, emptyMessage) {
    const container = document.getElementById(containerId);
    const template = document.getElementById(templateId);
    if (!container || !template) return;

    container.innerHTML = '';
    if (data.length === 0) {
        container.innerHTML = `<p class="text-center text-slate-500 p-4">${emptyMessage}</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const clone = template.content.cloneNode(true);
        populator(clone, item);
        fragment.appendChild(clone);
    });

    container.appendChild(fragment);
}


// Kumpulan fungsi untuk merender konten setiap tab dari activityLog
const renderers = {
    /**
     * [DIUBAH] Merender konten untuk tab Hafalan menggunakan template.
     */
    hafalan: (activityLog) => {
        const hafalanLog = activityLog.filter(log => log.type === 'setoran_hafalan');
        const summaryTemplate = document.getElementById('hafalan-summary-template');
        let finalHTML = '';

        if (hafalanLog.length > 0 && summaryTemplate) {
            const clone = summaryTemplate.content.cloneNode(true);
            const latest = hafalanLog[0];
            const totalJuzUnik = [...new Set(hafalanLog.map(l => l.metadata.juz))].length;
            
            clone.querySelector('.summary-juz').textContent = totalJuzUnik;
            clone.querySelector('.summary-surat').textContent = hafalanLog.length;
            clone.querySelector('.summary-terakhir').textContent = latest.metadata.surat;
            
            const div = document.createElement('div');
            div.appendChild(clone);
            finalHTML += div.innerHTML;
        }
        
        const listContainer = document.createElement('div');
        listContainer.className = 'space-y-3';
        listContainer.innerHTML = `<h3 class="font-bold text-slate-700 px-1 mb-2 mt-4">Riwayat Setoran</h3>`;
        
        renderListFromTemplate(
            'detail-content-container', // Render langsung ke kontainer utama
            'hafalan-item-template',
            hafalanLog,
            (clone, item) => {
                clone.querySelector('.hafalan-surat').textContent = `Surat ${item.metadata.surat}`;
                clone.querySelector('.hafalan-info').textContent = `Dicatat oleh: ${item.recordedBy} pada ${formatDate(item.timestamp)}`;
                const nilaiEl = clone.querySelector('.hafalan-nilai');
                nilaiEl.textContent = item.metadata.nilai;
                nilaiEl.className = `hafalan-nilai text-sm font-semibold ${item.metadata.nilai.includes('Lancar') ? 'text-emerald-600' : 'text-amber-600'}`;
            },
            'Belum ada riwayat setoran hafalan.'
        );
        
        return finalHTML + document.getElementById('detail-content-container').innerHTML;
    },

    /**
     * [DIUBAH] Merender konten untuk tab Keuangan menggunakan template.
     */
    keuangan: (data) => {
        const tagihan = data.keuangan?.tagihan || [];
        const pembayaranLog = data.activityLog.filter(log => log.type === 'catat_spp');
        
        renderListFromTemplate(
            'detail-content-container',
            'keuangan-item-template',
            tagihan,
            (clone, item) => {
                const isPaid = item.status === 'paid';
                const statusEl = clone.querySelector('.keuangan-status');
                const paidStatusEl = clone.querySelector('.keuangan-paid-status');
                
                clone.querySelector('.keuangan-title').textContent = item.title;
                clone.querySelector('.keuangan-amount').textContent = `Rp ${item.amount.toLocaleString('id-ID')}`;

                if (isPaid) {
                    const paymentDetail = pembayaranLog.find(p => p.metadata.tagihanId === item.id);
                    statusEl.textContent = `Lunas via ${paymentDetail?.recordedBy || 'sistem'}`;
                    statusEl.className = 'keuangan-status text-sm text-slate-500';
                    paidStatusEl.textContent = 'Lunas';
                    paidStatusEl.className = 'keuangan-paid-status text-xs text-emerald-600';
                } else {
                    statusEl.textContent = `Jatuh Tempo: ${formatDate(item.due_date)}`;
                    statusEl.className = 'keuangan-status text-sm text-red-500';
                    paidStatusEl.textContent = 'Belum Lunas';
                    paidStatusEl.className = 'keuangan-paid-status text-xs text-red-600';
                }
            },
            'Tidak ada data tagihan.'
        );
        return `<h3 class="font-bold text-slate-700 px-1 mb-2">Daftar Tagihan</h3>` + document.getElementById('detail-content-container').innerHTML;
    },
    
    /**
     * [DIUBAH] Merender konten untuk tab Absensi menggunakan template.
     */
    absensi: (activityLog) => {
        const absensiLog = activityLog.filter(log => log.type.startsWith('absensi_'));
        renderListFromTemplate(
            'detail-content-container',
            'absensi-item-template',
            absensiLog,
            (clone, item) => {
                const statusColor = item.metadata.status === 'Hadir' ? 'text-emerald-600' : 'text-amber-600';
                clone.querySelector('.absensi-icon').setAttribute('data-lucide', getActivityIcon(item.type));
                clone.querySelector('.absensi-title').textContent = item.title;
                clone.querySelector('.absensi-info').textContent = `${formatDate(item.timestamp)} - ${formatTime(item.timestamp)} oleh ${item.recordedBy}`;
                const statusEl = clone.querySelector('.absensi-status');
                statusEl.textContent = item.metadata.status;
                statusEl.className = `absensi-status text-sm font-semibold ${statusColor}`;
            },
            'Belum ada riwayat absensi.'
        );
        return `<h3 class="font-bold text-slate-700 px-1 mb-2">Riwayat Kehadiran</h3>` + document.getElementById('detail-content-container').innerHTML;
    },

    /**
     * [DIUBAH] Merender konten untuk tab Kesehatan menggunakan template.
     */
    kesehatan: (activityLog) => {
        const kesehatanLog = activityLog.filter(log => log.type === 'pemeriksaan_kesehatan');
        renderListFromTemplate(
            'detail-content-container',
            'kesehatan-item-template',
            kesehatanLog,
            (clone, item) => {
                clone.querySelector('.kesehatan-info').textContent = `${formatDate(item.timestamp)} oleh ${item.recordedBy}`;
                clone.querySelector('.kesehatan-suhu').textContent = item.metadata.suhu;
                clone.querySelector('.kesehatan-keluhan').textContent = item.metadata.keluhan;
                clone.querySelector('.kesehatan-tindakan').textContent = item.metadata.tindakan;
            },
            'Belum ada riwayat pemeriksaan kesehatan.'
        );
        return `<h3 class="font-bold text-slate-700 px-1 mb-2">Riwayat Kesehatan</h3>` + document.getElementById('detail-content-container').innerHTML;
    },
};

// Fungsi utama yang dipanggil oleh router
export default async function initDetailSantri(santriId, initialTab) {
    const contentContainer = document.getElementById('detail-content-container');
    const tabContainer = document.getElementById('detail-nav');
    
    try {
        const session = getSession();
        if (!session) throw new Error("Sesi tidak ditemukan.");

        const activeSantriId = santriId || getActiveSantriId();
        if (!activeSantriId) throw new Error("Tidak ada santri aktif yang bisa ditampilkan.");

        const [santriListResponse, detailResponse] = await Promise.all([
            getSantriList(session.user.santri),
            getSantriDetail(activeSantriId)
        ]);

        const santriProfile = santriListResponse.data.find(s => s.id === activeSantriId);
        const santriDetails = detailResponse.data;
        const sortedActivityLog = (santriDetails.activityLog || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        santriDetails.activityLog = sortedActivityLog;

        document.getElementById('detail-santri-avatar').src = santriProfile.avatar;
        document.getElementById('detail-santri-name').textContent = santriProfile.name;
        document.getElementById('detail-santri-nis').textContent = `NIS: ${santriProfile.nis}`;

        const switchTab = (tabKey) => {
            tabContainer.querySelectorAll('button').forEach(btn => {
                const isActive = btn.dataset.content === tabKey;
                btn.classList.toggle('bg-emerald-500', isActive);
                btn.classList.toggle('text-white', isActive);
                btn.classList.toggle('shadow-md', isActive);
                btn.classList.toggle('text-slate-500', !isActive);
            });
            
            contentContainer.innerHTML = ''; // Kosongkan kontainer sebelum merender
            if (renderers[tabKey]) {
                const contentHTML = (tabKey === 'keuangan') ? renderers[tabKey](santriDetails) : renderers[tabKey](santriDetails.activityLog);
                contentContainer.innerHTML = contentHTML;
            }
            lucide.createIcons();
        };

        tabContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.content));
        });

        const finalInitialTab = initialTab && renderers[initialTab] ? initialTab : 'hafalan';
        switchTab(finalInitialTab);

    } catch (error) {
        console.error("Gagal memuat detail santri:", error);
        contentContainer.innerHTML = `<p class="text-center text-red-500 p-8">${error.message}</p>`;
        if(tabContainer) tabContainer.classList.add('hidden');
    }
}
