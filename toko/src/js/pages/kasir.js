import { findSantri, addTransaction, saveProduct, verifySantriPin } from '../api.js';
import { getProducts as getProductsFromStore } from '../store.js';
import { formatCurrency, formatDateTime, showNotification, showConfirmationModal, closeConfirmModal, updateBadges } from '../ui.js';
import { DEFAULT_CATEGORY_ID } from '../config.js';

// --- STATE MANAGEMENT (Struktur Baru untuk Multi-Keranjang) ---
let activeCarts = {};
let heldCarts = {};
let currentActiveCartId = null;

// --- HELPER FUNCTION ---
const isTouchDevice = () => {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// --- ELEMENT SELECTORS ---
const quickAddModalEl = document.getElementById('quick-add-product-modal');
const quickAddForm = document.getElementById('quick-add-product-form');
const paymentModalEl = document.getElementById('payment-modal');
const heldCartsModalEl = document.getElementById('held-carts-modal');
const heldCartsListContainer = document.getElementById('held-carts-list');
const cartTabsContainer = document.getElementById('cart-tabs-container');
let paymentState = { step: 'method-selection', method: null, santri: null, cashReceived: 0, pin: '' };
let html5QrCodeScanner = null;


// --- FUNGSI INTI MULTI-KERANJANG ---
const createNewCart = () => {
    const newCartId = `cart-${Date.now()}`;
    const cartNumber = Object.keys(activeCarts).length + Object.keys(heldCarts).length + 1;
    
    activeCarts[newCartId] = {
        id: newCartId,
        name: `Pelanggan ${cartNumber}`,
        items: [],
        createdAt: new Date()
    };
    
    switchToCart(newCartId);
};

const switchToCart = (cartId) => {
    if (!activeCarts[cartId]) return;
    currentActiveCartId = cartId;
    renderAll();
};

const holdActiveCart = (holdName) => {
    if (!currentActiveCartId || !activeCarts[currentActiveCartId]) return;

    const cartToHold = activeCarts[currentActiveCartId];
    if (holdName && holdName.trim() !== '') {
        cartToHold.name = holdName.trim();
    }
    
    heldCarts[cartToHold.id] = cartToHold;
    delete activeCarts[currentActiveCartId];

    const remainingCartIds = Object.keys(activeCarts);
    if (remainingCartIds.length > 0) {
        switchToCart(remainingCartIds[0]);
    } else {
        createNewCart();
    }
    
    showNotification(`Transaksi "${cartToHold.name}" berhasil ditahan.`);
};

const resumeHeldCart = (cartId) => {
    if (!heldCarts[cartId]) return;
    const cartToResume = heldCarts[cartId];
    activeCarts[cartId] = cartToResume;
    delete heldCarts[cartId];
    switchToCart(cartId);
    closeHeldCartsModal();
};

const deleteCart = (cartId, isFromHeldList = false) => {
    if (activeCarts[cartId]) {
        if (Object.keys(activeCarts).length === 1) {
            delete activeCarts[cartId];
            createNewCart();
        } else {
            delete activeCarts[cartId];
            switchToCart(Object.keys(activeCarts)[0]);
        }
    } else if (heldCarts[cartId]) {
        delete heldCarts[cartId];
        if(isFromHeldList) renderHeldCartsList();
    }
};

// --- RENDER FUNCTIONS ---
const renderAll = () => {
    renderCartTabs();
    renderCartItems();
    renderProductListKasir(document.getElementById('product-search').value);
};

const renderCartTabs = () => {
    cartTabsContainer.innerHTML = '';
    Object.values(activeCarts).forEach(cart => {
        const isActive = cart.id === currentActiveCartId;
        const tab = document.createElement('button');
        tab.className = `cart-tab-btn flex-shrink-0 relative py-2 px-4 rounded-t-lg text-sm font-semibold transition-colors flex items-center gap-2 ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`;
        tab.dataset.cartId = cart.id;
        tab.innerHTML = `
            <span>${cart.name}</span>
            <span data-action="close" class="close-cart-btn text-gray-400 hover:text-red-500 font-bold">&times;</span>
        `;
        cartTabsContainer.appendChild(tab);
    });
};

const renderCartItems = () => {
    const products = getProductsFromStore();
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const payButton = document.getElementById('btn-bayar');
    const holdButton = document.getElementById('btn-hold-cart');
    container.innerHTML = '';

    const activeCart = activeCarts[currentActiveCartId];

    if (!activeCart || activeCart.items.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-8">Keranjang kosong</p>`;
        totalEl.textContent = formatCurrency(0);
        payButton.disabled = true;
        holdButton.disabled = true;
        return;
    }

    let total = 0;
    activeCart.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        total += product.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between items-center text-sm py-2 border-b';
        itemEl.innerHTML = `<div class="flex-1 pr-2"><p class="font-semibold">${product.name}</p><p class="text-gray-500">${formatCurrency(product.price)}</p></div><div class="flex items-center gap-1"><button class="qty-btn bg-gray-200 w-6 h-6 rounded-full font-bold text-gray-700 hover:bg-gray-300" data-product-id="${product.id}" data-change="-1">-</button><input type="number" value="${item.quantity}" min="1" max="${product.stock}" class="qty-input w-12 text-center border rounded-md" data-product-id="${product.id}"><button class="qty-btn bg-gray-200 w-6 h-6 rounded-full font-bold text-gray-700 hover:bg-gray-300" data-product-id="${product.id}" data-change="1">+</button></div><div class="w-20 text-right font-bold">${formatCurrency(product.price * item.quantity)}</div><button class="remove-from-cart-btn text-red-500 hover:text-red-700 font-bold text-xl ml-2" data-product-id="${product.id}">&times;</button>`;
        container.appendChild(itemEl);
    });
    
    container.querySelectorAll('.remove-from-cart-btn').forEach(btn => btn.addEventListener('click', (e) => removeFromCart(parseInt(e.currentTarget.dataset.productId))));
    container.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', handleQtyButtonClick));
    container.querySelectorAll('.qty-input').forEach(input => input.addEventListener('change', handleQtyInputChange));

    totalEl.textContent = formatCurrency(total);
    payButton.disabled = false;
    holdButton.disabled = false;
};

