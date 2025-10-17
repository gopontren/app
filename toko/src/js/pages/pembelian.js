import { getPurchasesPaginated, addPurchase, saveProduct } from '../api.js';
import { getProducts, getSuppliers, getCategories } from '../store.js';
import { formatCurrency, formatDateTime, showNotification, renderPaginationControls } from '../ui.js';
import { ITEMS_PER_PAGE } from '../config.js'; // <-- PERUBAHAN: Impor dari config

// --- STATE MANAGEMENT ---
let currentPurchaseItems = []; 
const purchaseModalEl = document.getElementById('purchase-modal');
const purchaseForm = document.getElementById('purchase-form');
const productShortcutModalEl = document.getElementById('product-modal-shortcut');
const productShortcutForm = document.getElementById('product-form-shortcut');

// State untuk paginasi
let currentPage = 1;
// const ITEMS_PER_PAGE = 5; // <-- PERUBAHAN: Dihapus

// --- RENDER FUNCTIONS ---
const renderPurchaseHistory = (purchases) => {
    const tbody = document.getElementById('purchase-history-list');
    const suppliers = getSuppliers();
    tbody.innerHTML = '';

    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-500">Belum ada riwayat pembelian.</td></tr>`;
        return;
    }

    purchases.forEach(purchase => {
        const supplier = suppliers.find(s => s.id == purchase.supplierId);
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-4 font-mono">${purchase.id}</td>
            <td class="p-4">${formatDateTime(new Date(purchase.date))}</td>
            <td class="p-4">${supplier ? supplier.name : 'Supplier Dihapus'}</td>
            <td class="p-4 font-semibold">${formatCurrency(purchase.total)}</td>
        `;
        tbody.appendChild(row);
    });
};

const renderPurchaseItems = () => {
    const container = document.getElementById('purchase-items-list');
    const submitBtn = purchaseForm.querySelector('button[type="submit"]');
    container.innerHTML = '';

    if (currentPurchaseItems.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-6">Belum ada item ditambahkan.</p>`;
        submitBtn.disabled = true;
        updatePurchaseTotal();
        return;
    }

    currentPurchaseItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-md shadow-sm';
        itemEl.innerHTML = `
            <span class="font-semibold flex-1 text-sm">${item.name}</span>
            <div class="flex items-center gap-2">
                <label class="text-sm">Qty:</label>
                <input type="number" value="${item.qty}" data-index="${index}" class="purchase-item-qty w-16 p-1 border rounded-md text-sm">
                <label class="text-sm">Harga Beli:</label>
                <input type="number" value="${item.costPrice}" data-index="${index}" class="purchase-item-cost w-24 p-1 border rounded-md text-sm">
                <button type="button" data-index="${index}" class="remove-purchase-item-btn text-red-500 hover:text-red-700 font-bold text-lg px-2">&times;</button>
            </div>
        `;
        container.appendChild(itemEl);
    });
    
    updatePurchaseTotal();
    submitBtn.disabled = false;
};

const updatePurchaseTotal = () => {
    const total = currentPurchaseItems.reduce((sum, item) => sum + (item.qty * item.costPrice), 0);
    document.getElementById('purchase-total').textContent = formatCurrency(total);
};

const populateSupplierDropdown = () => {
    const suppliers = getSuppliers();
    const selectEl = document.getElementById('purchase-supplier');
    selectEl.innerHTML = '<option value="">Pilih Supplier...</option>';
    suppliers.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.name;
        selectEl.appendChild(option);
    });
};

// --- DATA & PAGE LOGIC ---
const loadPurchasesForPage = async (page) => {
    try {
        const data = await getPurchasesPaginated({ page, limit: ITEMS_PER_PAGE });
        renderPurchaseHistory(data.items);
        renderPaginationControls('pagination-controls', {
            totalItems: data.totalItems,
            itemsPerPage: ITEMS_PER_PAGE,
            currentPage: data.currentPage,
            onPageChange: changePage
        });
        currentPage = data.currentPage;
    } catch (error) {
        console.error("Gagal memuat riwayat pembelian:", error);
        // PERUBAHAN: Lempar error agar ditangkap oleh router
        throw new Error('Gagal memuat data riwayat pembelian.');
    }
};

const changePage = (newPage) => {
    loadPurchasesForPage(newPage).catch(error => {
        showNotification(error.message, 'error');
    });
};


// --- MODAL LOGIC & FORM HANDLING ---
const openPurchaseModal = () => {
    purchaseForm.reset();
    currentPurchaseItems = [];
    renderPurchaseItems();
    populateSupplierDropdown();
    purchaseModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => purchaseModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closePurchaseModal = () => {
    purchaseModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => purchaseModalEl.classList.replace('flex', 'hidden'), 300);
};

