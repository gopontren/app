/**
 * src/js/ui.js
 * [PERBAIKAN BUG]
 * - Memperbaiki logika gestur geser-tutup (swipe down) pada modal.
 * - Menghapus syarat bahwa geseran harus dimulai dari handle/judul,
 * sehingga gestur bisa dimulai dari mana saja di area modal (selama tidak di-scroll).
 */
import { appState } from './app.js';

const modalContainer = document.getElementById('modal-container');
const toastContainer = document.getElementById('toast-container');

export function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast`;
    toast.innerHTML = `<span class="font-medium text-sm">${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add('show', `toast-${type}`); }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

export function createIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function updatePinDots(pinLength) {
    const dots = document.querySelectorAll('#pin-dots-container .pin-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('filled', index < pinLength);
    });
    const confirmBtn = document.querySelector('[data-action="confirm-pin"]');
    if (confirmBtn) {
        confirmBtn.classList.toggle('hidden', pinLength < 4);
    }
}

export async function openModal(name, data = null) {
    modalContainer.innerHTML = await generateModalTemplate(name, data);
    
    const modalOverlay = modalContainer.querySelector('.modal-overlay');
    const modalContent = modalContainer.querySelector('.modal-content');

    if (!modalOverlay || !modalContent) return;

    // Tampilkan modal
    setTimeout(() => {
        modalOverlay.classList.add('visible');
        createIcons();
        if (name === 'pin-entry') updatePinDots(appState.currentPin.length);
    }, 10);

    // --- LOGIKA GESER-TUTUP DIMULAI DI SINI ---
    let isDragging = false;
    let startY = 0;
    let deltaY = 0;

    const handleTouchStart = (e) => {
        // [PERBAIKAN] Cukup cek apakah modal sedang di-scroll atau tidak.
        // Jika tidak di-scroll (scrollTop === 0), maka gestur geser bisa dimulai.
        if (modalContent.scrollTop === 0) {
            isDragging = true;
            startY = e.touches[0].pageY;
            modalContent.classList.add('no-transition');
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const currentY = e.touches[0].pageY;
        deltaY = currentY - startY;

        // Hanya izinkan geser ke bawah
        if (deltaY > 0) {
            e.preventDefault(); // Mencegah scrolling halaman di belakang modal
            modalContent.style.transform = `translateY(${deltaY}px)`;
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;

        isDragging = false;
        modalContent.classList.remove('no-transition');
        
        // Jika digeser lebih dari 100px, tutup modal. Jika tidak, kembalikan.
        if (deltaY > 100) {
            closeModal();
        } else {
            modalContent.style.transform = 'translateY(0)';
        }

        // Reset deltaY
        deltaY = 0;
    };

    // Terapkan listener ke modal
    modalContent.addEventListener('touchstart', handleTouchStart, { passive: true });
    modalContent.addEventListener('touchmove', handleTouchMove);
    modalContent.addEventListener('touchend', handleTouchEnd);
}

export function closeModal(callback = () => {}) {
    const modal = modalContainer.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            if (callback && typeof callback === 'function') {
                callback();
            }
        }, 300);
    } else {
        if (callback && typeof callback === 'function') {
            callback();
        }
    }
}