const renderHeldCartsList = () => {
    heldCartsListContainer.innerHTML = '';
    const heldCartValues = Object.values(heldCarts);
    
    if (heldCartValues.length === 0) {
        heldCartsListContainer.innerHTML = `<p class="text-gray-500 text-center py-10">Tidak ada transaksi yang ditahan.</p>`;
        return;
    }

    heldCartValues.forEach(cart => {
        const cartTotal = cart.items.reduce((sum, item) => {
            const product = getProductsFromStore().find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);

        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between items-center p-3 rounded-md bg-gray-50';
        itemEl.innerHTML = `
            <div>
                <p class="font-semibold">${cart.name}</p>
                <p class="text-sm text-gray-500">${cart.items.length} item - Total: ${formatCurrency(cartTotal)}</p>
                <p class="text-xs text-gray-400">Ditahan pada: ${formatDateTime(cart.createdAt)}</p>
            </div>
            <div class="space-x-2 flex-shrink-0">
                <button data-cart-id="${cart.id}" class="resume-cart-btn bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">Lanjutkan</button>
                <button data-cart-id="${cart.id}" class="delete-held-cart-btn text-red-600 hover:underline text-sm">Hapus</button>
            </div>
        `;
        heldCartsListContainer.appendChild(itemEl);
    });

    heldCartsListContainer.querySelectorAll('.resume-cart-btn').forEach(btn => btn.addEventListener('click', e => resumeHeldCart(e.target.dataset.cartId)));
    heldCartsListContainer.querySelectorAll('.delete-held-cart-btn').forEach(btn => btn.addEventListener('click', e => {
        showConfirmationModal({
            message: `Yakin ingin menghapus transaksi tertahan ini? Aksi ini tidak dapat dibatalkan.`,
            callback: () => {
                deleteCart(e.target.dataset.cartId, true);
                closeConfirmModal();
            }
        });
    }));
};

const renderProductListKasir = (filter = '') => {
    // ... (Fungsi ini tidak berubah dari versi sebelumnya)
    const products = getProductsFromStore();
    const container = document.getElementById('product-list-kasir');
    const suggestionContainer = document.getElementById('add-product-suggestion');
    const searchInput = document.getElementById('product-search');

    if (filter.length > 4) {
        const exactMatch = products.find(p => (p.barcode && p.barcode === filter) || (p.sku && p.sku === filter));
        if (exactMatch) {
            addToCart(exactMatch.id);
            searchInput.value = '';
            if (!isTouchDevice()) {
                searchInput.focus();
            }
            renderProductListKasir('');
            return;
        }
    }

    container.innerHTML = '';
    if (suggestionContainer) {
        suggestionContainer.innerHTML = '';
        suggestionContainer.classList.add('hidden');
    }

    const lowerCaseFilter = filter.toLowerCase();
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(lowerCaseFilter) || p.sku?.toLowerCase().includes(lowerCaseFilter) || p.barcode?.includes(lowerCaseFilter));

    if (filteredProducts.length === 0 && filter.length > 2) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">Produk tidak ditemukan.</p>`;
        if (suggestionContainer) {
            suggestionContainer.classList.remove('hidden');
            const suggestionButton = document.createElement('button');
            suggestionButton.className = 'w-full bg-green-100 text-green-800 p-3 rounded-lg font-semibold hover:bg-green-200 transition-colors text-left flex items-center';
            suggestionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg> Tambah "${filter}" sebagai barang baru`;
            suggestionButton.onclick = () => openQuickAddModal(filter);
            suggestionContainer.appendChild(suggestionButton);
        }
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        const isOutOfStock = product.stock <= 0;
        card.className = `border rounded-lg p-3 flex flex-col items-center text-center transition-all relative ${isOutOfStock ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-blue-500'}`;
        card.dataset.productId = product.id;
        card.innerHTML = `<div class="relative"><img src="${product.image}" alt="${product.name}" class="w-24 h-24 object-cover mb-2 rounded-md bg-gray-100">${isOutOfStock ? `<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">STOK HABIS</div>` : ''}</div><p class="font-semibold text-sm flex-1">${product.name}</p><p class="text-blue-600 font-bold mt-1">${formatCurrency(product.price)}</p>`;
        if (!isOutOfStock) {
            card.addEventListener('click', (e) => {
                addToCart(product.id);
                e.currentTarget.classList.add('product-card-pulse');
                setTimeout(() => {
                    if (e.currentTarget) {
                       e.currentTarget.classList.remove('product-card-pulse');
                    }
                }, 300);
            });
        }
        container.appendChild(card);
    });
};


