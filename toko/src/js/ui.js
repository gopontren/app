import { getOnlineOrders, getNotifications } from './api.js';

/**
 * Berisi fungsi-fungsi pembantu untuk memanipulasi User Interface (UI).
 */

// --- STATE & ELEMENT SELECTORS ---
let connectionStatusIndicator;

// --- FORMATTERS ---
export const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);

export const formatDateTime = (date) =>
    new Date(date).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });


// --- NOTIFICATION ---
const notificationEl = document.getElementById('notification');
const notificationMessageEl = document.getElementById('notification-message');

export const showNotification = (message, type = 'success') => {
    notificationMessageEl.textContent = message;
    
    notificationEl.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500');
    
    if (type === 'success') {
        notificationEl.classList.add('bg-green-500');
    } else if (type === 'error') {
        notificationEl.classList.add('bg-red-500');
    } else { // 'info' atau lainnya
        notificationEl.classList.add('bg-blue-500');
    }

    notificationEl.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        notificationEl.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
};


// --- UI ELEMENT UPDATES ---
export const updateBadges = async () => {
    try {
        const [orders, notifications] = await Promise.all([
            getOnlineOrders(),
            getNotifications()
        ]);

        const newOrdersCount = orders.filter(o => o.status === 'baru').length;
        const orderBadge = document.getElementById('order-notification-badge');
        if (orderBadge) {
            orderBadge.textContent = newOrdersCount;
            orderBadge.classList.toggle('hidden', newOrdersCount === 0);
        }

        const unreadNotifCount = notifications.filter(n => !n.read).length;
        const notifBadge = document.getElementById('notification-badge');
        if (notifBadge) {
            notifBadge.textContent = unreadNotifCount;
            notifBadge.classList.toggle('hidden', unreadNotifCount === 0);
        }

    } catch (error) {
        console.error("Gagal memperbarui badges notifikasi:", error);
        const orderBadge = document.getElementById('order-notification-badge');
        if (orderBadge) orderBadge.classList.add('hidden');
        const notifBadge = document.getElementById('notification-badge');
        if (notifBadge) notifBadge.classList.add('hidden');
    }
};

export const updateConnectionStatusIndicator = (isOnline) => {
    if (!connectionStatusIndicator) return;

    if (isOnline) {
        connectionStatusIndicator.innerHTML = `
            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-green-700">Online</span>
        `;
    } else {
        connectionStatusIndicator.innerHTML = `
            <span class="w-3 h-3 bg-gray-400 rounded-full"></span>
            <span class="text-gray-600">Offline</span>
        `;
    }
};


// --- FUNGSI PAGINASI TERPUSAT ---
export const renderPaginationControls = (containerId, { totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <span class="text-sm text-gray-700">
            Menampilkan <span class="font-semibold">${((currentPage - 1) * itemsPerPage) + 1}</span> - <span class="font-semibold">${Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span class="font-semibold">${totalItems}</span>
        </span>
        <div class="inline-flex mt-2 xs:mt-0">
            <button id="prev-page-btn-${containerId}" class="py-2 px-4 text-sm font-medium text-white bg-gray-800 rounded-l hover:bg-gray-900 disabled:bg-gray-400">Sebelumnya</button>
            <button id="next-page-btn-${containerId}" class="py-2 px-4 text-sm font-medium text-white bg-gray-800 rounded-r border-0 border-l border-gray-700 hover:bg-gray-900 disabled:bg-gray-400">Selanjutnya</button>
        </div>
    `;

    const prevBtn = document.getElementById(`prev-page-btn-${containerId}`);
    const nextBtn = document.getElementById(`next-page-btn-${containerId}`);

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;

    if (!prevBtn.disabled) {
        prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
    }
    if (!nextBtn.disabled) {
        nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
    }
};


// --- CONFIRMATION MODAL ---
let confirmModalEl, confirmMessageEl, confirmCancelBtn, confirmActionBtn;
let confirmInputContainer, confirmInputLabel, confirmInputField;
let onConfirmCallback = () => {};

const openConfirmModal = () => {
    if (!confirmModalEl) return;
    confirmModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => {
        confirmModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
    }, 10);
};

export const closeConfirmModal = () => {
    if (!confirmModalEl) return;
    confirmModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        confirmModalEl.classList.replace('flex', 'hidden');
    }, 300);
};

export const showConfirmationModal = (options) => {
    if (!confirmModalEl) {
        console.error('Confirmation modal element not found. Was initUI() called?');
        return;
    }
    
    // Default to an object if options is not provided
    const { message, callback, inputLabel } = options || {};

    confirmMessageEl.innerHTML = message || 'Apakah Anda yakin?';
    onConfirmCallback = callback || (() => {});

    if (inputLabel) {
        confirmInputLabel.textContent = inputLabel;
        confirmInputField.value = ''; 
        confirmInputField.placeholder = `${inputLabel}...`;
        confirmInputContainer.classList.remove('hidden');
    } else {
        confirmInputContainer.classList.add('hidden');
    }

    openConfirmModal();
};

export function initUI() {
    connectionStatusIndicator = document.getElementById('connection-status');
    updateConnectionStatusIndicator(navigator.onLine);

    confirmModalEl = document.getElementById('confirmation-modal');
    if (confirmModalEl) {
        confirmMessageEl = document.getElementById('confirmation-message');
        confirmCancelBtn = document.getElementById('btn-confirm-cancel');
        confirmActionBtn = document.getElementById('btn-confirm-action');
        confirmInputContainer = document.getElementById('confirmation-input-container');
        confirmInputLabel = document.getElementById('confirmation-input-label');
        confirmInputField = document.getElementById('confirmation-input-field');

        confirmCancelBtn.addEventListener('click', closeConfirmModal);
        
        confirmActionBtn.addEventListener('click', () => {
            let inputValue = null;
            if (!confirmInputContainer.classList.contains('hidden')) {
                inputValue = confirmInputField.value.trim();
            }
            onConfirmCallback(inputValue);
        });
        
        confirmModalEl.querySelector('.modal-backdrop').addEventListener('click', closeConfirmModal);
    }
}

