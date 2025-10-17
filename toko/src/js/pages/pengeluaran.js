
import { getExpensesPaginated, addExpense } from '../api.js';
import { formatCurrency, formatDateTime, showNotification } from '../ui.js';
import { ITEMS_PER_PAGE } from '../config.js'; // <-- PERUBAHAN: Impor dari config

// --- STATE & ELEMENT SELECTORS ---
const expenseModalEl = document.getElementById('expense-modal');
const expenseForm = document.getElementById('expense-form');

// State untuk paginasi
let currentPage = 1;
// const ITEMS_PER_PAGE = 5; // <-- PERUBAHAN: Dihapus dan diganti dari config

// --- RENDER FUNCTIONS ---
const renderExpenseHistory = (expenses) => {
    const tbody = document.getElementById('expense-list');
    tbody.innerHTML = '';

    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-500">Belum ada pengeluaran tercatat.</td></tr>`;
        return;
    }

    expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-4 font-mono">${expense.id}</td>
            <td class="p-4">${formatDateTime(new Date(expense.date))}</td>
            <td class="p-4">${expense.description}</td>
            <td class="p-4 font-semibold">${formatCurrency(expense.amount)}</td>
        `;
        tbody.appendChild(row);
    });
};

const renderPaginationControls = (paginationData) => {
    const { totalItems, totalPages, currentPage } = paginationData;
    const container = document.getElementById('pagination-controls');
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <span class="text-sm text-gray-700">
            Menampilkan <span class="font-semibold">${((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span class="font-semibold">${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> dari <span class="font-semibold">${totalItems}</span> Riwayat
        </span>
        <div class="inline-flex mt-2 xs:mt-0">
            <button id="prev-page-btn" class="py-2 px-4 text-sm font-medium text-white bg-gray-800 rounded-l hover:bg-gray-900 disabled:bg-gray-400">Sebelumnya</button>
            <button id="next-page-btn" class="py-2 px-4 text-sm font-medium text-white bg-gray-800 rounded-r border-0 border-l border-gray-700 hover:bg-gray-900 disabled:bg-gray-400">Selanjutnya</button>
        </div>
    `;

    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextBtn.addEventListener('click', () => changePage(currentPage + 1));
};

// --- DATA & PAGE LOGIC ---
const loadExpensesForPage = async (page) => {
    try {
        const data = await getExpensesPaginated({ page, limit: ITEMS_PER_PAGE });
        renderExpenseHistory(data.items);
        renderPaginationControls(data);
        currentPage = data.currentPage;
    } catch (error) {
        console.error("Gagal memuat riwayat pengeluaran:", error);
        // PERUBAHAN: Lempar error agar ditangkap oleh router
        throw new Error('Gagal memuat data riwayat pengeluaran.');
    }
};

const changePage = (newPage) => {
    loadExpensesForPage(newPage).catch(error => {
        // Menangani error paginasi secara spesifik jika diperlukan
        showNotification(error.message, 'error');
    });
};

// --- MODAL LOGIC ---
const openExpenseModal = () => {
    expenseForm.reset();
    expenseModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => {
        expenseModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
    }, 10);
};

const closeExpenseModal = () => {
    expenseModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        expenseModalEl.classList.replace('flex', 'hidden');
    }, 300);
};

// --- EVENT HANDLERS ---
const handleFormSubmit = async (e) => {
    e.preventDefault();
    const description = document.getElementById('expense-description').value;
    const amount = parseInt(document.getElementById('expense-amount').value);

    if (!description || !amount || amount <= 0) {
        showNotification('Deskripsi dan jumlah valid harus diisi.', 'error');
        return;
    }

    try {
        await addExpense({ description, amount });
        showNotification(`Pengeluaran berhasil dicatat.`);
        closeExpenseModal();
        await loadExpensesForPage(1);
    } catch (error) {
        showNotification('Gagal mencatat pengeluaran.', 'error');
        console.error("Save expense error:", error);
    }
};

// --- INITIALIZATION ---
export async function init() {
    // PERUBAHAN: Blok try-catch dihapus, biarkan error dilempar ke router
    await loadExpensesForPage(1);
    
    document.getElementById('btn-add-expense').addEventListener('click', openExpenseModal);
    expenseForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancel-expense').addEventListener('click', closeExpenseModal);
    expenseModalEl.querySelector('.modal-backdrop').addEventListener('click', closeExpenseModal);
}
