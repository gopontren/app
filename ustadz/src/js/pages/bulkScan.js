/**
 * src/js/pages/bulkScan.js
 * PEMBARUAN TOTAL UNTUK FITUR PERIZINAN:
 * - Logika `handleScan` kini memeriksa status santri terlebih dahulu.
 * - Jika santri berstatus 'izin', akan muncul pop-up informasi izin
 * dan proses absensi dihentikan untuk santri tersebut.
 * - Jika santri 'aktif', proses absensi berjalan seperti biasa.
 * - Memisahkan fungsi pop-up untuk sukses dan info izin.
 */
import { appState } from '../app.js';
import { getSantriById, postScanResult } from '../api.js';
import { createIcons, showToast } from '../ui.js';

let scannedSantriIds = new Set();
let currentActionConfig = null;
let html5QrCode = null;

/**
 * Menampilkan pop-up notifikasi setelah scan.
 * @param {object} santri - Data santri.
 * @param {boolean} isPermitted - Apakah santri sedang dalam status izin.
 */
function showResultPopup(santri, isPermitted = false) {
    const popup = document.getElementById('bulk-scan-result-popup');
    if (!popup) return;

    popup.classList.remove('status-izin', 'status-sukses'); // Reset classes

    if (isPermitted) {
        popup.classList.add('status-izin');
        popup.innerHTML = `
            <img src="${santri.photoUrl}" class="w-12 h-12 rounded-full bg-slate-200">
            <div class="flex-grow">
                <p class="font-bold text-slate-800">${santri.name}</p>
                <p class="text-sm text-amber-700 font-semibold uppercase">STATUS: IZIN</p>
                <p class="text-xs text-slate-500 mt-1">${santri.permitInfo || 'Keterangan tidak tersedia.'}</p>
            </div>
            <i data-lucide="alert-circle" class="h-8 w-8 text-amber-500 flex-shrink-0"></i>
        `;
    } else {
        popup.classList.add('status-sukses');
        popup.innerHTML = `
            <img src="${santri.photoUrl}" class="w-12 h-12 rounded-full bg-slate-200">
            <div class="flex-grow">
                <p class="font-bold text-slate-800">${santri.name}</p>
                <p class="text-sm text-green-600 font-semibold">Berhasil Dicatat</p>
            </div>
            <i data-lucide="check-circle" class="h-8 w-8 text-green-500 flex-shrink-0"></i>
        `;
    }
    
    createIcons();
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3500); // Durasi notifikasi diperpanjang sedikit
}


function updateCounter() {
    const counterEl = document.getElementById('bulk-scan-counter')?.querySelector('p');
    if (counterEl) {
        counterEl.textContent = scannedSantriIds.size;
    }
}

async function handleScan(santriId) {
    // Cek duplikasi scan dalam sesi ini
    if (scannedSantriIds.has(santriId)) {
        const alreadyScannedToast = document.querySelector('.toast.already-scanned');
        if (!alreadyScannedToast) { // Tampilkan toast hanya jika belum ada
            const toast = showToast(`${santriId} sudah dipindai.`, 'info', 2000);
            if(toast) toast.classList.add('already-scanned');
        }
        return;
    }

    if ('vibrate' in navigator) navigator.vibrate(100);

    try {
        const santri = await getSantriById(santriId);
        
        // --- [LOGIKA INTI PERIZINAN] ---
        // Cek status santri SEBELUM memproses absensi.
        if (santri.status !== 'active') {
            showResultPopup(santri, true); // Tampilkan pop-up info izin
            return; // Hentikan proses, jangan catat absensi
        }
        // ------------------------------------

        scannedSantriIds.add(santriId); // Tambahkan ke set setelah dipastikan aktif

        const handlerConfig = currentActionConfig.handler.config;
        const payload = {
            santriId: santri.id,
            activityLabel: currentActionConfig.label,
            timestamp: new Date().toISOString(),
            recordedBy: appState.currentUser.id,
            ...(handlerConfig.subActionKey && { subAction: handlerConfig.subActionKey })
        };
        
        await postScanResult(handlerConfig.apiEndpoint, payload);
        
        updateCounter();
        showResultPopup(santri, false); // Tampilkan pop-up sukses

    } catch (error) {
        showToast(`Gagal: ${error.message}`, 'error');
        console.error("Gagal memproses scan:", error);
    }
}

function startScanner() {
    const viewfinder = document.getElementById('scanner-viewfinder');
    if (!viewfinder) {
        console.error("Elemen viewfinder scanner tidak ditemukan.");
        return;
    }
    
    if (typeof Html5Qrcode === 'undefined') {
        showToast("Gagal memuat library scanner.", 'error');
        return;
    }

    html5QrCode = new Html5Qrcode("scanner-viewfinder");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onScanSuccess = (decodedText, decodedResult) => {
        handleScan(decodedText);
    };
    
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, (error) => {})
        .catch(err => {
            console.error("Tidak dapat memulai scanner", err);
            viewfinder.innerHTML = `<div class="p-4 text-center text-white/50 text-sm">Gagal mengakses kamera. Pastikan Anda telah memberikan izin.</div>`;
        });
}

export function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("QR Code scanner dihentikan.");
        }).catch(err => {
            console.error("Gagal menghentikan scanner.", err);
        });
        html5QrCode = null;
    }
}

export function initBulkScan(permissionConfig) {
    scannedSantriIds.clear();
    currentActionConfig = permissionConfig;

    const titleEl = document.getElementById('bulk-scan-title');
    const pageTitle = permissionConfig?.handler?.config?.pageTitle || permissionConfig?.label || 'Pindai Kartu';
    
    if (titleEl) {
        titleEl.textContent = pageTitle;
    }
    
    updateCounter();
    createIcons();
    
    setTimeout(startScanner, 300);
}
