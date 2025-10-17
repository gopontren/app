import { getCart, saveCart } from '/src/services/state.js';

let currentCart = [];

/**
 * Menghitung dan memperbarui total harga di UI.
 */
function updateTotalPrice() {
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total-price').textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.classList.toggle('disabled:bg-slate-400', currentCart.length === 0);
        checkoutButton.classList.toggle('disabled:cursor-not-allowed', currentCart.length === 0);
        checkoutButton.style.pointerEvents = currentCart.length === 0 ? 'none' : 'auto';
    }
}

/**
 * [DIUBAH] Merender daftar item di keranjang menggunakan <template>.
 */
function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const itemTemplate = document.getElementById('cart-item-template');
    const emptyTemplate = document.getElementById('empty-cart-template');

    if (!container || !itemTemplate || !emptyTemplate) {
        console.error("Elemen keranjang atau template tidak ditemukan!");
        return;
    }

    container.innerHTML = ''; // Kosongkan kontainer

    if (currentCart.length === 0) {
        const emptyClone = emptyTemplate.content.cloneNode(true);
        container.appendChild(emptyClone);
    } else {
        const fragment = document.createDocumentFragment();
        currentCart.forEach((item, index) => {
            const clone = itemTemplate.content.cloneNode(true);

            // Isi data ke dalam elemen-elemen template
            clone.querySelector('.cart-item-image').src = item.image;
            clone.querySelector('.cart-item-image').alt = item.name;
            clone.querySelector('.cart-item-name').textContent = item.name;
            clone.querySelector('.cart-item-price').textContent = `Rp ${item.price.toLocaleString('id-ID')}`;
            clone.querySelector('.cart-item-qty').textContent = item.quantity;

            // Tambahkan data-index ke tombol untuk identifikasi
            clone.querySelector('.decrease-qty-btn').dataset.index = index;
            clone.querySelector('.increase-qty-btn').dataset.index = index;
            clone.querySelector('.remove-item-btn').dataset.index = index;

            fragment.appendChild(clone);
        });
        container.appendChild(fragment);
    }

    lucide.createIcons();
    updateTotalPrice();
}

/**
 * Menangani perubahan pada keranjang (tambah/kurang/hapus) dan menyimpannya.
 * @param {number} index - Index item di dalam array keranjang.
 * @param {number|null} newQuantity - Kuantitas baru. Jika null, item akan dihapus.
 */
function updateCart(index, newQuantity) {
    if (newQuantity === null || newQuantity <= 0) {
        currentCart.splice(index, 1);
    } else {
        currentCart[index].quantity = newQuantity;
    }
    
    saveCart(currentCart);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    renderCartItems();
}

// Fungsi utama yang dipanggil oleh router
export default async function initKeranjang() {
    currentCart = getCart();
    renderCartItems();

    const container = document.getElementById('cart-items-container');
    if (container) {
        container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const index = parseInt(target.dataset.index);
            const item = currentCart[index];

            if (target.classList.contains('increase-qty-btn')) {
                updateCart(index, item.quantity + 1);
            } else if (target.classList.contains('decrease-qty-btn')) {
                updateCart(index, item.quantity - 1);
            } else if (target.classList.contains('remove-item-btn')) {
                updateCart(index, null);
            }
        });
    }

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', (e) => {
            if (currentCart.length === 0) {
                e.preventDefault(); // Mencegah navigasi jika keranjang kosong
            }
        });
    }
}
