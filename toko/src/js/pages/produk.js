import { saveProduct, deleteProduct } from '../api.js';
import { getProducts, getCategories, getProductById } from '../store.js';
import { formatCurrency, showNotification, showConfirmationModal, renderPaginationControls } from '../ui.js';
import { ITEMS_PER_PAGE, STOCK_ALERT_THRESHOLD } from '../config.js';

// --- STATE & ELEMENT SELECTORS ---
const productModalEl = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const filterModalEl = document.getElementById('product-filter-modal');
const filterForm = document.getElementById('product-filter-form');
const filterIndicator = document.getElementById('filter-active-indicator');

// State untuk upload gambar
let currentImageBase64 = null;
const imageFileInput = document.getElementById('product-image-file');
const imagePreviewWrapper = document.getElementById('image-preview-wrapper');
const imagePreview = document.getElementById('image-preview');
const uploadPrompt = document.getElementById('upload-prompt');
const removeImageBtn = document.getElementById('remove-image-btn');

// State untuk paginasi dan filter
let currentPage = 1;
let activeFilters = {
    search: '',
    sortBy: 'default',
    category: 'all',
    noImage: false,
    noCostPrice: false,
};

// --- LOGIKA BARU: "Smart Buffer" untuk Scanner ---
// Variabel untuk menampung ketikan cepat dari scanner
let scanBuffer = '';
// Timer untuk mereset buffer jika ada jeda (menandakan ketikan manual)
let scanTimer = null;
// Jeda waktu dalam milidetik. Jika pengguna berhenti mengetik selama 50md, buffer akan direset.
const SCANNER_TIMEOUT = 50;

/**
 * Memproses hasil pindaian dari buffer.
 * @param {string} barcode - String barcode yang berhasil ditangkap.
 */
const processScanResult = (barcode) => {
    const barcodeInput = document.getElementById('product-barcode');
    if (barcodeInput) {
        barcodeInput.value = barcode;
        // Memicu event 'input' secara manual agar logika pengecekan duplikat berjalan.
        barcodeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

/**
 * Event handler global yang mendengarkan semua ketikan keyboard.
 * Hanya aktif ketika modal tambah/edit produk terbuka.
 * @param {KeyboardEvent} e - Event keyboard.
 */
const handleGlobalScan = (e) => {
    // Abaikan tombol-tombol khusus seperti Shift, Control, dll.
    if (e.key.length > 1 && e.key !== 'Enter') return;

    // Hapus timer yang ada setiap kali ada tombol baru ditekan.
    clearTimeout(scanTimer);

    if (e.key === 'Enter') {
        // Jika 'Enter' ditekan dan buffer berisi sesuatu, anggap itu adalah akhir dari pindaian.
        if (scanBuffer.length > 3) { // Minimal 4 karakter untuk dianggap pindaian
            processScanResult(scanBuffer);
        }
        // Reset buffer setelah 'Enter'.
        scanBuffer = '';
        // Mencegah 'Enter' mengirimkan form secara tidak sengaja.
        e.preventDefault();
    } else {
        // Tambahkan karakter yang diketik ke buffer.
        scanBuffer += e.key;
    }

    // Setel timer baru. Jika tidak ada ketikan lagi dalam 50md, reset buffer.
    // Ini membedakan antara pindaian (sangat cepat) dan ketikan manual (lebih lambat).
    scanTimer = setTimeout(() => {
        scanBuffer = '';
    }, SCANNER_TIMEOUT);
};

/**
 * Memeriksa apakah barcode yang diinput sudah ada di produk lain.
 * @param {Event} e - Event input dari field barcode.
 */
const checkDuplicateBarcode = (e) => {
    const barcode = e.target.value.trim();
    const feedbackEl = document.getElementById('barcode-feedback');
    const currentProductId = document.getElementById('product-id').value;
    
    if (!barcode) {
        feedbackEl.className = 'text-xs mt-1 h-4'; // Reset dan sembunyikan
        feedbackEl.textContent = '';
        return;
    }

    const allProducts = getProducts();
    const duplicateProduct = allProducts.find(p => p.barcode === barcode && p.id != currentProductId);

    if (duplicateProduct) {
        feedbackEl.textContent = `Error: Barcode ini dipakai oleh "${duplicateProduct.name}".`;
        feedbackEl.className = 'text-xs mt-1 h-4 text-red-600 font-semibold'; // Tampilkan pesan error
    } else {
        feedbackEl.textContent = '✓ Barcode tersedia';
        feedbackEl.className = 'text-xs mt-1 h-4 text-green-600 font-semibold'; // Tampilkan pesan sukses
    }
};


// --- RENDER FUNCTIONS ---
const populateCategoryDropdowns = () => {
    const categories = getCategories();
    const selectors = ['#product-category', '#filter-category'];
    selectors.forEach(selector => {
        const selectEl = document.querySelector(selector);
        if (!selectEl) return;
        
        let initialOption = `<option value="all">Semua Kategori</option>`;
        if (selector === '#product-category') {
            initialOption = `<option value="">Pilih Kategori...</option>`;
        }
        selectEl.innerHTML = initialOption;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            selectEl.appendChild(option);
        });
    });
};