// --- CART LOGIC ---
const addToCart = (productId) => {
    const activeCart = activeCarts[currentActiveCartId];
    if (!activeCart) return;

    const products = getProductsFromStore();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = activeCart.items.find(item => item.productId === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) existingItem.quantity++;
        else showNotification(`Stok ${product.name} tidak mencukupi.`, 'error');
    } else {
        if (product.stock > 0) {
            activeCart.items.push({ productId, quantity: 1 });
        } else {
            showNotification(`Stok ${product.name} habis.`, 'error');
        }
    }
    renderCartItems();
};

const removeFromCart = (productId) => {
    const activeCart = activeCarts[currentActiveCartId];
    if (!activeCart) return;
    activeCart.items = activeCart.items.filter(item => item.productId !== productId);
    renderCartItems();
};

const updateCartQuantity = (productId, change) => {
    const activeCart = activeCarts[currentActiveCartId];
    if (!activeCart) return;
    
    const products = getProductsFromStore();
    const product = products.find(p => p.id === productId);
    const cartItem = activeCart.items.find(item => item.productId === productId);

    if (!cartItem || !product) return;
    const newQuantity = cartItem.quantity + change;
    
    if (newQuantity > product.stock) {
        showNotification(`Stok ${product.name} tidak mencukupi.`, 'error');
        return;
    }
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        cartItem.quantity = newQuantity;
        renderCartItems();
    }
};

