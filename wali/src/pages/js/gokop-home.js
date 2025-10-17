import { getStoreProducts, getPromoBanner } from '/src/services/api.js';
import { getCartItemCount } from '/src/services/state.js';
// [DIHAPUS] Import untuk createProductGridSkeleton tidak lagi diperlukan
// karena skeleton loader awal sudah ada di file HTML.

// --- Variabel State untuk Infinite Scroll ---
let currentPage = 1;
let isLoading = false;
let hasMoreProducts = true;
let currentSearchTerm = '';
const appContent = document.getElementById('app-content');
const appContainer = document.getElementById('app-container');

/**
 * [DIUBAH] Merender kartu produk ke dalam grid menggunakan <template>.
 * @param {Array} products - Daftar produk yang akan dirender.
 * @param {boolean} replace - Jika true, ganti konten. Jika false, tambahkan.
 */
function renderProductGrid(products, replace = false) {
    const gridContainer = document.getElementById('product-grid');
    const template = document.getElementById('product-card-template');

    if (!gridContainer || !template) {
        console.error("Grid container or product template not found!");
        return;
    }

    if (replace) {
        gridContainer.innerHTML = ''; // Hapus skeleton loader atau konten lama
    }
    
    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        const clone = template.content.cloneNode(true);

        // Isi data ke dalam elemen-elemen template
        const link = clone.querySelector('.product-card-link');
        link.href = `#go-kop/produk/${product.id}`;

        const image = clone.querySelector('.product-image');
        image.src = product.image;
        image.alt = product.name;

        clone.querySelector('.product-store').textContent = product.store;
        clone.querySelector('.product-name').textContent = product.name;
        clone.querySelector('.product-price').textContent = `Rp ${product.price.toLocaleString('id-ID')}`;
        
        fragment.appendChild(clone);
    });

    gridContainer.appendChild(fragment);
}


/**
 * Memperbarui badge jumlah item di ikon keranjang.
 */