const renderProductManagement = (productsToRender) => {
    const tbody = document.getElementById('product-management-list');
    const categories = getCategories();
    tbody.innerHTML = '';

    if (!productsToRender || productsToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500">Produk tidak ditemukan.</td></tr>`;
        return;
    }

    productsToRender.forEach(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-4">
                <div class="flex items-center">
                    <img src="${product.image}" class="w-12 h-12 rounded-md object-cover mr-4 bg-gray-100 flex-shrink-0">
                    <div>
                        <span class="font-semibold">${product.name}</span>
                    </div>
                </div>
            </td>
            <td class="p-4 text-sm text-gray-600">
                <div class="font-mono">SKU: ${product.sku || '-'}</div>
                <div class="font-mono">BC: ${product.barcode || '-'}</div>
            </td>
            <td class="p-4">${category ? category.name : 'Tidak ada'}</td>
            <td class="p-4">${formatCurrency(product.costPrice || 0)}</td>
            <td class="p-4">${formatCurrency(product.price)}</td>
            <td class="p-4 font-bold ${product.stock < STOCK_ALERT_THRESHOLD ? 'text-red-500' : ''}">${product.stock}</td>
            <td class="p-4 space-x-2 whitespace-nowrap">
                <button data-product-id="${product.id}" class="edit-product-btn text-blue-600 hover:underline">Edit</button>
                <button data-product-id="${product.id}" data-product-name="${product.name}" class="delete-product-btn text-red-600 hover:underline">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('.edit-product-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
    tbody.querySelectorAll('.delete-product-btn').forEach(btn => btn.addEventListener('click', handleDeleteClick));
};


// --- LOGIKA FILTER DAN PAGINASI ---
const applyFiltersAndRender = () => {
    let filtered = [...getProducts()];

    if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.sku?.toLowerCase().includes(searchTerm) ||
            p.barcode?.includes(searchTerm)
        );
    }
    if (activeFilters.category !== 'all') {
        filtered = filtered.filter(p => p.categoryId == activeFilters.category);
    }
    if (activeFilters.noImage) {
        filtered = filtered.filter(p => p.hasNoImage);
    }
    if (activeFilters.noCostPrice) {
        filtered = filtered.filter(p => p.hasNoCostPrice);
    }
    switch (activeFilters.sortBy) {
        case 'price_asc': filtered.sort((a, b) => a.price - b.price); break;
        case 'price_desc': filtered.sort((a, b) => b.price - a.price); break;
        case 'cost_asc': filtered.sort((a, b) => (a.costPrice || 0) - (b.costPrice || 0)); break;
        case 'cost_desc': filtered.sort((a, b) => (b.costPrice || 0) - (a.costPrice || 0)); break;
        case 'stock_asc': filtered.sort((a, b) => a.stock - b.stock); break;
        case 'stock_desc': filtered.sort((a, b) => b.stock - a.stock); break;
    }

    const totalFilteredItems = filtered.length;
    const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    renderProductManagement(paginatedItems);
    renderPaginationControls('pagination-controls', {
        totalItems: totalFilteredItems,
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage: currentPage,
        onPageChange: changePage
    });
    
    updateFilterIndicator();
};

const changePage = (newPage) => {
    currentPage = newPage;
    applyFiltersAndRender();
};

// --- MODAL & FORM LOGIC ---
const resetImageUploader = () => {
    currentImageBase64 = null;
    imageFileInput.value = '';
    imagePreview.src = '#';
    imagePreviewWrapper.classList.add('hidden');
    uploadPrompt.classList.remove('hidden');
};

