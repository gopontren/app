import { adjustStock } from '../api.js';
import { getProducts, getProductById } from '../store.js';
import { showNotification, renderPaginationControls } from '../ui.js';
import { ITEMS_PER_PAGE, STOCK_ALERT_THRESHOLD } from '../config.js'; // <-- PERUBAHAN: Impor dari config

// --- STATE & ELEMENT SELECTORS ---
const stockAdjustModal = document.getElementById('stock-adjust-modal');
const stockAdjustForm = document.getElementById('stock-adjust-form');

// State untuk paginasi dan pencarian
let currentPage = 1;
let currentFilter = '';
// const ITEMS_PER_PAGE = 5; // <-- PERUBAHAN: Dihapus

// --- RENDER FUNCTIONS ---
const renderStockOpnameList = (products) => {
    const tbody = document.getElementById('stock-opname-list');
    tbody.innerHTML = '';
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-gray-500">Produk tidak ditemukan.</td></tr>`;
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-4">
                <div class="flex items-center">
                    <img src="${product.image}" class="w-12 h-12 rounded-md object-cover mr-4 bg-gray-100">
                    <span class="font-semibold">${product.name}</span>
                </div>
            </td>
            <td class="p-4 font-mono text-lg ${product.stock < STOCK_ALERT_THRESHOLD ? 'text-red-500 font-bold' : ''}">${product.stock}</td>
            <td class="p-4 text-center">
                <button data-product-id="${product.id}" class="adjust-stock-btn bg-yellow-500 text-white py-1 px-3 rounded-md font-semibold hover:bg-yellow-600 transition-colors text-sm">
                    Sesuaikan
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('.adjust-stock-btn').forEach(btn => btn.addEventListener('click', handleAdjustClick));
};

// --- DATA & PAGE LOGIC ---
const applyFiltersAndRender = () => {
    let filtered = [...getProducts()];

    if (currentFilter) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(currentFilter));
    }

    const totalFilteredItems = filtered.length;
    const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    renderStockOpnameList(paginatedItems);
    renderPaginationControls('pagination-controls', {
        totalItems: totalFilteredItems,
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage: currentPage,
        onPageChange: changePage
    });
};


const changePage = (newPage) => {
    currentPage = newPage;
    applyFiltersAndRender();
};

// --- MODAL LOGIC ---
const openAdjustModal = () => {
    stockAdjustModal.classList.replace('hidden', 'flex');
    setTimeout(() => {
        stockAdjustModal.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
    }, 10);
};

const closeAdjustModal = () => {
    stockAdjustModal.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        stockAdjustModal.classList.replace('flex', 'hidden');
    }, 300);
};

// --- EVENT HANDLERS ---
const handleAdjustClick = (e) => {
    const productId = e.target.dataset.productId;
    const product = getProductById(productId);
    if (!product) return;

    stockAdjustForm.reset();
    document.getElementById('adjust-product-id').value = product.id;
    document.getElementById('adjust-old-stock').value = product.stock;
    document.getElementById('adjust-product-name').textContent = product.name;
    document.getElementById('adjust-current-stock').value = product.stock;
    
    openAdjustModal();
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const productId = document.getElementById('adjust-product-id').value;
    const oldStock = parseInt(document.getElementById('adjust-old-stock').value);
    const newStock = parseInt(document.getElementById('adjust-new-stock').value);
    const reason = document.getElementById('adjust-reason').value;

    if (isNaN(newStock) || newStock < 0) {
        showNotification('Jumlah stok baru tidak valid.', 'error');
        return;
    }

    try {
        await adjustStock(productId, newStock, oldStock, reason);
        showNotification('Stok produk berhasil disesuaikan.');
        closeAdjustModal();
        applyFiltersAndRender();
    } catch (error) {
        showNotification('Gagal menyesuaikan stok.', 'error');
        console.error("Adjust stock error:", error);
    }
};

let searchTimeout;
const handleSearch = (e) => {
    const filter = e.target.value.toLowerCase();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentFilter = filter;
        currentPage = 1;
        applyFiltersAndRender();
    }, 300);
};

// --- INITIALIZATION ---
export function init() {
    // PERUBAHAN: Blok try-catch dihapus, biarkan error ditangkap oleh router
    applyFiltersAndRender();
    
    document.getElementById('product-search-opname').addEventListener('input', handleSearch);
    
    stockAdjustForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancel-adjust').addEventListener('click', closeAdjustModal);
    stockAdjustModal.querySelector('.modal-backdrop').addEventListener('click', closeAdjustModal);
}