const setCartQuantity = (productId, newQuantity) => {
    const activeCart = activeCarts[currentActiveCartId];
    if (!activeCart) return;

    const products = getProductsFromStore();
    const product = products.find(p => p.id === productId);
    const cartItem = activeCart.items.find(item => item.productId === productId);
    
    if (!cartItem || !product) return;
    const quantity = isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity;

    if (quantity > product.stock) {
        showNotification(`Stok ${product.name} tidak mencukupi (sisa ${product.stock}).`, 'error');
        const inputEl = document.querySelector(`.qty-input[data-product-id="${productId}"]`);
        if(inputEl) inputEl.value = cartItem.quantity;
        return;
    }

    if (quantity <= 0) {
        removeFromCart(productId);
    } else {
        cartItem.quantity = quantity;
        renderCartItems();
    }
};


// --- MODAL & PAYMENT LOGIC ---
const getCartTotal = () => {
    // ... (Fungsi ini tidak berubah)
    const activeCart = activeCarts[currentActiveCartId];
    if (!activeCart) return 0;
    
    const products = getProductsFromStore();
    return activeCart.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
};

const resetPaymentState = () => {
    // ... (Fungsi ini tidak berubah)
    paymentState = { step: 'method-selection', method: null, santri: null, cashReceived: 0, pin: '' };
    document.getElementById('cash-received').value = '';
    document.getElementById('cash-change-info').classList.add('hidden');
    document.getElementById('santri-id-input').value = '';
    document.getElementById('santri-pin-input').value = '';
    document.getElementById('santri-pin-error').classList.add('hidden');
};

const navigatePaymentStep = (nextStep) => {
    // ... (Fungsi ini tidak berubah)
    paymentState.step = nextStep;
    const steps = ['payment-step-1', 'payment-step-cash', 'payment-step-wallet-scan', 'payment-step-wallet-pin'];
    const btnBack = document.getElementById('btn-payment-back');
    const btnConfirm = document.getElementById('btn-payment-confirm');
    const btnCancel = document.getElementById('btn-payment-cancel');
    const modalTitle = document.getElementById('payment-modal-title');
    
    steps.forEach(stepId => document.getElementById(stepId).classList.add('hidden'));

    switch(nextStep) {
        case 'method-selection':
            document.getElementById('payment-step-1').classList.remove('hidden');
            modalTitle.textContent = 'Pembayaran';
            btnBack.classList.add('hidden');
            btnConfirm.classList.add('hidden');
            btnCancel.classList.remove('hidden');
            break;
        case 'cash':
            document.getElementById('payment-step-cash').classList.remove('hidden');
            modalTitle.textContent = 'Pembayaran Tunai';
            btnBack.classList.remove('hidden');
            btnConfirm.classList.remove('hidden');
            btnConfirm.disabled = true;
            btnCancel.classList.add('hidden');
            break;
        case 'wallet-scan':
            document.getElementById('payment-step-wallet-scan').classList.remove('hidden');
            modalTitle.textContent = 'Gunakan Kartu Santri';
            btnBack.classList.remove('hidden');
            btnConfirm.classList.add('hidden');
            btnCancel.classList.add('hidden');
            document.getElementById('santri-id-input').focus();
            break;
        case 'wallet-pin':
            document.getElementById('payment-step-wallet-pin').classList.remove('hidden');
            modalTitle.textContent = 'Konfirmasi & PIN';
            btnBack.classList.remove('hidden');
            btnConfirm.classList.remove('hidden');
            btnConfirm.disabled = true;
            btnCancel.classList.add('hidden');
            document.getElementById('santri-pin-input').focus();
            break;
    }
};