function updateCartBadge() {
    const badge = document.getElementById('cart-item-count-badge');
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
 * Fungsi utama untuk memuat produk.
 */
async function loadProducts() {
    if (isLoading || !hasMoreProducts) return;

    isLoading = true;
    const loader = document.getElementById('product-loader');
    if (loader) loader.classList.remove('hidden');

    try {
        const response = await getStoreProducts({ page: currentPage, search: currentSearchTerm });
        const { data, pagination } = response;

        if (data && data.length > 0) {
            renderProductGrid(data, currentPage === 1);
            currentPage++;
            hasMoreProducts = currentPage <= pagination.totalPages;
        } else {
            hasMoreProducts = false;
            if (currentPage === 1) {
                 document.getElementById('product-grid').innerHTML = `<p class="col-span-full text-center text-slate-500 py-10">Produk tidak ditemukan.</p>`;
            }
        }
    } catch (error) {
        console.error("Gagal memuat produk:", error);
        document.getElementById('product-grid').innerHTML = `<p class="col-span-full text-center text-red-500 py-10">Gagal memuat produk.</p>`;
    } finally {
        isLoading = false;
        if (loader) loader.classList.add('hidden');
    }
}

/**
 * Menangani event scroll untuk memuat produk baru.
 */
const handleScroll = () => {
    // Pastikan appContent ada sebelum menambahkan event listener
    if (!appContent) return;
    const { scrollTop, scrollHeight, clientHeight } = appContent;
    if (scrollHeight - scrollTop <= clientHeight + 200) {
        loadProducts();
    }
};

/**
 * Reset state dan muat ulang produk (untuk pencarian baru).
 */
function resetAndLoadProducts() {
    currentPage = 1;
    hasMoreProducts = true;
    if (appContent) appContent.scrollTop = 0;
    
    const gridContainer = document.getElementById('product-grid');
    if (gridContainer) gridContainer.innerHTML = ''; // Hapus konten saat ini
    
    loadProducts();
}

/**
 * Membuat dan menambahkan tombol FAB ke kontainer utama aplikasi.
 */
function createAndAttachFAB() {
    if (document.getElementById('open-search-modal-btn')) return;

    const fab = document.createElement('button');
    fab.id = 'open-search-modal-btn';
    fab.className = 'fixed bottom-24 right-8 bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition transform hover:scale-110 z-30';
    fab.innerHTML = '<i data-lucide="search" class="w-6 h-6"></i>';
    
    if (appContainer) {
        appContainer.appendChild(fab);
        lucide.createIcons();
    }
    
    return fab;
}

/**
 * Memuat dan merender banner promosi.
 */
async function loadAndRenderBanner() {
    const bannerContainer = document.getElementById('gokop-promo-banner-container');
    if (!bannerContainer) return;

    try {
        const response = await getPromoBanner();
        const banner = response.data;
        if (banner && banner.aktif) {
            bannerContainer.innerHTML = `
                <a href="${banner.linkUrl}" class="block rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20">
                    <img src="${banner.imageUrl}" alt="Banner Promosi Go-Kop" class="w-full h-auto object-cover">
                </a>
            `;
        } else {
            bannerContainer.innerHTML = '';
        }
    } catch (error) {
        console.error("Gagal memuat banner promosi:", error);
        bannerContainer.innerHTML = `
            <div class="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-4 text-center">
                <p class="font-bold">Selamat Datang di Go-Kop!</p>
                <p class="text-sm opacity-90">Semua kebutuhan santri ada di sini.</p>
            </div>
        `;
    }
}

/**
 * Mengatur semua event listener untuk halaman.
 */
function setupEventListeners() {
    const openSearchBtn = document.getElementById('open-search-modal-btn');
    const searchInput = document.getElementById('product-search-input');
    const searchModal = document.getElementById('search-modal');
    const searchModalContent = document.getElementById('search-modal-content');
    const closeSearchBtn = document.getElementById('close-search-modal-btn');
    const productListTitle = document.getElementById('product-list-title');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    if (!openSearchBtn || !searchInput || !searchModal) return;

    openSearchBtn.addEventListener('click', () => {
        searchModal.classList.remove('hidden');
        setTimeout(() => {
            searchModalContent.classList.remove('opacity-0', 'scale-95');
            searchInput.focus();
        }, 10);
    });

    const closeModal = () => {
        searchModalContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => searchModal.classList.add('hidden'), 300);
    };

    closeSearchBtn.addEventListener('click', closeModal);
    searchModal.addEventListener('click', (e) => (e.target === searchModal) && closeModal());
    
    const updateSearchUI = (searchTerm) => {
        if (productListTitle) {
            if (searchTerm) {
                productListTitle.innerHTML = `Hasil untuk: "<span class="text-emerald-600">${searchTerm}</span>"`;
                clearSearchBtn.classList.remove('hidden');
            } else {
                productListTitle.textContent = 'Semua Produk';
                clearSearchBtn.classList.add('hidden');
            }
        }
    };
    
    const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        if (currentSearchTerm !== searchTerm) {
            currentSearchTerm = searchTerm;
            updateSearchUI(searchTerm);
            resetAndLoadProducts();
        }
    };

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 500);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            performSearch();
            closeModal();
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        updateSearchUI('');
        resetAndLoadProducts();
    });
    
    appContent.addEventListener('scroll', handleScroll);
    window.addEventListener('cartUpdated', updateCartBadge);
}

// Fungsi utama yang dipanggil oleh router
export default async function initGoKopHome() {
    currentPage = 1;
    isLoading = false;
    hasMoreProducts = true;
    currentSearchTerm = '';

    const fab = createAndAttachFAB();
    loadAndRenderBanner();
    updateCartBadge();
    setupEventListeners();
    
    // Panggil loadProducts setelah event listener di-setup
    // Skeleton loader di HTML akan tampil sampai data dimuat.
    loadProducts();
    
    // Logika pembersihan saat halaman ditutup
    const observer = new MutationObserver((mutations, obs) => {
        if (appContent && !appContent.contains(document.getElementById('product-grid'))) {
            appContent.removeEventListener('scroll', handleScroll);
            const fabEl = document.getElementById('open-search-modal-btn');
            if (fabEl) fabEl.remove(); 
            obs.disconnect(); 
        }
    });
    if (appContent) {
        observer.observe(appContent, { childList: true, subtree: true });
    }
}

