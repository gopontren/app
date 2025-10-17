// src/pages/js/riwayat.js
// [PEMBARUAN BESAR]
// - Mengubah semua fungsi 'renderers' untuk menggunakan <template> dari riwayat.html.
// - [BARU] Logika untuk menampilkan status 'Pending' pada riwayat top-up.
// - [BARU] Logika untuk auto-refresh data jika ada transaksi pending.

import { getSantriList, getSantriDetail } from '../../services/api.js';
import { getSession, getActiveSantriId, setActiveSantri } from '../../services/state.js';
import { initSantriSwitcher } from '/src/components/SantriSwitcher.js';
import { createListItemSkeleton } from '/src/components/SkeletonLoader.js';

// --- State Halaman ---
let allSantriProfiles = [];
let currentSantriProfile = null;
let santriDetailData = null;
let activeFilter = 'pembayaran';
let isAutoRefreshing = false; // Flag untuk mencegah beberapa loop refresh

// Helper
const formatDate = (isoString) => new Date(isoString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

/**
 * Memuat data riwayat untuk santri yang dipilih dan merender ulang.
 */
async function loadRiwayatForSantri(santriId) {
    if (!isAutoRefreshing) {
        document.getElementById('riwayat-list').innerHTML = createListItemSkeleton(2);
    }
    try {
        const detailResponse = await getSantriDetail(santriId);
        currentSantriProfile = allSantriProfiles.find(s => s.id === santriId);
        santriDetailData = detailResponse.data;
        if (santriDetailData.activityLog) {
            santriDetailData.activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        setActiveSantri(santriId);
        
        switchTab(activeFilter);
        setupEventListeners(); // Inisialisasi ulang switcher dengan data baru

        // [BARU] Periksa transaksi pending dan atur auto-refresh
        const hasPending = (santriDetailData.activityLog || []).some(log => log.type === 'topup_saldo' && log.status === 'pending');
        if (hasPending && !isAutoRefreshing) {
            isAutoRefreshing = true;
            setTimeout(() => {
                loadRiwayatForSantri(santriId);
                isAutoRefreshing = false; // Reset flag setelah refresh
            }, 6000); // Refresh setelah 6 detik untuk memberi waktu API mock
        }

    } catch (error) {
        console.error(`Gagal memuat data riwayat untuk santri ${santriId}:`, error);
        document.getElementById('riwayat-list').innerHTML = `<p class="text-center text-red-500 p-4">Gagal memuat data riwayat.</p>`;
    }
}

/**
 * Fungsi helper untuk merender pesan 'kosong'.
 */
function renderEmptyMessage(container, message) {
    const template = document.getElementById('riwayat-empty-template');
    if (!template) {
        container.innerHTML = `<p class="text-center text-slate-500 p-4">${message}</p>`;
        return;
    }
    const clone = template.content.cloneNode(true);
    clone.querySelector('p').textContent = message;
    container.appendChild(clone);
}

// Kumpulan fungsi untuk merender konten setiap tab menggunakan <template>
const renderers = {
    pembayaran: (container) => {
        const template = document.getElementById('riwayat-pembayaran-template');
        const paidTagihan = (santriDetailData.keuangan?.tagihan || []).filter(t => t.status === 'paid');
        const pembayaranLog = (santriDetailData.activityLog || []).filter(log => log.type === 'catat_spp');

        if (paidTagihan.length === 0) {
            renderEmptyMessage(container, "Belum ada riwayat pembayaran tagihan.");
            return;
        }

        paidTagihan.forEach(item => {
            const clone = template.content.cloneNode(true);
            const paymentLog = pembayaranLog.find(log => log.metadata.tagihanId === item.id);
            const paymentDate = paymentLog ? formatDate(paymentLog.timestamp) : 'Tidak diketahui';
            
            clone.querySelector('.riwayat-title').textContent = item.title;
            clone.querySelector('.riwayat-meta').textContent = `Dibayar pada ${paymentDate}`;
            clone.querySelector('.riwayat-amount').textContent = `Rp ${item.amount.toLocaleString('id-ID')}`;
            container.appendChild(clone);
        });
    },
    // [DIUBAH] Logika untuk render top-up diperbarui untuk menangani status
    topup: (container) => {
        const template = document.getElementById('riwayat-topup-template');
        const topupLog = (santriDetailData.activityLog || []).filter(log => log.type === 'topup_saldo');
        
        if (topupLog.length === 0) {
            renderEmptyMessage(container, "Belum ada riwayat top-up saldo.");
            return;
        }

        topupLog.forEach(item => {
            const clone = template.content.cloneNode(true);
            const titleEl = clone.querySelector('.riwayat-title');
            const amountEl = clone.querySelector('.riwayat-amount');

            titleEl.textContent = item.title;
            clone.querySelector('.riwayat-meta').textContent = `Pada ${formatDate(item.timestamp)} via ${item.metadata.method}`;
            amountEl.textContent = `+ Rp ${item.metadata.amount.toLocaleString('id-ID')}`;

            if (item.status === 'paid') {
                amountEl.classList.add('text-emerald-600');
            } else { // Status 'pending'
                titleEl.textContent += ' (Pending)';
                amountEl.classList.add('text-amber-600');
            }
            
            container.appendChild(clone);
        });
    },
    gokop: (container) => {
        const onlineTemplate = document.getElementById('riwayat-gokop-online-template');
        const jajanTemplate = document.getElementById('riwayat-gokop-jajan-template');

        const onlineClone = onlineTemplate.content.cloneNode(true);
        container.appendChild(onlineClone);

        const riwayatJajan = santriDetailData.goKop?.riwayat || [];
        if (riwayatJajan.length > 0) {
             const heading = document.createElement('h3');
             heading.className = "text-base font-bold text-slate-800 px-1 mt-4 mb-2";
             heading.textContent = "Riwayat Jajan Santri";
             container.appendChild(heading);

            riwayatJajan.forEach(item => {
                const jajanClone = jajanTemplate.content.cloneNode(true);
                jajanClone.querySelector('.riwayat-title').textContent = item.item;
                jajanClone.querySelector('.riwayat-meta').textContent = item.date;
                jajanClone.querySelector('.riwayat-amount').textContent = `- Rp ${item.amount.toLocaleString('id-ID')}`;
                container.appendChild(jajanClone);
            });
        } else {
             const emptyContainer = document.createElement('div');
             renderEmptyMessage(emptyContainer, "Belum ada riwayat jajan santri di koperasi.");
             container.appendChild(emptyContainer.firstElementChild);
        }
    }
};

/**
 * Mengatur UI tab dan merender konten yang sesuai.
 */
function switchTab(filter) {
    activeFilter = filter;
    const listContainer = document.getElementById('riwayat-list');
    listContainer.innerHTML = ''; 

    document.querySelectorAll('.riwayat-btn').forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('bg-white', isActive);
        btn.classList.toggle('text-emerald-600', isActive);
        btn.classList.toggle('shadow-sm', isActive);
        btn.classList.toggle('text-slate-500', !isActive);
    });

    if (renderers[filter]) {
        const fragment = document.createDocumentFragment();
        renderers[filter](fragment);
        listContainer.appendChild(fragment);
        lucide.createIcons();
    }
}

