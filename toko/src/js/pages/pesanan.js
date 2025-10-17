import { getOnlineOrders, updateOrderStatus, cancelOrder } from '../api.js';
import { getProducts as getProductsFromStore } from '../store.js';
import { formatCurrency, formatDateTime, showNotification, updateBadges as updateGlobalBadges, showConfirmationModal, closeConfirmModal } from '../ui.js';
import { ORDER_STATUSES } from '../config.js';

// --- STATE MANAGEMENT ---
let orders = [];
let currentOrderTab = ORDER_STATUSES[0];

// --- RENDER FUNCTIONS ---
const renderOnlineOrders = () => {
    const products = getProductsFromStore();
    const container = document.getElementById('order-list-container');
    container.innerHTML = '';
    const filteredOrders = orders.filter(o => o.status === currentOrderTab).sort((a,b) => new Date(b.date) - new Date(a.date));

    if (filteredOrders.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-12">Tidak ada pesanan di kategori ini.</p>`;
        return;
    }

    filteredOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'border rounded-lg p-4 transition-all hover:shadow-md';
        
        const itemsHtml = `
            <table class="w-full text-left mt-2">
                <thead><tr class="text-xs text-gray-500"><th class="pb-1 font-normal">Item</th><th class="pb-1 font-normal text-center">Qty</th><th class="pb-1 font-normal text-right">Subtotal</th></tr></thead>
                <tbody>
                    ${order.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const price = product ? product.price : 0;
                        return `<tr><td class="text-sm">${product ? product.name : 'Produk Dihapus'}</td><td class="text-sm text-center">${item.qty}</td><td class="text-sm text-right">${formatCurrency(item.qty * price)}</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        const deliveryHtml = order.deliveryOption === 'pengiriman_toko'
            ? `<span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Pengiriman Toko</span>`
            : `<span class="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Antar ke Drop Point</span>`;
        
        const receiverHtml = order.status === 'selesai' && order.receiverName
            ? `<p class="text-xs text-gray-500 mt-1">Diterima oleh: <strong class="text-gray-700">${order.receiverName}</strong></p>`
            : '';

        // [PERUBAHAN] Logika tombol aksi disesuaikan dengan alur baru
        let actionsHtml = '';
        if (order.status === 'baru') {
            actionsHtml = `<button data-action="diproses" data-order-id="${order.id}" class="update-order-btn bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600">Proses Pesanan</button> <button data-action="batal" data-order-id="${order.id}" class="update-order-btn bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600">Tolak</button>`;
        } else if (order.status === 'diproses') {
            actionsHtml = `<button data-action="siap_diambil" data-order-id="${order.id}" class="update-order-btn bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Tandai Siap Diambil</button>`;
        } else if (order.status === 'siap_diambil') {
            actionsHtml = `<span class="text-sm font-semibold text-green-600">Menunggu Petugas Drop Point</span>`;
        } else if (order.status === 'dalam_pengantaran_internal') {
            actionsHtml = `<span class="text-sm font-semibold text-sky-600">Diantar oleh Petugas</span>`;
        } else if (order.status === 'sedang_diantar') {
            actionsHtml = `<button data-action="selesai" data-order-id="${order.id}" class="update-order-btn bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">Selesaikan Pesanan</button>`;
        }
        
        const ordererDetailHtml = `
            <p class="text-sm text-gray-600">
                <span class="font-semibold">Pemesan:</span> ${order.waliName}
            </p>
            <p class="text-sm text-gray-600">
                <span class="font-semibold">Untuk:</span> ${order.santriName}
            </p>
        `;

        orderCard.innerHTML = `
            <div class="flex flex-wrap justify-between items-start gap-2">
                <div>
                    <p class="font-bold text-lg">${order.id}</p>
                    ${ordererDetailHtml} 
                    <p class="text-sm text-gray-400 mt-1">${formatDateTime(new Date(order.date))}</p>
                </div>
                <div class="text-right">
                   <p class="font-bold text-lg">${formatCurrency(order.total)}</p>
                   ${deliveryHtml}
                   ${receiverHtml}
                </div>
            </div>
            <div class="mt-4 border-t pt-2">
                ${itemsHtml}
                <div class="mt-4 text-right space-x-2">${actionsHtml}</div>
            </div>
        `;
        container.appendChild(orderCard);
    });
    
    container.querySelectorAll('.update-order-btn').forEach(btn => btn.addEventListener('click', handleUpdateStatus));
};

