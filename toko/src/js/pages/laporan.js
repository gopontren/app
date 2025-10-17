import { getComprehensiveReportData, getTransactionHistory } from '../api.js';
import { formatCurrency, formatDateTime, showNotification } from '../ui.js';

// --- STATE & ELEMENT SELECTORS ---
const periodSelector = document.getElementById('report-period');
const financialSummaryTitle = document.getElementById('financial-summary-title');
let salesChart = null;
let categorySalesChart = null;

// --- RENDER FUNCTIONS ---
// PERBAIKAN: Fungsi ini sekarang akan membangun ulang seluruh kartu, bukan hanya mengisi teks.
const renderFinancialSummary = (financialSummary) => {
    const container = document.getElementById('financial-summary-cards');
    if (!container) return;

    // Hapus skeleton loader dan ganti dengan konten asli
    container.innerHTML = `
        <div class="bg-green-600 text-white p-5 rounded-lg shadow-lg col-span-1 lg:col-span-1">
            <h3 class="font-semibold">Laba Bersih</h3>
            <p id="report-net-profit" class="text-2xl font-bold mt-2">${formatCurrency(financialSummary.netProfit)}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md col-span-1">
            <h3 class="text-gray-500">Total Pendapatan</h3>
            <p id="report-total-revenue" class="text-xl font-bold text-blue-600 mt-2">${formatCurrency(financialSummary.totalRevenue)}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md col-span-1">
            <h3 class="text-gray-500">Total Modal (HPP)</h3>
            <p id="report-total-cogs" class="text-xl font-bold text-yellow-600 mt-2">${formatCurrency(financialSummary.totalCOGS)}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md col-span-1">
            <h3 class="text-gray-500">Laba Kotor</h3>
            <p id="report-gross-profit" class="text-xl font-bold text-green-500 mt-2">${formatCurrency(financialSummary.grossProfit)}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md col-span-1">
            <h3 class="text-gray-500">Total Pengeluaran</h3>
            <p id="report-total-expenses" class="text-xl font-bold text-red-500 mt-2">${formatCurrency(financialSummary.totalExpenses)}</p>
        </div>
    `;
};

const renderBestSellers = (bestSellers) => {
    const container = document.getElementById('best-sellers-list');
    container.innerHTML = '';
    if (bestSellers.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-8">Belum ada data penjualan.</p>`;
        return;
    }
    bestSellers.forEach(item => {
        if (!item.product) return;
        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between items-center p-2 rounded-md hover:bg-gray-50';
        itemEl.innerHTML = `
            <div class="flex items-center">
                <img src="${item.product.image}" class="w-10 h-10 rounded-md object-cover mr-3 bg-gray-100">
                <span class="font-semibold">${item.product.name}</span>
            </div>
            <span class="font-bold text-blue-600">${item.quantity} Terjual</span>
        `;
        container.appendChild(itemEl);
    });
};

const renderLowStockProducts = (lowStockProducts) => {
    const container = document.getElementById('low-stock-list');
    container.innerHTML = '';
    if (lowStockProducts.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-8">Semua stok aman.</p>`;
        return;
    }
    lowStockProducts.forEach(product => {
        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between items-center p-2 rounded-md hover:bg-gray-50';
        itemEl.innerHTML = `
             <div class="flex items-center">
                <img src="${product.image}" class="w-10 h-10 rounded-md object-cover mr-3 bg-gray-100">
                <span class="font-semibold">${product.name}</span>
            </div>
            <span class="font-bold text-red-500">Sisa ${product.stock}</span>
        `;
        container.appendChild(itemEl);
    });
};

const renderSalesChart = (transactions) => {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const salesByDay = {};
    transactions.forEach(tx => {
        const date = new Date(tx.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
        salesByDay[date] = (salesByDay[date] || 0) + tx.total;
    });

    const labels = Object.keys(salesByDay).reverse();
    const data = Object.values(salesByDay).reverse();

    if (salesChart) salesChart.destroy();
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Pendapatan', data, backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 1 }] },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { callback: value => formatCurrency(value) } } },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => formatCurrency(context.parsed.y) } } }
        }
    });
};

