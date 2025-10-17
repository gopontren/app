import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api.js';
import { formatDateTime, updateBadges } from '../ui.js';

// --- STATE & ELEMENT SELECTORS ---
let notifications = [];
const container = document.getElementById('notification-list-container');
const markAllReadBtn = document.getElementById('btn-mark-all-read');

// --- RENDER FUNCTIONS ---
const renderNotifications = () => {
    container.innerHTML = '';

    if (notifications.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 p-12">Tidak ada notifikasi.</p>`;
        markAllReadBtn.disabled = true;
        return;
    }

    notifications.forEach(notif => {
        const itemEl = document.createElement('div');
        const isUnread = !notif.read;

        itemEl.className = `p-4 transition-colors duration-300 flex items-start gap-4 ${isUnread ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'bg-white hover:bg-gray-50'}`;
        itemEl.dataset.notificationId = notif.id;
        itemEl.dataset.link = notif.link || '';

        const iconMap = {
            warning: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>`,
            success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`,
        };
        const icon = iconMap[notif.type] || iconMap['info'];

        itemEl.innerHTML = `
            <div>${icon}</div>
            <div class="flex-1">
                <p class="font-semibold text-gray-800">${notif.title}</p>
                <p class="text-sm text-gray-600">${notif.message}</p>
                <p class="text-xs text-gray-400 mt-1">${formatDateTime(new Date(notif.timestamp))}</p>
            </div>
            ${isUnread ? '<div class="w-2.5 h-2.5 bg-blue-500 rounded-full self-center"></div>' : ''}
        `;
        container.appendChild(itemEl);
    });

    const hasUnread = notifications.some(n => !n.read);
    markAllReadBtn.disabled = !hasUnread;
};

// --- EVENT HANDLERS ---
const handleNotificationClick = async (e) => {
    const item = e.target.closest('[data-notification-id]');
    if (!item) return;

    const notifId = item.dataset.notificationId;
    const link = item.dataset.link;

    await markNotificationAsRead(notifId);

    const clickedNotif = notifications.find(n => n.id == notifId);
    if (clickedNotif) clickedNotif.read = true;
    
    renderNotifications();
    updateBadges();

    if (link) {
        window.location.hash = link;
    }
};

const handleMarkAllReadClick = async () => {
    await markAllNotificationsAsRead();
    
    notifications.forEach(n => n.read = true);
    
    renderNotifications();
    updateBadges();
};

// --- INITIALIZATION ---
export async function init() {
    try {
        notifications = await getNotifications();
        renderNotifications();

        container.addEventListener('click', handleNotificationClick);
        markAllReadBtn.addEventListener('click', handleMarkAllReadClick);

    } catch (error) {
        console.error("Gagal memuat halaman notifikasi:", error);
        // PERUBAHAN: Lempar error agar ditangkap oleh router
        throw new Error('Gagal memuat data notifikasi.');
    }
}
