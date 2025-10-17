// src/pages/js/daftar.js
// [PEMBARUAN BESAR]
// - Mengadopsi komponen SantriSwitcher.js untuk mengelola UI pemilihan santri.
// - Logika rendering diubah untuk menggunakan <template> dari file HTML, bukan string.
// - Menggunakan komponen SkeletonLoader.js untuk tampilan loading yang konsisten.

import { getSantriList, getSantriDetail } from '/src/services/api.js';
import { getSession, getActiveSantriId, setActiveSantri } from '/src/services/state.js';
import { initSantriSwitcher } from '/src/components/SantriSwitcher.js';
import { createListItemSkeleton } from '/src/components/SkeletonLoader.js';

// --- State Halaman ---
let allSantriProfiles = [];
let currentSantriProfile = null;
let allTagihan = [];
let allActivityLog = [];

const formatDate = (isoString) => new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Memuat data tagihan untuk santri yang dipilih dan merender ulang seluruh halaman.
 * @param {string} santriId - ID santri yang datanya akan dimuat.
 */
async function loadTagihanForSantri(santriId) {
    document.getElementById('tagihan-list').innerHTML = createListItemSkeleton(2);

    try {
        const detailResponse = await getSantriDetail(santriId);
        currentSantriProfile = allSantriProfiles.find(s => s.id === santriId);

        allTagihan = detailResponse.data.keuangan?.tagihan || [];
        allActivityLog = detailResponse.data.activityLog || [];
        
        setActiveSantri(santriId);
        
        renderSummary();
        updateTabUI('unpaid');
        renderTagihanList('unpaid');
        
        setupEventListeners();

    } catch (error) {
        console.error(`Gagal memuat data untuk santri ${santriId}:`, error);
        document.getElementById('tagihan-list').innerHTML = `<p class="text-center text-red-500 p-4">Gagal memuat data tagihan.</p>`;
    }
}

/**
 * Merender ringkasan total tagihan.
 */
function renderSummary() {
    const unpaidTagihan = allTagihan.filter(t => t.status === 'unpaid');
    const total = unpaidTagihan.reduce((sum, item) => sum + item.amount, 0);
    document.getElementById('total-tagihan').textContent = `Rp ${total.toLocaleString('id-ID')}`;

    if (unpaidTagihan.length > 0) {
        const nearestDueDate = unpaidTagihan.reduce((nearest, current) => 
            new Date(current.due_date) < new Date(nearest.due_date) ? current : nearest
        );
        document.getElementById('jatuh-tempo').textContent = formatDate(nearestDueDate.due_date);
    } else {
        document.getElementById('jatuh-tempo').textContent = 'Tidak ada';
    }
}

/**
 * [DIUBAH] Merender daftar tagihan berdasarkan filter menggunakan <template>.
 */
function renderTagihanList(filter) {
    const listContainer = document.getElementById('tagihan-list');
    const template = document.getElementById('tagihan-item-template');
    if (!listContainer || !template) return;

    const filteredData = allTagihan.filter(t => t.status === filter);
    listContainer.innerHTML = '';

    if (filteredData.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-slate-500 p-4">Tidak ada tagihan dalam kategori ini.</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    filteredData.forEach(item => {
        const clone = template.content.cloneNode(true);
        const isUnpaid = item.status === 'unpaid';
        
        const statusEl = clone.querySelector('.tagihan-status');
        const actionEl = clone.querySelector('.tagihan-action');

        clone.querySelector('.tagihan-title').textContent = item.title;
        clone.querySelector('.tagihan-amount').textContent = `Rp ${item.amount.toLocaleString('id-ID')}`;
        
        if (isUnpaid) {
            statusEl.textContent = `Jatuh Tempo: ${formatDate(item.due_date)}`;
            statusEl.className = 'tagihan-status text-sm text-red-500';
            actionEl.innerHTML = `<a href="#bayar/${currentSantriProfile.id}/${item.id}" class="bg-emerald-500 text-white text-sm font-bold py-2 px-4 rounded-full hover:bg-emerald-600 transition">Bayar</a>`;
        } else {
            const paymentInfo = `Lunas melalui ${allActivityLog.find(log => log.metadata.tagihanId === item.id)?.recordedBy || 'Aplikasi'}`;
            statusEl.textContent = paymentInfo;
            statusEl.className = 'tagihan-status text-sm text-slate-500';
            actionEl.innerHTML = `<i data-lucide="check-circle-2" class="text-emerald-500"></i>`;
        }
        
        fragment.appendChild(clone);
    });

    listContainer.appendChild(fragment);
    lucide.createIcons();
}

/**
 * Mengatur status aktif pada tombol tab.
 */
function updateTabUI(filter) {
    document.querySelectorAll('.tagihan-btn').forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('bg-white', isActive);
        btn.classList.toggle('text-emerald-600', isActive);
        btn.classList.toggle('shadow-sm', isActive);
        btn.classList.toggle('text-slate-500', !isActive);
    });
}

/**
 * Menangani semua event listener untuk halaman ini.
 */
function setupEventListeners() {
    initSantriSwitcher({
        switcherContainerId: 'santri-switcher-container',
        modalId: 'santri-selection-modal',
        modalContentId: 'santri-modal-content',
        modalListId: 'santri-modal-list',
        closeModalBtnId: 'close-santri-modal-btn',
        currentSantri: currentSantriProfile,
        allSantri: allSantriProfiles,
        onSantriChange: (newSantriId) => {
            loadTagihanForSantri(newSantriId);
        }
    });
    
    document.querySelectorAll('.tagihan-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            updateTabUI(filter);
            renderTagihanList(filter);
        });
    });
}

// Fungsi utama yang dipanggil oleh router
export default async function initDaftarTagihan() {
    try {
        const session = getSession();
        if (!session) throw new Error("Sesi tidak ditemukan.");

        const santriListResponse = await getSantriList(session.user.santri);
        allSantriProfiles = santriListResponse.data;
        if (allSantriProfiles.length === 0) throw new Error("Tidak ada data santri.");

        const activeSantriId = getActiveSantriId();
        await loadTagihanForSantri(activeSantriId);
        
    } catch (error) {
        console.error("Gagal menginisialisasi halaman tagihan:", error);
        document.getElementById('app-content').innerHTML = `<p class="p-8 text-center text-red-500">${error.message}</p>`;
    }
}
