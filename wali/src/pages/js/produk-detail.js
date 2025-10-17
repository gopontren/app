import { getProductDetail } from '/src/services/api.js';
import { addItemToCart, getCartItemCount } from '/src/services/state.js';

// Variabel untuk menyimpan data produk dan kuantitas
let currentProduct = null;
let currentQuantity = 1;

/**
 * Menampilkan notifikasi singkat (toast) di bagian bawah layar.
 * @param {string} message - Pesan yang akan ditampilkan.
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-semibold py-2 px-5 rounded-full shadow-lg z-50 animate-fade-in-out';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

/**
 * Memperbarui UI berdasarkan data produk yang diterima.
 * @param {object} product - Data produk dari API.
 */
function renderProductData(product) {
    document.getElementById('product-image').src = product.image;
    document.getElementById('product-store').textContent = product.store;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `Rp ${product.price.toLocaleString('id-ID')}`;
    document.getElementById('product-description').textContent = product.description;

    // Sembunyikan skeleton loader dan tampilkan konten asli
    document.getElementById('product-skeleton-loader').classList.add('hidden');
    document.getElementById('footer-skeleton-loader').classList.add('hidden');
    document.getElementById('product-real-content').classList.remove('hidden');
    document.getElementById('product-action-footer').classList.remove('hidden');
}


/**
 * Memperbarui badge jumlah item di ikon keranjang.
 */
function updateCartBadge() {
    const badge = document.getElementById('detail-cart-badge');
    const count = getCartItemCount();
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}


/**
 * Mengatur event listener untuk tombol dan input kuantitas.
 */
function setupEventListeners() {
    const decreaseBtn = document.getElementById('decrease-qty-btn');
    const increaseBtn = document.getElementById('increase-qty-btn');
    const quantityInput = document.getElementById('quantity-input');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    // Mengurangi kuantitas
    decreaseBtn.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            quantityInput.value = currentQuantity;
            decreaseBtn.disabled = currentQuantity === 1;
        }
    });

    // Menambah kuantitas
    increaseBtn.addEventListener('click', () => {
        currentQuantity++;
        quantityInput.value = currentQuantity;
        decreaseBtn.disabled = false;
    });

    // Menangani input manual
    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        if (isNaN(value) || value < 1) {
            value = 1;
        }
        currentQuantity = value;
        quantityInput.value = currentQuantity;
        decreaseBtn.disabled = currentQuantity === 1;
    });

    // Menambahkan ke keranjang
    addToCartBtn.addEventListener('click', () => {
        if (currentProduct) {
            addItemToCart(currentProduct, currentQuantity);
            showToast(`${currentQuantity}x ${currentProduct.name} ditambahkan`);
            updateCartBadge();
        }
    });
}

// Fungsi utama yang dipanggil oleh router
export default async function initProdukDetail(productId) {
    if (!productId) {
        document.getElementById('product-detail-content').innerHTML = `<p class="p-8 text-center text-red-500">ID Produk tidak valid.</p>`;
        return;
    }
    
    try {
        const productResponse = await getProductDetail(productId);
        currentProduct = productResponse.data;

        if (currentProduct) {
            renderProductData(currentProduct);
            setupEventListeners();
            updateCartBadge();
            window.addEventListener('cartUpdated', updateCartBadge);
        } else {
            throw new Error('Produk tidak ditemukan.');
        }
    } catch (error) {
        console.error("Gagal memuat detail produk:", error);
        document.getElementById('product-detail-content').innerHTML = `<p class="p-8 text-center text-red-500">${error.message}</p>`;
        document.getElementById('product-action-footer').classList.add('hidden');
        document.getElementById('footer-skeleton-loader').classList.add('hidden');
    }
}
