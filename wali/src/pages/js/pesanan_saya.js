// src/pages/js/pesanan_saya.js
// [PEMBARUAN BESAR]
// - Mengubah fungsi renderOrderHistory untuk menggunakan <template> dari pesanan_saya.html.
// - Kode rendering menjadi lebih bersih dan terstruktur.

import { getMyOrders } from '/src/services/api.js';

/**
 * Mendapatkan style (warna dan ikon) berdasarkan status pesanan.
 */
function getStatusStyle(status) {
    switch (status.toLowerCase()) {
        case 'menunggu pengambilan':
            return { text: 'text-sky-800', bg: 'bg-sky-100', icon: 'package-search' };
        case 'dalam_pengantaran_internal':
            return { text: 'text-amber-800', bg: 'bg-amber-100', icon: 'truck' };
        case 'siap diambil':
            return { text: 'text-indigo-800', bg: 'bg-indigo-100', icon: 'archive' };
        case 'selesai':
            return { text: 'text-emerald-800', bg: 'bg-emerald-100', icon: 'package-check' };
        case 'batal':
            return { text: 'text-red-800', bg: 'bg-red-100', icon: 'package-x' };
        default:
            return { text: 'text-slate-800', bg: 'bg-slate-100', icon: 'package' };
    }
}

/**
 * [DIUBAH] Merender daftar pesanan ke dalam kontainer menggunakan <template>.
 * @param {Array} orders - Daftar pesanan dari API.
 */
function renderOrderHistory(orders) {
    const container = document.getElementById('order-history-container');
    const template = document.getElementById('order-history-item-template');
    if (!container || !template) return;
    
    const skeleton = document.getElementById('order-history-skeleton');
    if(skeleton) skeleton.classList.add('hidden');

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 text-slate-500">
                <i data-lucide="package-x" class="w-16 h-16 mx-auto text-slate-300"></i>
                <p class="mt-4 font-semibold">Anda belum pernah membuat pesanan.</p>
                <p class="text-sm">Semua pesanan Anda akan muncul di sini.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const fragment = document.createDocumentFragment();
    orders.forEach(order => {
        const clone = template.content.cloneNode(true);
        const statusStyle = getStatusStyle(order.status);
        
        const itemsSummary = (order.details?.ordersByStore || [])
            .flatMap(store => store.items)
            .map(item => `${item.quantity}x ${item.name}`)
            .join(', ');

        const orderDate = new Date(order.date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        clone.querySelector('.order-id').textContent = order.id;
        clone.querySelector('.order-meta').textContent = `${orderDate} • ${order.santriName}`;
        
        const statusBadge = clone.querySelector('.order-status');
        statusBadge.classList.add(statusStyle.bg, statusStyle.text);
        clone.querySelector('.order-status-icon').setAttribute('data-lucide', statusStyle.icon);
        clone.querySelector('.order-status-text').textContent = order.status;

        clone.querySelector('.order-items-summary').textContent = itemsSummary;
        clone.querySelector('.order-total').textContent = `Rp ${order.details.summary.grandTotal.toLocaleString('id-ID')}`;

        fragment.appendChild(clone);
    });

    container.innerHTML = ''; // Hapus skeleton
    container.appendChild(fragment);
    lucide.createIcons();
}


// Fungsi utama yang dipanggil oleh router
export default async function initPesananSaya() {
    try {
        const response = await getMyOrders();
        // Pastikan orders memiliki struktur yang benar, terutama untuk 'details'
        const orders = response.data.filter(o => o.details && o.details.summary);
        renderOrderHistory(orders);
    } catch (error) { // [PERBAIKAN] Menambahkan kurung kurawal yang hilang
        console.error("Gagal memuat riwayat pesanan:", error);
        const container = document.getElementById('order-history-container');
        if (container) {
            container.innerHTML = `<p class="p-8 text-center text-red-500">Gagal memuat riwayat pesanan.</p>`;
        }
    }
}
