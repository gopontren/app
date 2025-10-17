/**
 * src/js/main.js
 * [PEMBARUAN]
 * - Menyederhanakan logika 'go-back'.
 * - Menambahkan case baru 'open-pickup-tasks' untuk menangani navigasi
 * ke halaman pengambilan paket.
 */
import { handleNavigation } from './router.js';
import { appState } from './app.js';
import { openModal, closeModal, updatePinDots, showToast } from './ui.js';
import { stopScanner } from './pages/bulkScan.js';

function processPermission(permissionConfig) {
    if (!permissionConfig || !permissionConfig.handler) {
        console.error("Konfigurasi izin tidak valid:", permissionConfig);
        showToast("Aksi tidak valid atau rusak.", "error");
        return;
    }
    const { type, config } = permissionConfig.handler;
    switch (type) {
        case 'NAVIGATE':
            closeModal(() => handleNavigation(config.pageName));
            break;
        case 'GENERIC_SCAN':
            closeModal(() => handleNavigation('bulkScan', { permission: permissionConfig }));
            break;
        case 'SELECT_SUB_ACTION':
            closeModal(() => openModal('select-sub-action', { permission: permissionConfig }));
            break;
        default:
            console.error(`Handler type tidak dikenal: ${type}`);
            showToast("Tipe aksi tidak didukung.", "error");
            break;
    }
}

async function handleGlobalClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    target.style.pointerEvents = 'none';
    setTimeout(() => { target.style.pointerEvents = 'auto'; }, 500);

    const { action, actionConfig: actionConfigJson } = target.dataset;
    const actionConfig = actionConfigJson ? JSON.parse(actionConfigJson) : null;

    switch (action) {
        case 'login':
            handleNavigation('main');
            setTimeout(() => showToast('Login berhasil!', 'success'), 300);
            break;
        case 'logout':
            showToast('Anda berhasil keluar.');
            appState.screenHistory = []; 
            closeModal(() => handleNavigation('login', null, 'backward'));
            break;
        
        case 'go-back':
            const currentScreen = appState.screenHistory[appState.screenHistory.length - 1];
            if (currentScreen && currentScreen.name === 'bulkScan') {
                stopScanner();
            }

            if (appState.screenHistory.length > 1) {
                appState.screenHistory.pop();
                const previousScreen = appState.screenHistory[appState.screenHistory.length - 1];
                handleNavigation(previousScreen.name, previousScreen.data, 'backward');
            } else {
                handleNavigation('login', null, 'backward');
            }
            break;

        case 'open-all-actions':
            openModal('all-actions');
            break;
        case 'open-profile':
            handleNavigation('profil');
            break;
        // [BARU] Aksi untuk membuka halaman pengambilan paket
        case 'open-pickup-tasks':
            handleNavigation('pengambilanPaket');
            break;
        case 'open-profile-settings':
            openModal('profile-settings');
            break;
        case 'navigate-to-akun':
            closeModal(() => handleNavigation('akunSaya'));
            break;
        case 'navigate-to-pengaturan':
            closeModal(() => handleNavigation('pengaturanAplikasi'));
            break;
        case 'create-new-content':
            if (actionConfig && actionConfig.isEditor) {
                handleNavigation(actionConfig.editorPage || 'editor', actionConfig.editorParams);
            }
            break;
        case 'go-back-modal':
            closeModal(() => openModal('all-actions'));
            break;
        case 'close-modal':
            closeModal();
            break;
        case 'process-permission':
             if (actionConfig) {
                processPermission(actionConfig);
            }
            break;
        case 'pin-entry':
            const { key } = target.dataset;
            if (key === 'del') {
                appState.currentPin = appState.currentPin.slice(0, -1);
            } else if (appState.currentPin.length < 4) {
                appState.currentPin += key;
            }
            updatePinDots(appState.currentPin.length);
            break;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', handleGlobalClick);
    handleNavigation('login');
});