/**
 * Menangani semua event listener untuk halaman ini.
 */
function setupEventListeners() {
    const switcherContainer = document.getElementById('santri-switcher-container');
    if (switcherContainer.dataset.initialized) return;
    switcherContainer.dataset.initialized = 'true';

    initSantriSwitcher({
        switcherContainerId: 'santri-switcher-container',
        modalId: 'santri-selection-modal',
        modalContentId: 'santri-modal-content',
        modalListId: 'santri-modal-list',
        closeModalBtnId: 'close-santri-modal-btn',
        currentSantri: currentSantriProfile,
        allSantri: allSantriProfiles,
        onSantriChange: (newSantriId) => {
            loadRiwayatForSantri(newSantriId);
        }
    });

    document.querySelectorAll('.riwayat-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.filter));
    });
}

// Fungsi utama yang dipanggil oleh router
export default async function initRiwayat() {
    try {
        const session = getSession();
        if (!session) throw new Error("Sesi tidak ditemukan.");
        const santriListResponse = await getSantriList(session.user.santri);
        allSantriProfiles = santriListResponse.data;
        if (allSantriProfiles.length === 0) throw new Error("Tidak ada data santri.");
        
        const activeSantriId = getActiveSantriId();
        await loadRiwayatForSantri(activeSantriId);
        
    } catch (error) {
        console.error("Gagal menginisialisasi halaman riwayat:", error);
        document.getElementById('app-content').innerHTML = `<p class="p-8 text-center text-red-500">${error.message}</p>`;
    }
}