const renderCategorySalesChart = (salesData) => {
    const ctx = document.getElementById('categorySalesChart').getContext('2d');
    const labels = Object.keys(salesData);
    const data = Object.values(salesData);

    if (categorySalesChart) categorySalesChart.destroy();
    
    ctx.canvas.style.display = labels.length > 0 ? 'block' : 'none';
    if (labels.length === 0) return;

    categorySalesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Pendapatan',
                data,
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: context => `${context.label}: ${formatCurrency(context.parsed)}` } }
            }
        }
    });
};

// --- DATA LOADING & ACTIONS ---
const loadReportData = async () => {
    const periodValue = periodSelector.value;
    let period = { startDate: null, endDate: null };
    let title = 'Semua Waktu';
    const today = new Date('2025-09-10T23:59:59'); // Tanggal demo
    today.setHours(0, 0, 0, 0);

    if (periodValue === 'today') {
        period.startDate = new Date(today);
        period.endDate = new Date(today.getTime());
        period.endDate.setHours(23, 59, 59, 999);
        title = 'Hari Ini';
    } else if (periodValue === 'last7days') {
        period.endDate = new Date(today.getTime());
        period.endDate.setHours(23, 59, 59, 999);
        period.startDate = new Date(today.getTime());
        period.startDate.setDate(today.getDate() - 6);
        title = '7 Hari Terakhir';
    } else if (periodValue === 'this_month') {
        period.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        period.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        period.endDate.setHours(23, 59, 59, 999);
        title = 'Bulan Ini';
    }

    financialSummaryTitle.textContent = `Ringkasan Keuangan (${title})`;

    try {
        const [reportData, allTransactions] = await Promise.all([
            getComprehensiveReportData(period),
            getTransactionHistory()
        ]);
        
        let filteredTransactions = allTransactions;
        if(period.startDate && period.endDate) {
            filteredTransactions = allTransactions.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= period.startDate && txDate <= period.endDate;
            });
        }
        
        renderFinancialSummary(reportData.financialSummary);
        renderBestSellers(reportData.bestSellers);
        renderLowStockProducts(reportData.lowStockProducts);
        renderSalesChart(filteredTransactions);
        renderCategorySalesChart(reportData.salesByCategory);

    } catch (error) {
        console.error("Gagal memuat laporan:", error);
        throw new Error('Gagal memuat data laporan.');
    }
};

const exportTransactionsToCSV = async () => {
    showNotification('Mempersiapkan data ekspor...');
    try {
        const transactions = await getTransactionHistory();
        if (!transactions || transactions.length === 0) {
            showNotification('Tidak ada data transaksi untuk diekspor.', 'error');
            return;
        }

        const headers = ['ID Transaksi', 'Tanggal', 'Tipe', 'Total', 'Metode Pembayaran'];
        const csvRows = [headers.join(',')];

        for (const tx of transactions) {
            const row = [
                tx.id,
                formatDateTime(new Date(tx.date)),
                tx.id.startsWith('ORD') ? 'Online' : 'Kasir',
                tx.total,
                tx.payment ? tx.payment.method : (tx.method || 'Online')
            ];
            csvRows.push(row.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `laporan_transaksi_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        showNotification('Ekspor CSV berhasil diunduh.', 'success');
    } catch (error) {
        showNotification('Gagal mempersiapkan data ekspor.', 'error');
        console.error("CSV Export error:", error);
    }
};


// --- INITIALIZATION ---
export async function init() {
    await loadReportData();
    periodSelector.addEventListener('change', () => loadReportData().catch(err => showNotification(err.message, 'error')));
    document.getElementById('btn-print-report').addEventListener('click', () => window.print());
    document.getElementById('btn-export-csv').addEventListener('click', exportTransactionsToCSV);
}