async function generateModalTemplate(name, data) {
    const modalHandle = `<div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 modal-drag-handle"></div>`;

    switch(name) {
        case 'all-actions':
            const userPermissions = appState.currentUser?.permissions || [];
            const actionButtons = userPermissions
                .map(config => {
                    const actionData = JSON.stringify(config);
                    return `
                        <button data-action="process-permission" data-action-config='${actionData}' class="flex flex-col items-center justify-center text-center p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl space-y-2 transition-colors">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-${config.color}-100">
                                <i data-lucide="${config.icon}" class="h-6 w-6 text-${config.color}-600"></i>
                            </div>
                            <span class="font-semibold text-slate-700 text-xs">${config.label}</span>
                        </button>
                    `;
                }).join('');
            return `<div class="modal-overlay"><div class="modal-content p-6">${modalHandle}<h2 class="text-xl font-bold text-slate-800 mb-4 text-center">Semua Tindakan</h2><div class="grid grid-cols-4 gap-4">${actionButtons}</div><button data-action="close-modal" class="w-full mt-6 bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold">Tutup</button></div></div>`;
        
        case 'select-sub-action':
            const { handler, ...parentConfig } = data.permission;
            const config = handler.config;
            const subActionButtons = config.subActions.map(sub => {
                const combinedLabel = `${parentConfig.label} ${sub.label}`;
                const newConfig = { 
                    ...parentConfig, 
                    label: combinedLabel,
                    handler: { 
                        ...config.nextHandler, 
                        config: { ...config.nextHandler.config, pageTitle: combinedLabel, subActionKey: sub.key } 
                    } 
                };
                const actionData = JSON.stringify(newConfig);
                return `<button data-action="process-permission" data-action-config='${actionData}' class="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-lg font-semibold text-slate-700">${sub.label}</button>`;
            }).join('');
            return `<div class="modal-overlay"><div class="modal-content p-6">${modalHandle}<h2 class="text-xl font-bold text-slate-800 mb-4 text-center">${config.title}</h2><div class="space-y-3">${subActionButtons}</div><button data-action="go-back-modal" class="w-full mt-6 bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold">Kembali</button></div></div>`;
        
        case 'profile-settings':
            return `
                <div class="modal-overlay">
                    <div class="modal-content p-6">
                        ${modalHandle}
                        <h2 class="text-xl font-bold text-slate-800 mb-4 text-center">Pengaturan</h2>
                        <div class="space-y-3">
                            <button data-action="navigate-to-akun" class="w-full bg-slate-100 p-4 rounded-xl text-left font-medium text-slate-700 flex items-center justify-between">
                                <span><i data-lucide="user" class="inline-block mr-3 h-5 w-5 text-teal-700"></i> Akun Saya</span>
                                <i data-lucide="chevron-right" class="h-5 w-5 text-slate-400"></i>
                            </button>
                            <button data-action="navigate-to-pengaturan" class="w-full bg-slate-100 p-4 rounded-xl text-left font-medium text-slate-700 flex items-center justify-between">
                                <span><i data-lucide="settings" class="inline-block mr-3 h-5 w-5 text-teal-700"></i> Pengaturan Aplikasi</span>
                                <i data-lucide="chevron-right" class="h-5 w-5 text-slate-400"></i>
                            </button>
                        </div>
                         <button data-action="close-modal" class="w-full mt-6 bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold">Tutup</button>
                    </div>
                </div>`;

        case 'pin-entry':
            const pinKeys = [1,2,3,4,5,6,7,8,9,'',0,'del'].map(n => n==='del'?`<button data-action="pin-entry" data-key="del" class="h-16 flex items-center justify-center rounded-xl bg-slate-100 text-slate-800"><i data-lucide="delete" class="h-7 w-7"></i></button>`:n===''?`<div></div>`:`<button data-action="pin-entry" data-key="${n}" class="h-16 flex items-center justify-center rounded-xl bg-slate-100 text-slate-800">${n}</button>`).join('');
            return `<div class="modal-overlay"><div class="modal-content p-6">${modalHandle}<div class="text-center mb-6"><img src="${data.santri.photoUrl}" class="w-20 h-20 rounded-full mx-auto mb-3 ring-4 ring-teal-100"><h2 class="text-lg font-bold text-slate-800">${data.santri.name}</h2><p class="text-slate-500 text-sm">Masukkan PIN untuk konfirmasi.</p></div><div class="flex justify-center items-center gap-3 my-6" id="pin-dots-container"><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div></div><div class="grid grid-cols-3 gap-4 text-2xl font-bold">${pinKeys}</div><button data-action="confirm-pin" class="w-full mt-6 bg-teal-600 text-white py-3 rounded-xl font-semibold text-lg hidden">Konfirmasi</button></div></div>`;
        
        default: return '';
    }
}

