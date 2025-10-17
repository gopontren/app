import { getWalletData, requestWithdrawal } from '../api.js';
import { formatCurrency, formatDateTime, showNotification } from '../ui.js';

// --- STATE & ELEMENT SELECTORS ---
let availableBalance = 0;
let fullHistory = { revenue: [], withdrawal: [] };
let currentTab = 'pendapatan';

const tarikDanaModalEl = document.getElementById('tarik-dana-modal');
const tarikDanaForm = document.getElementById('tarik-dana-form');
const btnTarikDana = document.getElementById('btn-tarik-dana');
const periodSelector = document.getElementById('history-period');
const historyTabsContainer = document.getElementById('history-tabs');
const tableHead = document.getElementById('history-table-head');
const tableBody = document.getElementById('history-table-body');

// --- RENDER FUNCTIONS ---
const renderSaldoCards = (balances) => {
    document.getElementById('saldo-tersedia').textContent = formatCurrency(balances.availableBalance);
    document.getElementById('saldo-pending').textContent = formatCurrency(balances.pendingBalance);
    availableBalance = balances.availableBalance;
    btnTarikDana.disabled = availableBalance <= 0;
};

const renderHistoryTable = () => {
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    if (currentTab === 'pendapatan') {
        tableHead.innerHTML = `
            <tr class="border-b">
                <th class="p-4 text-left font-semibold text-sm">Tanggal</th>
                <th class="p-4 text-left font-semibold text-sm">ID Transaksi</th>
                <th class="p-4 text-right font-semibold text-sm">Jumlah</th>
            </tr>
        `;
        if (fullHistory.revenue.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-gray-500">Belum ada pendapatan pada periode ini.</td></tr>`;
            return;
        }
        fullHistory.revenue.forEach(item => {
            const row = tableBody.insertRow();
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="p-4 text-sm">${formatDateTime(new Date(item.date))}</td>
                <td class="p-4 text-sm font-mono">${item.transactionId}</td>
                <td class="p-4 text-right font-semibold text-green-600">+ ${formatCurrency(item.amount)}</td>
            `;
        });
    } else { // currentTab === 'penarikan'
        tableHead.innerHTML = `
            <tr class="border-b">
                <th class="p-4 text-left font-semibold text-sm">Tanggal</th>
                <th class="p-4 text-right font-semibold text-sm">Jumlah</th>
                <th class="p-4 text-center font-semibold text-sm">Status</th>
            </tr>
        `;
        if (fullHistory.withdrawal.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-gray-500">Belum ada penarikan pada periode ini.</td></tr>`;
            return;
        }
        fullHistory.withdrawal.forEach(item => {
            const statusClass = item.status === 'Selesai' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            const row = tableBody.insertRow();
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="p-4 text-sm">${formatDateTime(new Date(item.date))}</td>
                <td class="p-4 text-right font-semibold text-red-600">- ${formatCurrency(item.amount)}</td>
                <td class="p-4 text-center">
                    <span class="text-xs font-medium px-2.5 py-0.5 rounded ${statusClass}">${item.status}</span>
                </td>
            `;
        });
    }
};

// --- MODAL LOGIC ---
const openTarikDanaModal = () => {
    document.getElementById('modal-saldo-tersedia').textContent = formatCurrency(availableBalance);
    tarikDanaForm.reset();
    tarikDanaModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => tarikDanaModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closeTarikDanaModal = () => {
    tarikDanaModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => tarikDanaModalEl.classList.replace('flex', 'hidden'), 300);
};

// --- EVENT HANDLERS ---
const handleTarikDanaSubmit = async (e) => {
    e.preventDefault();
    const amount = parseInt(document.getElementById('jumlah-penarikan').value);

    if (isNaN(amount) || amount <= 0 || amount > availableBalance) {
        showNotification('Jumlah penarikan tidak valid.', 'error');
        return;
    }

    try {
        await requestWithdrawal(amount);
        showNotification('Permintaan penarikan berhasil diajukan.');
        closeTarikDanaModal();
        await loadPageData();
    } catch (error) {
        showNotification(error.message, 'error');
    }
};

const handleTabClick = (e) => {
    const tabButton = e.target.closest('.history-tab-btn');
    if (!tabButton) return;

    currentTab = tabButton.dataset.tab;

    const activeClasses = ['text-blue-600', 'border-blue-600'];
    const inactiveClasses = ['text-gray-500', 'border-transparent', 'hover:text-blue-600'];

    historyTabsContainer.querySelectorAll('.history-tab-btn').forEach(btn => {
        btn.classList.remove(...activeClasses);
        btn.classList.add(...inactiveClasses);
    });

    tabButton.classList.remove(...inactiveClasses);
    tabButton.classList.add(...activeClasses);
    
    renderHistoryTable();
};

// --- DATA LOADER ---
async function loadPageData() {
    const periodValue = periodSelector.value;
    let period = { startDate: null, endDate: null };
    const today = new Date('2025-09-11T23:59:59'); // Tanggal demo
    
    if (periodValue === 'last7days') {
        period.endDate = new Date(today);
        period.startDate = new Date(today);
        period.startDate.setDate(today.getDate() - 6);
        period.startDate.setHours(0, 0, 0, 0);
    } else if (periodValue === 'this_month') {
        period.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        period.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        period.endDate.setHours(23, 59, 59, 999);
    }

    try {
        const data = await getWalletData(period);
        
        renderSaldoCards(data.balances);
        fullHistory.revenue = data.revenueHistory;
        fullHistory.withdrawal = data.withdrawalHistory;
        
        renderHistoryTable();
    } catch (error) {
        console.error("Gagal memuat data saldo:", error);
        // PERUBAHAN: Lempar error agar ditangkap oleh router
        throw new Error('Gagal memuat data E-Wallet.');
    }
}

// --- INITIALIZATION ---
export async function init() {
    // PERUBAHAN: Blok try-catch dihapus, cukup await
    await loadPageData();

    // Event Listeners
    btnTarikDana.addEventListener('click', openTarikDanaModal);
    tarikDanaForm.addEventListener('submit', handleTarikDanaSubmit);
    periodSelector.addEventListener('change', () => loadPageData().catch(err => showNotification(err.message, 'error')));
    historyTabsContainer.addEventListener('click', handleTabClick);

    // Modal listeners
    document.getElementById('btn-batal-tarik').addEventListener('click', closeTarikDanaModal);
    tarikDanaModalEl.querySelector('.modal-backdrop').addEventListener('click', closeTarikDanaModal);
    document.getElementById('btn-tarik-semua').addEventListener('click', () => {
        document.getElementById('jumlah-penarikan').value = availableBalance;
    });
}