const openPaymentModal = () => {
    // ... (Fungsi ini tidak berubah)
    document.getElementById('payment-modal-total').textContent = formatCurrency(getCartTotal());
    paymentModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => paymentModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
    resetPaymentState();
    navigatePaymentStep('method-selection');
};

const closePaymentModal = () => {
    // ... (Fungsi ini tidak berubah)
    stopScanner();
    paymentModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        paymentModalEl.classList.replace('flex', 'hidden');
        if (!isTouchDevice()) {
            document.getElementById('product-search').focus();
        }
    }, 300);
};

const openHeldCartsModal = () => {
    // ... (Fungsi ini tidak berubah)
    renderHeldCartsList();
    heldCartsModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => heldCartsModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closeHeldCartsModal = () => {
    // ... (Fungsi ini tidak berubah)
    heldCartsModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => heldCartsModalEl.classList.replace('flex', 'hidden'), 300);
};

const stopScanner = () => {
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        html5QrCodeScanner.stop().catch(err => console.error("Gagal menghentikan scanner.", err));
    }
    html5QrCodeScanner = null;
    document.getElementById('manual-input-section').classList.remove('hidden');
    document.getElementById('scanner-section').classList.add('hidden');
}

const startScanner = () => {
    document.getElementById('manual-input-section').classList.add('hidden');
    document.getElementById('scanner-section').classList.remove('hidden');

    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) return;
    
    html5QrCodeScanner = new Html5Qrcode("qr-reader");
    
    const onScanSuccess = (decodedText) => {
        const santriInput = document.getElementById('santri-id-input');
        santriInput.value = decodedText;
        santriInput.dispatchEvent(new Event('change'));
        stopScanner();
    };

    html5QrCodeScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, (errorMessage) => {})
        .catch(err => {
            showNotification('Tidak bisa mengakses kamera.', 'error');
            stopScanner();
        });
}

const handleSantriIdSearch = async (e) => {
    const query = e.target.value;
    if (query.length < 3) return;

    document.getElementById('santri-scan-loading').classList.remove('hidden');
    const foundSantri = await findSantri(query);
    document.getElementById('santri-scan-loading').classList.add('hidden');
    
    if (foundSantri) {
        const cartTotal = getCartTotal();
        if (foundSantri.availableBalance >= cartTotal) {
            paymentState.santri = foundSantri;
            document.getElementById('santri-pin-image').src = foundSantri.image;
            document.getElementById('santri-pin-name').textContent = foundSantri.name;
            document.getElementById('santri-pin-balance').textContent = formatCurrency(foundSantri.availableBalance);
            navigatePaymentStep('wallet-pin');
        } else {
            showNotification(`Saldo ${foundSantri.name} tidak mencukupi.`, 'error');
            e.target.value = '';
        }
    } else {
        showNotification(`Santri dengan ID "${query}" tidak ditemukan.`, 'error');
        e.target.value = '';
    }
};

const handlePinVerification = async () => {
    const pin = document.getElementById('santri-pin-input').value;
    const btnConfirm = document.getElementById('btn-payment-confirm');
    btnConfirm.textContent = 'Memverifikasi...';
    btnConfirm.disabled = true;

    const result = await verifySantriPin(paymentState.santri.id, pin);
    const pinErrorEl = document.getElementById('santri-pin-error');
    
    if (result.success) {
        pinErrorEl.classList.add('hidden');
        await processTransaction();
    } else {
        pinErrorEl.textContent = 'PIN salah. Silakan coba lagi.';
        pinErrorEl.classList.remove('hidden');
        btnConfirm.textContent = 'Konfirmasi';
        btnConfirm.disabled = false;
        document.getElementById('santri-pin-input').value = '';
        document.getElementById('santri-pin-input').focus();
    }
};
const openQuickAddModal = (productName = '') => {
    quickAddForm.reset();
    document.getElementById('quick-add-name').value = productName;
    quickAddModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => quickAddModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closeQuickAddModal = () => {
    quickAddModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        quickAddModalEl.classList.replace('flex', 'hidden');
        if (!isTouchDevice()) {
            document.getElementById('product-search').focus();
        }
    }, 300);
};

