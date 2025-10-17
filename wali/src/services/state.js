// src/services/state.js

// File ini berfungsi sebagai "sumber kebenaran" untuk data sesi dan status UI.

const APP_STATE_KEY = 'goPontrenSession';
const CART_STATE_KEY = 'goPontrenCart'; // Kunci baru untuk data keranjang

/**
 * Menyimpan data sesi pengguna ke localStorage.
 * @param {object} sessionData - Data yang didapat setelah login (user, token).
 */
export function saveSession(sessionData) {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(sessionData));
}

/**
 * Mengambil data sesi pengguna dari localStorage.
 * @returns {object | null} Data sesi yang tersimpan atau null jika tidak ada.
 */
export function getSession() {
    const session = localStorage.getItem(APP_STATE_KEY);
    return session ? JSON.parse(session) : null;
}

/**
 * Menghapus sesi pengguna (untuk logout).
 */
export function clearSession() {
    localStorage.removeItem(APP_STATE_KEY);
    localStorage.removeItem(CART_STATE_KEY); // Hapus juga keranjang saat logout
}

/**
 * Mengatur santri yang sedang aktif di aplikasi.
 * @param {string} santriId - ID santri yang dipilih.
 */
export function setActiveSantri(santriId) {
    const session = getSession();
    if (session) {
        session.activeSantriId = santriId;
        saveSession(session);
    }
}

/**
 * Mendapatkan ID santri yang sedang aktif.
 * @returns {string | null} ID santri yang aktif atau null.
 */
export function getActiveSantriId() {
    const session = getSession();
    // Jika ada sesi tapi santri aktif belum diatur, default ke santri pertama
    if (session && !session.activeSantriId && session.user.santri.length > 0) {
        session.activeSantriId = session.user.santri[0];
        saveSession(session);
    }
    return session ? session.activeSantriId : null;
}


// --- FUNGSI BARU UNTUK MANAJEMEN KERANJANG GO-KOP ---

/**
 * Mengambil data keranjang dari localStorage.
 * @returns {Array} Array item di keranjang.
 */
export function getCart() {
    const cart = localStorage.getItem(CART_STATE_KEY);
    return cart ? JSON.parse(cart) : [];
}

/**
 * Menyimpan data keranjang ke localStorage.
 * @param {Array} cartData - Array item keranjang yang akan disimpan.
 */
export function saveCart(cartData) {
    localStorage.setItem(CART_STATE_KEY, JSON.stringify(cartData));
}

/**
 * Menambahkan item ke keranjang. Jika item sudah ada, kuantitasnya akan ditambah.
 * @param {object} product - Objek produk yang akan ditambahkan.
 * @param {number} quantity - Jumlah yang akan ditambahkan.
 */
export function addItemToCart(product, quantity) {
    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
        // Jika produk sudah ada, tambahkan kuantitasnya
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Jika produk baru, tambahkan ke keranjang
        cart.push({ ...product, quantity: quantity });
    }
    saveCart(cart);
}

/**
 * Menghitung total item di dalam keranjang (bukan jenis itemnya, tapi total kuantitas).
 * @returns {number} Jumlah total item.
 */
export function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Mengosongkan seluruh isi keranjang.
 */
export function clearCart() {
    localStorage.removeItem(CART_STATE_KEY);
    // Kirim event agar UI lain bisa tahu keranjang dikosongkan
    window.dispatchEvent(new CustomEvent('cartUpdated'));
}