const updateTabBadges = () => {
    ORDER_STATUSES.forEach(status => {
        const count = orders.filter(o => o.status === status).length;
        const badge = document.getElementById(`badge-${status}`);
        if(badge) badge.textContent = count;
    });
};

// --- EVENT HANDLERS ---
const handleTabClick = (e) => {
    const tabButton = e.target.closest('.order-tab-btn');
    if (!tabButton) return;
    currentOrderTab = tabButton.dataset.status;
    const activeClasses = ['text-blue-600', 'bg-blue-50', 'border-blue-600'];
    const inactiveClasses = ['text-gray-500', 'border-transparent', 'hover:text-blue-600', 'hover:bg-blue-50'];
    document.querySelectorAll('.order-tab-btn').forEach(btn => {
        btn.classList.remove(...activeClasses);
        btn.classList.add(...inactiveClasses);
    });
    tabButton.classList.remove(...inactiveClasses);
    tabButton.classList.add(...activeClasses);
    renderOnlineOrders();
};

const handleUpdateStatus = async (e) => {
    const button = e.target;
    const orderId = button.dataset.orderId;
    const action = button.dataset.action;

    const modalOptions = {
        batal: { message: `Anda yakin ingin <strong>menolak</strong> pesanan <strong>${orderId}</strong>? Pelanggan akan diberitahu.` },
        diproses: { message: `Terima pesanan <strong>${orderId}</strong>? <br><br> Anda harus <strong>segera menyiapkan barang</strong>. Pesanan akan pindah ke tab "Diproses".` },
        sedang_diantar: { message: `Kirim pesanan <strong>${orderId}</strong>? <br><br> Pastikan barang <strong>sudah diserahkan ke kurir</strong>.` },
        siap_diambil: { message: `Ubah status <strong>${orderId}</strong> menjadi "Siap Diambil"? <br><br>Aksi ini akan mengirim notifikasi ke <strong>Petugas Drop Point</strong>.` },
        selesai: { message: `Selesaikan pesanan <strong>${orderId}</strong>? <br><br> Pastikan pesanan <strong>telah diterima oleh pelanggan</strong>.`, inputLabel: 'Masukkan Nama Penerima' }
    };

    const options = modalOptions[action];
    if (!options) return;

    options.callback = async (inputValue) => {
        if (action === 'selesai' && (!inputValue || inputValue.length < 3)) {
            showNotification('Nama penerima wajib diisi (min. 3 karakter).', 'error');
            return; 
        }

        try {
            const details = action === 'selesai' ? { receiverName: inputValue } : {};
            if (action === 'batal') {
                await cancelOrder(orderId);
                showNotification(`Pesanan ${orderId} telah ditolak.`, 'success');
            } else {
                await updateOrderStatus(orderId, action, details);
                showNotification(`Status pesanan ${orderId} berhasil diperbarui.`);
            }
            
            closeConfirmModal(); 
            
            orders = await getOnlineOrders();
            renderOnlineOrders();
            updateTabBadges();
            updateGlobalBadges();
        } catch(error) {
            showNotification(error.message, 'error');
            console.error("Gagal update status pesanan:", error);
        }
    };
    
    showConfirmationModal(options);
};

// --- INITIALIZATION ---
export async function init() {
    try {
        orders = await getOnlineOrders();
        renderOnlineOrders();
        updateTabBadges();
        document.getElementById('order-tabs').addEventListener('click', handleTabClick);
    } catch (error) {
        console.error("Gagal memuat halaman pesanan:", error);
        throw new Error('Gagal memuat data pesanan online.');
    }
}
