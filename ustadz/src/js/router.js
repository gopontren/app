/**
 * src/js/router.js
 * PEMBARUAN:
 * - Menambahkan halaman 'akunSaya' dan 'pengaturanAplikasi' ke dalam router.
 * - Mengimpor initializer untuk halaman-halaman baru.
 * - [BARU] Menambahkan halaman 'pengambilanPaket'.
 * - [BARU] Menambahkan tombol 'Ambil Paket' ke Smart Action Bar di halaman utama.
 */
import { appState } from './app.js';
import { initAkunSaya } from './pages/akunSaya.js';
import { initPengaturanAplikasi } from './pages/pengaturanAplikasi.js';
import { initBeranda } from './pages/beranda.js';
import { initProfil } from './pages/profil.js';
import { initLogin } from './pages/login.js';
import { initEditor } from './pages/editor.js';
import { initBulkScan } from './pages/bulkScan.js';
import { initPengambilanPaket } from './pages/pengambilanPaket.js'; // Impor baru
import { createIcons } from './ui.js';

const appContainer = document.getElementById('app-container');

const pageInitializers = {
    'profil': initProfil,
    'login': initLogin,
    'editor': initEditor,
    'bulkScan': initBulkScan,
    'akunSaya': initAkunSaya,
    'pengaturanAplikasi': initPengaturanAplikasi,
    'pengambilanPaket': initPengambilanPaket, // Entri baru
};

function camelToKebabCase(str) {
    // [DIUBAH] Tambahkan case untuk halaman baru
    if (['videoEditor', 'bulkScan', 'goDakwah', 'akunSaya', 'pengaturanAplikasi', 'pengambilanPaket'].includes(str)) return str;
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function fetchHtmlAsText(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Gagal memuat file HTML: ${url}. Pastikan file ada dan path-nya benar.`);
    }
    return response.text();
}

async function renderScreen(screenName, data, direction) {
    const oldScreen = appContainer.querySelector('.screen');
    const oldActionBar = appContainer.querySelector('.smart-action-bar');
    
    if (oldScreen) {
        oldScreen.classList.add(direction === 'forward' ? 'exit-left' : 'exit-right');
        oldScreen.addEventListener('transitionend', () => oldScreen.remove(), { once: true });
    }
    if (oldActionBar) {
        oldActionBar.remove();
    }

    let html = '';
    if (screenName === 'main') {
        html = `
            <div class="screen">
                <main id="main-content"></main>
            </div>
            <div class="smart-action-bar">
                <button data-action="process-permission" id="smart-action-main-btn" class="smart-action-main"></button>
                
                <!-- [BARU] Tombol Pengambilan Paket -->
                <button data-action="open-pickup-tasks" id="take-package-btn" class="smart-action-secondary relative">
                    <i data-lucide="package-check" class="h-6 w-6"></i>
                    <span id="pickup-badge" class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold hidden">
                        0
                    </span>
                </button>
                
                <button data-action="open-all-actions" id="smart-action-secondary-btn" class="smart-action-secondary">
                    <i data-lucide="layout-grid" class="h-6 w-6"></i>
                </button>
            </div>
        `;
    } else {
        const pageHtml = await fetchHtmlAsText(`src/pages/${camelToKebabCase(screenName)}.html`);
        html = `<div class="screen">${pageHtml}</div>`;
    }

    const newScreenContainer = document.createElement('div');
    newScreenContainer.innerHTML = html;
    
    while (newScreenContainer.firstChild) {
        appContainer.appendChild(newScreenContainer.firstChild);
    }

    const newScreenEl = appContainer.querySelector('.screen:not(.exit-left):not(.exit-right)');
    if (newScreenEl) {
        newScreenEl.classList.add(direction === 'forward' ? 'enter-right' : 'enter-left');
        setTimeout(() => {
            newScreenEl.classList.remove('enter-right', 'enter-left');
            
            createIcons();

            const initFn = pageInitializers[screenName];
            if (initFn) {
                initFn(data);
            } else if (screenName === 'main') {
                initBeranda();
            }
        }, 20);
    }
}

export function handleNavigation(pageName, data = null, direction = 'forward') {
    renderScreen(pageName, data, direction);
    
    if (pageName !== 'login' && direction === 'forward') {
       appState.screenHistory.push({ name: pageName, data: data });
    }
}