const openProductModal = (product = null) => {
    productForm.reset();
    resetImageUploader(); 

    document.getElementById('product-modal-title').textContent = product ? 'Edit Produk' : 'Tambah Produk Baru';
    document.getElementById('product-id').value = product?.id || '';
    document.getElementById('product-name').value = product?.name || '';
    document.getElementById('product-sku').value = product?.sku || '';
    document.getElementById('product-barcode').value = product?.barcode || '';
    document.getElementById('product-category').value = product?.categoryId || '';
    document.getElementById('product-cost-price').value = product?.costPrice || '';
    document.getElementById('product-price').value = product?.price || '';
    document.getElementById('product-stock').value = product?.stock || '';

    if (product?.image && !product.image.includes('placehold.co')) {
        currentImageBase64 = product.image;
        imagePreview.src = product.image;
        imagePreviewWrapper.classList.remove('hidden');
        uploadPrompt.classList.add('hidden');
    }

    // Aktifkan listener global saat modal dibuka.
    document.addEventListener('keydown', handleGlobalScan);
    
    // Tambahkan listener untuk pengecekan duplikat barcode secara real-time.
    const barcodeInput = document.getElementById('product-barcode');
    barcodeInput.addEventListener('input', checkDuplicateBarcode);
    
    // Reset pesan feedback
    const feedbackEl = document.getElementById('barcode-feedback');
    feedbackEl.className = 'text-xs mt-1 h-4';
    feedbackEl.textContent = '';
    
    productModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => productModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closeProductModal = () => {
    // Hapus listener global saat modal ditutup untuk mencegah efek samping.
    document.removeEventListener('keydown', handleGlobalScan);

    const barcodeInput = document.getElementById('product-barcode');
    if (barcodeInput) {
        barcodeInput.removeEventListener('input', checkDuplicateBarcode);
    }

    productModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => productModalEl.classList.replace('flex', 'hidden'), 300);
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const productData = {
        id: document.getElementById('product-id').value,
        name: document.getElementById('product-name').value,
        sku: document.getElementById('product-sku').value.trim(),
        barcode: document.getElementById('product-barcode').value.trim(),
        categoryId: parseInt(document.getElementById('product-category').value),
        costPrice: parseInt(document.getElementById('product-cost-price').value),
        price: parseInt(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        image: currentImageBase64,
    };

    try {
        await saveProduct(productData);
        showNotification(`Produk berhasil disimpan.`);
        closeProductModal();
        applyFiltersAndRender();
    } catch (error) {
        showNotification('Gagal menyimpan produk.', 'error');
        console.error("Save product error:", error);
    }
};

const openFilterModal = () => {
    document.getElementById('filter-sort-by').value = activeFilters.sortBy;
    document.getElementById('filter-category').value = activeFilters.category;
    document.getElementById('filter-no-image').checked = activeFilters.noImage;
    document.getElementById('filter-no-cost-price').checked = activeFilters.noCostPrice;
    
    filterModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => filterModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closeFilterModal = () => {
    filterModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => filterModalEl.classList.replace('flex', 'hidden'), 300);
};

const handleFilterFormSubmit = (e) => {
    e.preventDefault();
    activeFilters.sortBy = document.getElementById('filter-sort-by').value;
    activeFilters.category = document.getElementById('filter-category').value;
    activeFilters.noImage = document.getElementById('filter-no-image').checked;
    activeFilters.noCostPrice = document.getElementById('filter-no-cost-price').checked;
    
    currentPage = 1;
    applyFiltersAndRender();
    closeFilterModal();
};

const handleFilterReset = () => {
    activeFilters = { search: activeFilters.search, sortBy: 'default', category: 'all', noImage: false, noCostPrice: false };
    currentPage = 1;
    applyFiltersAndRender();
    closeFilterModal();
};

const updateFilterIndicator = () => {
    const isFilterActive = activeFilters.sortBy !== 'default' || activeFilters.category !== 'all' || activeFilters.noImage || activeFilters.noCostPrice;
    filterIndicator.classList.toggle('hidden', !isFilterActive);
};

// --- EVENT HANDLERS ---
const handleAddClick = () => openProductModal();

const handleEditClick = (e) => {
    const productId = e.target.dataset.productId;
    const product = getProductById(productId);
    if (product) openProductModal(product);
};

const handleDeleteClick = (e) => {
    const productId = e.target.dataset.productId;
    const productName = e.target.dataset.productName;
    showConfirmationModal(`Yakin ingin menghapus produk "${productName}"?`, async () => {
        try {
            await deleteProduct(productId);
            showNotification(`Produk berhasil dihapus.`);
            applyFiltersAndRender();
        } catch (error) {
            showNotification('Gagal menghapus produk.', 'error');
        }
    });
};

let searchTimeout;
const handleSearch = (e) => {
    const searchTerm = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        activeFilters.search = searchTerm;
        currentPage = 1;
        applyFiltersAndRender();
    }, 300);
};

const handleImageFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
        showNotification('Ukuran file terlalu besar. Maksimal 1MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        currentImageBase64 = reader.result;
        imagePreview.src = reader.result;
        imagePreviewWrapper.classList.remove('hidden');
        uploadPrompt.classList.add('hidden');
    };
    reader.readAsDataURL(file);
};


// --- INITIALIZATION ---
export function init() {
    populateCategoryDropdowns();
    applyFiltersAndRender();
    
    document.getElementById('btn-add-product').addEventListener('click', handleAddClick);
    document.getElementById('product-search-management').addEventListener('input', handleSearch);
    
    productForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancel-product').addEventListener('click', closeProductModal);
    productModalEl.querySelector('.modal-backdrop').addEventListener('click', closeProductModal);
    imageFileInput.addEventListener('change', handleImageFileSelect);
    removeImageBtn.addEventListener('click', resetImageUploader);

    document.getElementById('btn-open-filter').addEventListener('click', openFilterModal);
    filterForm.addEventListener('submit', handleFilterFormSubmit);
    document.getElementById('btn-cancel-filter').addEventListener('click', closeFilterModal);
    document.getElementById('btn-reset-filter').addEventListener('click', handleFilterReset);
    filterModalEl.querySelector('.modal-backdrop').addEventListener('click', closeFilterModal);
}

