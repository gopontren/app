import { updateMobileHeader } from './navigation.js';

/**
 * Mengelola routing dan pemuatan konten halaman secara dinamis.
 */
const routes = {
    '/': { template: 'src/pages/dashboard.html', script: './pages/dashboard.js', title: 'Dashboard' },
    '/kasir': { template: 'src/pages/kasir.html', script: './pages/kasir.js', title: 'Kasir' },
    '/pesanan': { template: 'src/pages/pesanan.html', script: './pages/pesanan.js', title: 'Pesanan Online' },
    '/notifikasi': { template: 'src/pages/notifikasi.html', script: './pages/notifikasi.js', title: 'Notifikasi' },
    '/produk': { template: 'src/pages/produk.html', script: './pages/produk.js', title: 'Manajemen Produk' },
    '/kategori': { template: 'src/pages/kategori.html', script: './pages/kategori.js', title: 'Kategori Produk' },
    '/supplier': { template: 'src/pages/supplier.html', script: './pages/supplier.js', title: 'Manajemen Supplier' },
    '/pembelian': { template: 'src/pages/pembelian.html', script: './pages/pembelian.js', title: 'Stok Masuk (Pembelian)' },
    '/pengeluaran': { template: 'src/pages/pengeluaran.html', script: './pages/pengeluaran.js', title: 'Pengeluaran' },
    '/laporan': { template: 'src/pages/laporan.html', script: './pages/laporan.js', title: 'Laporan' },
    '/saldo': { template: 'src/pages/saldo.html', script: './pages/saldo.js', title: 'Saldo E-Wallet' },
    '/stok_opname': { template: 'src/pages/stok_opname.html', script: './pages/stok_opname.js', title: 'Stok Opname' },
    '/pengaturan': { template: 'src/pages/pengaturan.html', script: './pages/pengaturan.js', title: 'Pengaturan' },
};

const appContent = document.getElementById('app-content');

/**
 * PERUBAHAN: Fungsi untuk menampilkan pesan error yang lebih ramah pengguna di UI.
 * @param {string} title - Judul pesan error.
 * @param {string} message - Detail pesan error.
 */
const renderErrorPage = (title, message) => {
    appContent.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-400 mb-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <h2 class="text-2xl font-bold text-gray-800">${title}</h2>
            <p class="mt-2">${message}</p>
            <p class="mt-1 text-sm text-gray-400">Silakan coba muat ulang halaman atau hubungi administrator.</p>
        </div>
    `;
};

const loadPage = async (path) => {
    const mainPath = path.split('?')[0] || '/';
    const route = routes[mainPath];

    // PERUBAHAN: Menangani rute yang tidak ditemukan
    if (!route) {
        console.error(`Route not found for path: ${mainPath}`);
        renderErrorPage('Halaman Tidak Ditemukan', `Halaman yang Anda tuju (${mainPath}) tidak ada.`);
        return;
    }
    
    try {
        const htmlResponse = await fetch(route.template);
        if (!htmlResponse.ok) {
            throw new Error(`Gagal memuat template halaman: ${htmlResponse.status} ${htmlResponse.statusText}`);
        }
        const html = await htmlResponse.text();
        appContent.innerHTML = html;

        setTimeout(async () => {
            try {
                const pageModule = await import(route.script);
                if (pageModule && typeof pageModule.init === 'function') {
                    const queryParams = new URLSearchParams(path.split('?')[1] || '');
                    await pageModule.init(queryParams);
                }
            } catch (scriptError) {
                console.error(`Error saat menjalankan skrip untuk ${mainPath}:`, scriptError);
                renderErrorPage('Terjadi Kesalahan Pada Halaman', scriptError.message);
            }
        }, 0);

        updateSidebarActiveState(mainPath);
    } catch (error) {
        console.error(`Error saat memuat halaman ${mainPath}:`, error);
        renderErrorPage('Gagal Memuat Halaman', error.message);
    }
};

const updateSidebarActiveState = (currentPath) => {
    let activeLinkElement = null;
    document.querySelectorAll('#sidebar-nav a').forEach(link => {
        const linkPath = new URL(link.href).hash.substring(1);
        const isActive = linkPath === currentPath;
        link.classList.toggle('active', isActive);
        if (isActive) {
            activeLinkElement = link;
        }
    });
    // Menangani kasus ketika path adalah '/'
    if (!activeLinkElement && currentPath === '/') {
         activeLinkElement = document.querySelector('#sidebar-nav a[href="#/"]');
         if (activeLinkElement) activeLinkElement.classList.add('active');
    }
    
    if (activeLinkElement) {
        updateMobileHeader(activeLinkElement);
    }
};

export const initRouter = () => {
    window.addEventListener('hashchange', () => {
        const path = window.location.hash.substring(1) || '/';
        loadPage(path);
    });
    const initialPath = window.location.hash.substring(1) || '/';
    loadPage(initialPath);
};