const handleQuickAddFormSubmit = async (e) => {
    e.preventDefault();
    const productData = {
        name: document.getElementById('quick-add-name').value,
        costPrice: parseInt(document.getElementById('quick-add-cost-price').value) || 0,
        price: parseInt(document.getElementById('quick-add-price').value),
        stock: parseInt(document.getElementById('quick-add-stock').value),
        categoryId: DEFAULT_CATEGORY_ID,
        image: '',
    };

    if (!productData.name || !productData.price || !productData.stock) {
        showNotification('Nama, Harga Jual, dan Stok Awal wajib diisi.', 'error');
        return;
    }

    try {
        const newProduct = await saveProduct(productData, true);
        showNotification(`Produk "${newProduct.name}" berhasil ditambahkan.`);
        
        renderProductListKasir();
        addToCart(newProduct.id);
        updateBadges();
        
        closeQuickAddModal();
        document.getElementById('product-search').value = '';
    } catch (error) {
        showNotification('Gagal menyimpan produk baru.', 'error');
    }
};
/**
 * PERUBAHAN UTAMA: Fungsi ini sekarang memberikan notifikasi yang berbeda
 * tergantung pada status koneksi saat transaksi diproses.
 */
const processTransaction = async () => {
    const activeCart = activeCarts[currentActiveCartId];
    if (!activeCart) return;

    try {
        const paymentData = paymentState.method === 'cash' ? { method: 'cash' } : { method: 'wallet', santri: paymentState.santri };
        
        // Memanggil API yang sudah cerdas
        const result = await addTransaction({ 
            items: activeCart.items, 
            total: getCartTotal(), 
            payment: paymentData 
        });

        // Cek hasil dari API
        if (result && result.offline) {
            // Jika transaksi disimpan secara lokal
            showNotification('Koneksi terputus. Transaksi disimpan lokal.', 'info');
        } else {
            // Jika transaksi berhasil dikirim ke server
            showNotification('Transaksi berhasil!');
        }
        
        const cartToDeleteId = currentActiveCartId;
        closePaymentModal();
        deleteCart(cartToDeleteId);
        
        updateBadges();

    } catch (error) {
        showNotification(error.message, 'error');
        closePaymentModal();
    } finally {
        const btnConfirm = document.getElementById('btn-payment-confirm');
        if (btnConfirm) btnConfirm.textContent = 'Konfirmasi';
    }
};


// --- EVENT HANDLERS ---
const handleQtyButtonClick = (e) => updateCartQuantity(parseInt(e.currentTarget.dataset.productId), parseInt(e.currentTarget.dataset.change));
const handleQtyInputChange = (e) => {
    const newQuantity = parseInt(e.currentTarget.value);
    const productId = parseInt(e.currentTarget.dataset.productId);
    if (!isNaN(newQuantity) && !isNaN(productId)) {
        setCartQuantity(productId, newQuantity);
    }
};
const handleHoldCartClick = () => {
    showConfirmationModal({
        message: 'Beri nama untuk transaksi ini agar mudah diingat.',
        inputLabel: 'Nama Pelanggan / Catatan',
        callback: (inputValue) => {
            holdActiveCart(inputValue);
            closeConfirmModal();
        }
    });
};
const handleCartTabClick = (e) => {
    const tab = e.target.closest('.cart-tab-btn');
    if (!tab) return;
    
    const cartId = tab.dataset.cartId;
    const action = e.target.dataset.action;

    if (action === 'close') {
        showConfirmationModal({
            message: `Yakin ingin menutup keranjang "${activeCarts[cartId].name}"? Item di dalamnya akan hilang.`,
            callback: () => {
                deleteCart(cartId);
                closeConfirmModal();
            }
        });
    } else {
        switchToCart(cartId);
    }
};


