import { getOnlineOrders, getTransactionHistory } from '../api.js';
import { getProducts as getProductsFromStore } from '../store.js';
import { formatCurrency, formatDateTime } from '../ui.js';

/**
 * Merender kartu ringkasan di bagian atas dashboard.
 */
async function renderSummaryCards() {
    const products = getProductsFromStore();
    const [onlineOrders, transactions] = await Promise.all([
        getOnlineOrders(),
        getTransactionHistory()
    ]);
    
    const todayString = new Date('2025-09-10').toDateString(); // Tanggal demo

    const todayTransactions = transactions.filter(tx => new Date(tx.date).toDateString() === todayString);
    const todaySales = todayTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const todayTxCount = todayTransactions.length;

    const newOrdersCount = onlineOrders.filter(o => o.status === 'baru').length;
    const totalProducts = products.length;

    document.getElementById('dash-penjualan-hari-ini').textContent = formatCurrency(todaySales);
    document.getElementById('dash-transaksi-hari-ini').textContent = todayTxCount;
    document.getElementById('dash-pesanan-baru').textContent = newOrdersCount;
    document.getElementById('dash-total-produk').textContent = totalProducts;
}

/**
 * Merender daftar aktivitas terkini.
 */
async function renderRecentActivity() {
    const container = document.getElementById('recent-activity-list');
    container.innerHTML = '';

    const activities = await getTransactionHistory();
    const recentActivities = activities.slice(0, 10);

    if (recentActivities.length === 0) {
        container.innerHTML = `<p class="text-gray-500 p-4 text-center">Belum ada aktivitas.</p>`;
        return;
    }

    recentActivities.forEach(activity => {
        const isOnlineOrder = activity.id.startsWith('ORD');
        
        const icon = isOnlineOrder
            ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`;
        
        const title = isOnlineOrder 
            ? `Pesanan Online #${activity.id}` 
            : `Transaksi Kasir #${activity.id}`;

        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-3 rounded-md hover:bg-gray-50';
        item.innerHTML = `
            <div class="flex items-center">
                <div class="mr-4">${icon}</div>
                <div>
                    <p class="font-semibold">${title}</p>
                    <p class="text-sm text-gray-500">${formatDateTime(new Date(activity.date))}</p>
                </div>
            </div>
            <div class="font-bold">${formatCurrency(activity.total)}</div>
        `;
        container.appendChild(item);
    });
}

/**
 * Fungsi inisialisasi yang akan dipanggil oleh router.
 */
export async function init() {
    try {
        await Promise.all([
            renderSummaryCards(),
            renderRecentActivity()
        ]);
    } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
        // PERUBAHAN: Lempar error agar ditangkap oleh router
        throw new Error('Gagal memuat data dashboard. Periksa koneksi Anda.');
    }
}
