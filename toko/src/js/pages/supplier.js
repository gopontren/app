import { saveSupplier, deleteSupplier } from '../api.js';
import { getSuppliers, getSupplierById } from '../store.js';
import { showNotification, showConfirmationModal, renderPaginationControls } from '../ui.js';
import { ITEMS_PER_PAGE } from '../config.js'; // <-- PERUBAHAN: Impor dari config

// --- STATE & ELEMENT SELECTORS ---
const supplierModalEl = document.getElementById('supplier-modal');
const supplierForm = document.getElementById('supplier-form');

// State untuk paginasi dan pencarian
let currentPage = 1;
let currentFilter = '';
// const ITEMS_PER_PAGE = 5; // <-- PERUBAHAN: Dihapus

// --- RENDER FUNCTIONS ---
const renderSuppliers = (suppliersToRender) => {
    const tbody = document.getElementById('supplier-list');
    tbody.innerHTML = '';

    if (!suppliersToRender || suppliersToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-500">Supplier tidak ditemukan.</td></tr>`;
        return;
    }

    suppliersToRender.forEach(supplier => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-4 font-semibold">${supplier.name}</td>
            <td class="p-4">${supplier.contact}</td>
            <td class="p-4">${supplier.address}</td>
            <td class="p-4 space-x-2">
                <button data-supplier-id="${supplier.id}" class="edit-supplier-btn text-blue-600 hover:underline">Edit</button>
                <button data-supplier-id="${supplier.id}" data-supplier-name="${supplier.name}" class="delete-supplier-btn text-red-600 hover:underline">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('.edit-supplier-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
    tbody.querySelectorAll('.delete-supplier-btn').forEach(btn => btn.addEventListener('click', handleDeleteClick));
};

// --- DATA & PAGE LOGIC ---
const applyFiltersAndRender = () => {
    let filtered = [...getSuppliers()];

    if (currentFilter) {
        filtered = filtered.filter(s => s.name.toLowerCase().includes(currentFilter));
    }

    const totalFilteredItems = filtered.length;
    const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    renderSuppliers(paginatedItems);
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
const openSupplierModal = (supplier = {}) => {
    document.getElementById('supplier-modal-title').textContent = supplier.id ? 'Edit Supplier' : 'Tambah Supplier Baru';
    supplierForm.reset();
    document.getElementById('supplier-id').value = supplier.id || '';
    document.getElementById('supplier-name').value = supplier.name || '';
    document.getElementById('supplier-contact').value = supplier.contact || '';
    document.getElementById('supplier-address').value = supplier.address || '';
    
    supplierModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => {
        supplierModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
    }, 10);
};

const closeSupplierModal = () => {
    supplierModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        supplierModalEl.classList.replace('flex', 'hidden');
    }, 300);
};

// --- EVENT HANDLERS ---
const handleAddClick = () => {
    openSupplierModal();
};

const handleEditClick = (e) => {
    const supplierId = e.target.dataset.supplierId;
    const supplier = getSupplierById(supplierId);
    if (supplier) {
        openSupplierModal(supplier);
    }
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const supplierData = {
        id: document.getElementById('supplier-id').value,
        name: document.getElementById('supplier-name').value,
        contact: document.getElementById('supplier-contact').value,
        address: document.getElementById('supplier-address').value,
    };

    try {
        await saveSupplier(supplierData);
        showNotification('Supplier berhasil disimpan.');
        closeSupplierModal();
        applyFiltersAndRender();
    } catch (error) {
        showNotification('Gagal menyimpan supplier.', 'error');
        console.error("Save supplier error:", error);
    }
};

const handleDeleteClick = (e) => {
    const supplierId = e.target.dataset.supplierId;
    const supplierName = e.target.dataset.supplierName;
    
    showConfirmationModal(`Yakin ingin menghapus supplier "${supplierName}"?`, async () => {
        try {
            await deleteSupplier(supplierId);
            showNotification('Supplier berhasil dihapus.');
            applyFiltersAndRender();
        } catch (error) {
            showNotification('Gagal menghapus supplier.', 'error');
            console.error("Delete supplier error:", error);
        }
    });
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
    // PERUBAHAN: Blok try-catch dihapus
    applyFiltersAndRender();

    document.getElementById('btn-add-supplier').addEventListener('click', handleAddClick);
    document.getElementById('supplier-search-management').addEventListener('input', handleSearch);
    supplierForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancel-supplier').addEventListener('click', closeSupplierModal);
    supplierModalEl.querySelector('.modal-backdrop').addEventListener('click', closeSupplierModal);
}