// --- INITIALIZATION ---
let kasirEventListenersAdded = false;

function addEventListeners() {
    if (kasirEventListenersAdded) return;

    const searchInput = document.getElementById('product-search');
    searchInput.addEventListener('input', (e) => renderProductListKasir(e.target.value));
    
    if (!isTouchDevice()) {
        searchInput.addEventListener('blur', () => setTimeout(() => searchInput.focus(), 100));
    }
    
    document.getElementById('btn-bayar').addEventListener('click', openPaymentModal);
    document.getElementById('btn-hold-cart').addEventListener('click', handleHoldCartClick);
    document.getElementById('btn-new-cart').addEventListener('click', createNewCart);
    document.getElementById('btn-show-held-carts').addEventListener('click', openHeldCartsModal);
    cartTabsContainer.addEventListener('click', handleCartTabClick);
    
    paymentModalEl.querySelector('.modal-backdrop').addEventListener('click', closePaymentModal);
    heldCartsModalEl.querySelector('.modal-backdrop').addEventListener('click', closeHeldCartsModal);
    document.getElementById('btn-close-held-carts-modal').addEventListener('click', closeHeldCartsModal);
    
    document.getElementById('btn-payment-cancel').addEventListener('click', closePaymentModal);
    document.getElementById('btn-payment-back').addEventListener('click', () => {
        stopScanner(); 
        if (paymentState.step === 'wallet-pin') navigatePaymentStep('wallet-scan');
        else navigatePaymentStep('method-selection');
    });
    document.getElementById('btn-payment-confirm').addEventListener('click', () => {
        if (paymentState.step === 'cash') processTransaction();
        if (paymentState.step === 'wallet-pin') handlePinVerification();
    });
    paymentModalEl.querySelectorAll('.payment-method-btn').forEach(btn => btn.addEventListener('click', (e) => {
        paymentState.method = e.currentTarget.dataset.method;
        navigatePaymentStep(paymentState.method === 'cash' ? 'cash' : 'wallet-scan');
    }));
    document.getElementById('cash-received').addEventListener('input', (e) => {
        const cashReceived = parseInt(e.target.value) || 0;
        const total = getCartTotal();
        const change = cashReceived - total;
        const changeInfoEl = document.getElementById('cash-change-info');
        if (cashReceived >= total) {
            document.getElementById('cash-change').textContent = formatCurrency(change);
            changeInfoEl.classList.remove('hidden');
            document.getElementById('btn-payment-confirm').disabled = false;
        } else {
            changeInfoEl.classList.add('hidden');
            document.getElementById('btn-payment-confirm').disabled = true;
        }
    });
    paymentModalEl.querySelectorAll('.quick-cash-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const amount = e.target.dataset.amount;
        const cashReceivedInput = document.getElementById('cash-received');
        cashReceivedInput.value = amount || getCartTotal();
        cashReceivedInput.dispatchEvent(new Event('input'));
    }));
    document.getElementById('santri-id-input').addEventListener('change', handleSantriIdSearch);
    document.getElementById('santri-pin-input').addEventListener('input', (e) => {
        document.getElementById('btn-payment-confirm').disabled = e.target.value.length !== 6;
        document.getElementById('santri-pin-error').classList.add('hidden');
    });
    document.getElementById('btn-scan-qr').addEventListener('click', startScanner);
    quickAddForm.addEventListener('submit', handleQuickAddFormSubmit);
    document.getElementById('btn-cancel-quick-add').addEventListener('click', closeQuickAddModal);
    quickAddModalEl.querySelector('.modal-backdrop').addEventListener('click', closeQuickAddModal);

    kasirEventListenersAdded = true;
}

export function init() {
    activeCarts = {};
    heldCarts = {};
    currentActiveCartId = null;

    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.placeholder = 'Scan barcode atau cari nama/SKU...';
        if (!isTouchDevice()) {
            searchInput.focus();
        }
    }
    
    createNewCart();
    addEventListeners();
}

