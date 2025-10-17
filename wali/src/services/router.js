// src/services/router.js
// PEMBARUAN:
// - Rute untuk 'komunitas/diskusi-detail' telah dihapus karena kita akan menggunakan modal.
// - Logika penanganan rute dikembalikan ke versi yang lebih sederhana.

import { getSession, setActiveSantri } from './state.js';

const routes = {
    'login': { path: '/src/pages/halaman/login.html', script: '/src/pages/js/login.js' },
    'home': { path: '/src/pages/halaman/home.html', script: '/src/pages/js/home.js' },
    'notifikasi': { path: '/src/pages/halaman/notifikasi.html', script: '/src/pages/js/notifikasi.js' },
    'riwayat': { path: '/src/pages/halaman/riwayat.html', script: '/src/pages/js/riwayat.js' },
    'pesan': { path: '/src/pages/halaman/pesan.html', script: null },
    'akun': { path: '/src/pages/halaman/akun.html', script: '/src/pages/js/akun.js' },
    'detail_santri': { path: '/src/pages/halaman/detail_santri.html', script: '/src/pages/js/detail_santri.js' },
    'tagihan': { path: '/src/pages/halaman/daftar.html', script: '/src/pages/js/daftar.js' },
    'bayar': { path: '/src/pages/halaman/pembayaran.html', script: '/src/pages/js/pembayaran.js' },
    'go-ngaji': { path: '/src/pages/halaman/feed.html', script: '/src/pages/js/feed.js' },
    'komunitas/pengumuman': { path: '/src/pages/halaman/pengumuman.html', script: '/src/pages/js/pengumuman.js' },
    'komunitas/diskusi': { path: '/src/pages/halaman/diskusi.html', script: '/src/pages/js/diskusi.js' },
    'pengaturan/profil': { path: '/src/pages/halaman/profil.html', script: '/src/pages/js/profil.js' },
    'pengaturan/keamanan': { path: '/src/pages/halaman/keamanan.html', script: '/src/pages/js/keamanan.js' },
    'pengaturan/bantuan': { path: '/src/pages/halaman/bantuan.html', script: null },
    'go-kop/home': { path: '/src/pages/halaman/gokop-home.html', script: '/src/pages/js/gokop-home.js' },
    'go-kop/produk': { path: '/src/pages/halaman/produk-detail.html', script: '/src/pages/js/produk-detail.js' },
    'keranjang': { path: '/src/pages/halaman/keranjang.html', script: '/src/pages/js/keranjang.js' },
    'checkout': { path: '/src/pages/halaman/checkout.html', script: '/src/pages/js/checkout.js' },
    'riwayat/pesanan': { path: '/src/pages/halaman/pesanan_saya.html', script: '/src/pages/js/pesanan_saya.js' },
    'topup': { path: '/src/pages/halaman/topup.html', script: '/src/pages/js/topup.js' },
    'topup-payment': { path: '/src/pages/halaman/topup-payment.html', script: '/src/pages/js/topup-payment.js' },
};

const content = document.getElementById('app-content');
const mainLayout = {
    header: document.getElementById('main-header'),
    nav: document.getElementById('bottom-nav'),
    background: document.getElementById('app-background')
};
let currentPageKey = '';

async function loadPage(pageKey, params = []) {
    currentPageKey = pageKey;
    const route = routes[pageKey];

    if (!route) {
        const fullHash = `${pageKey}${params.length ? '/' + params.join('/') : ''}`;
        content.innerHTML = `<p class="p-8 text-center text-red-500">Error 404: Halaman <b>#${fullHash}</b> tidak terdaftar.</p>`;
        return;
    }

    const pageRoot = pageKey.split('/')[0];
    const showMainHeader = pageRoot === 'home';
    const showAppBackground = ['home', 'akun'].includes(pageRoot);
    
    if (mainLayout.header) mainLayout.header.style.display = showMainHeader ? 'flex' : 'none';
    if (mainLayout.background) {
        mainLayout.background.innerHTML = showAppBackground 
            ? `<div class="w-full h-72 bg-gradient-to-br from-emerald-500 to-green-600 rounded-b-[4rem]"></div>` 
            : '';
    }
    
    content.className = 'relative z-10 w-full flex-grow page-exit';
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        const response = await fetch(route.path);
        if (!response.ok) throw new Error(`Gagal memuat file: ${route.path}`);
        content.innerHTML = await response.text();
        
        if (route.script) {
            const pageModule = await import(route.script);
            if (pageModule.default) {
                await pageModule.default(...params); 
            }
        }
        lucide.createIcons();
    } catch (error) {
        console.error(`Gagal memuat halaman '${pageKey}':`, error);
        content.innerHTML = `<p class="p-8 text-center text-red-500">Gagal memuat halaman.</p>`;
    } finally {
        content.className = `relative z-10 w-full flex-grow page-enter`;
        window.scrollTo(0, 0);
    }
}

function toggleMainLayout(visible) {
    if (mainLayout.nav) mainLayout.nav.style.display = visible ? 'block' : 'none';
    
    if (visible) {
        content.style.paddingBottom = '7rem';
    } else {
        content.style.paddingBottom = '0';
    }
}

function handleRouteChange() {
    const session = getSession();
    const hash = window.location.hash.substring(1);
    
    const pageKeyWithParams = hash || (session ? 'home' : 'login');
    
    if (!session && pageKeyWithParams !== 'login') {
        window.location.hash = '#login';
        return;
    } else if (session && pageKeyWithParams === 'login') {
        window.location.hash = '#home';
        return;
    }

    const parts = pageKeyWithParams.split('/');
    let baseRoute = parts[0];
    let params = parts.slice(1);

    if (parts.length > 1 && routes[`${parts[0]}/${parts[1]}`]) {
        baseRoute = `${parts[0]}/${parts[1]}`;
        params = parts.slice(2);
    }
    
    if ((baseRoute === 'detail_santri' || baseRoute === 'go-kop/home' || baseRoute === 'topup') && params.length > 0) {
        setActiveSantri(params[0]);
    }

    const noLayoutPages = ['login', 'keranjang', 'checkout', 'go-kop/produk', 'bayar', 'topup', 'topup-payment'];
    const hasLayout = !noLayoutPages.includes(baseRoute);

    toggleMainLayout(hasLayout);
    loadPage(baseRoute, params);
    updateNavStatus(baseRoute);
}

function updateNavStatus(currentPageKey) {
    const navLinks = document.querySelectorAll('.nav-link');
    const pageRoot = currentPageKey.split('/')[0];
     navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').substring(1);
        const isActive = pageRoot === linkPage;
        link.classList.toggle('text-emerald-600', isActive);
        link.classList.toggle('text-slate-500', !isActive);
    });
}

export function initRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
}