const handleSearchProduct = (e) => {
    const products = getProducts();
    const query = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById('product-search-results');
    resultsContainer.innerHTML = '';
    
    if (query.length < 2) return;

    const results = products.filter(p => p.name.toLowerCase().includes(query)).slice(0, 5);
    
    if (results.length > 0) {
        const list = document.createElement('div');
        list.className = 'absolute w-full bg-white border shadow-lg rounded-md mt-1 z-10';
        results.forEach(product => {
            const item = document.createElement('div');
            item.className = 'p-2 cursor-pointer hover:bg-gray-100';
            item.textContent = product.name;
            item.addEventListener('click', () => {
                addItemToPurchase(product);
                e.target.value = '';
                resultsContainer.innerHTML = '';
            });
            list.appendChild(item);
        });
        resultsContainer.appendChild(list);
    }
};

const addItemToPurchase = (product) => {
    const existingItem = currentPurchaseItems.find(item => item.productId === product.id);
    if (existingItem) {
        showNotification('Produk sudah ada di daftar, silakan ubah kuantitasnya.', 'error');
    } else {
        currentPurchaseItems.push({
            productId: product.id,
            name: product.name,
            qty: 1,
            costPrice: product.costPrice || 0
        });
    }
    renderPurchaseItems();
};

const handleItemChange = (e) => {
    if(!e.target.classList.contains('purchase-item-qty') && !e.target.classList.contains('purchase-item-cost')) return;
    
    const index = e.target.dataset.index;
    const item = currentPurchaseItems[index];
    const value = parseInt(e.target.value) || 0;

    if (e.target.classList.contains('purchase-item-qty')) {
        item.qty = value;
    } else {
        item.costPrice = value;
    }
    updatePurchaseTotal();
};

const handleRemoveItem = (e) => {
    if(!e.target.classList.contains('remove-purchase-item-btn')) return;
    const index = e.target.dataset.index;
    currentPurchaseItems.splice(index, 1);
    renderPurchaseItems();
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const supplierId = document.getElementById('purchase-supplier').value;
    if (!supplierId || currentPurchaseItems.length === 0) {
        showNotification('Supplier harus dipilih dan minimal ada 1 item.', 'error');
        return;
    }
    
    const purchaseData = {
        supplierId: parseInt(supplierId),
        items: currentPurchaseItems.map(({ productId, qty, costPrice }) => ({ productId, qty, costPrice })),
        total: currentPurchaseItems.reduce((sum, item) => sum + (item.qty * item.costPrice), 0)
    };
    
    try {
        await addPurchase(purchaseData);
        showNotification('Data pembelian berhasil disimpan.');
        closePurchaseModal();
        await loadPurchasesForPage(1);
    } catch (error) {
        showNotification('Gagal menyimpan data pembelian.', 'error');
        console.error("Purchase error:", error);
    }
};

const populateCategoryDropdownShortcut = () => {
    const categories = getCategories();
    const selectEl = document.getElementById('product-category-shortcut');
    selectEl.innerHTML = '<option value="">Pilih Kategori...</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        selectEl.appendChild(option);
    });
};

const openProductShortcutModal = () => {
    productShortcutForm.reset();
    populateCategoryDropdownShortcut();
    document.getElementById('product-stock-shortcut').value = 0;
    productShortcutModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => productShortcutModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closeProductShortcutModal = () => {
    productShortcutModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => productShortcutModalEl.classList.replace('flex', 'hidden'), 300);
};

const handleProductShortcutSubmit = async (e) => {
    e.preventDefault();
    const productData = {
        name: document.getElementById('product-name-shortcut').value,
        categoryId: parseInt(document.getElementById('product-category-shortcut').value),
        costPrice: parseInt(document.getElementById('product-cost-price-shortcut').value),
        price: parseInt(document.getElementById('product-price-shortcut').value),
        stock: parseInt(document.getElementById('product-stock-shortcut').value),
        image: document.getElementById('product-image-shortcut').value || `https://placehold.co/150x150/E2E8F0/334155?text=${document.getElementById('product-name-shortcut').value.substring(0,4)}`,
    };

    try {
        await saveProduct(productData);
        showNotification(`Produk "${productData.name}" berhasil ditambahkan.`);
        closeProductShortcutModal();
    } catch (error) {
        showNotification('Gagal menyimpan produk baru.', 'error');
        console.error("Save product shortcut error:", error);
    }
};

// --- INITIALIZATION ---
export async function init() {
    // PERUBAHAN: Blok try-catch dihapus
    await loadPurchasesForPage(1);

    document.getElementById('btn-add-purchase').addEventListener('click', openPurchaseModal);
    document.getElementById('btn-cancel-purchase').addEventListener('click', closePurchaseModal);
    purchaseModalEl.querySelector('.modal-backdrop').addEventListener('click', closePurchaseModal);
    document.getElementById('product-search-purchase').addEventListener('input', handleSearchProduct);
    document.getElementById('purchase-items-list').addEventListener('input', handleItemChange);
    document.getElementById('purchase-items-list').addEventListener('click', handleRemoveItem);
    purchaseForm.addEventListener('submit', handleFormSubmit);

    document.getElementById('btn-add-new-product-shortcut').addEventListener('click', openProductShortcutModal);
    document.getElementById('btn-cancel-product-shortcut').addEventListener('click', closeProductShortcutModal);
    productShortcutModalEl.querySelector('.modal-backdrop').addEventListener('click', closeProductShortcutModal);
    productShortcutForm.addEventListener('submit', handleProductShortcutSubmit);
}
