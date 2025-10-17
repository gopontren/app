// src/pages/js/notifikasi.js
// [PEMBARUAN BESAR]
// - Mengubah fungsi renderNotifications untuk menggunakan <template> dari notifikasi.html.
// - Kode rendering menjadi lebih bersih dan terpisah dari struktur HTML.

import { getSantriList, getSantriDetail } from '/src/services/api.js';
import { getSession } from '/src/services/state.js';
import { timeAgo } from '/src/services/utils.js';

/**
 * Membuat notifikasi dari data log aktivitas dengan pengecekan data yang aman.
 */
function createNotificationFromLog(logItem, santriName) {
    const baseNotif = {
        timestamp: logItem.timestamp,
        read: new Date(logItem.timestamp) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    };

    switch (logItem.type) {
        case 'setoran_hafalan':
            if (!logItem.metadata || !logItem.metadata.surat) return null;
            return {
                ...baseNotif,
                type: 'hafalan',
                title: 'Setoran Hafalan Baru',
                message: `Ananda ${santriName} telah menyetor hafalan ${logItem.metadata.surat} dengan nilai ${logItem.metadata.nilai}.`,
                link: `#detail_santri/${logItem.santriId}/hafalan`
            };

        case 'pemeriksaan_kesehatan':
            if (!logItem.metadata || !logItem.metadata.keluhan) return null;
            return {
                ...baseNotif,
                type: 'kesehatan',
                title: 'Catatan Kesehatan Santri',
                message: `Ada catatan kesehatan baru untuk ananda ${santriName}: ${logItem.metadata.keluhan}.`,
                link: `#detail_santri/${logItem.santriId}/kesehatan`
            };

        case 'gokop_order':
            if (!logItem.title) return null;
            return {
                ...baseNotif,
                type: 'gokop_order',
                title: `Status Pesanan Berubah`,
                message: `${logItem.title} untuk ananda ${santriName}.`,
                link: '#riwayat/pesanan'
            };

        case 'catat_spp':
            if (!logItem.title) return null;
            return {
                ...baseNotif,
                type: 'pembayaran',
                title: 'Pembayaran Berhasil',
                message: `${logItem.title} untuk ananda ${santriName} telah lunas.`,
                link: '#tagihan'
            };
            
        default:
            return null;
    }
}

function getNotificationStyle(type) {
    switch (type) {
        case 'pembayaran': return { icon: 'receipt', color: 'amber' };
        case 'kesehatan': return { icon: 'heart-pulse', color: 'rose' };
        case 'hafalan': return { icon: 'book-check', color: 'emerald' };
        case 'gokop_order': return { icon: 'package-check', color: 'indigo' };
        default: return { icon: 'bell', color: 'slate' };
    }
}

/**
 * [DIUBAH] Merender daftar notifikasi menggunakan <template>.
 */
function renderNotifications(notifications) {
    const container = document.getElementById('notifikasi-list');
    const template = document.getElementById('notification-item-template');
    if (!container || !template) return;

    container.innerHTML = ''; // Hapus skeleton

    if (notifications.length === 0) {
        container.innerHTML = `<p class="text-center text-slate-500 p-8">Belum ada pemberitahuan baru.</p>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    notifications.forEach(notif => {
        const clone = template.content.cloneNode(true);
        const style = getNotificationStyle(notif.type);

        const link = clone.querySelector('.notification-link');
        link.href = notif.link || '#';
        link.classList.add(notif.read ? 'bg-white' : 'bg-emerald-50');
        
        const iconContainer = clone.querySelector('.notification-icon-container');
        iconContainer.classList.add(`bg-${style.color}-100`, `text-${style.color}-600`);
        
        clone.querySelector('.notification-icon').setAttribute('data-lucide', style.icon);
        clone.querySelector('.notification-title').textContent = notif.title;
        clone.querySelector('.notification-message').textContent = notif.message;
        clone.querySelector('.notification-timestamp').textContent = timeAgo(notif.timestamp);

        fragment.appendChild(clone);
    });

    container.appendChild(fragment);
    lucide.createIcons();
}

export default async function initNotifikasi() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.classList.add('hidden');
    }

    try {
        const session = getSession();
        if (!session) throw new Error("Sesi tidak ditemukan");

        const santriList = await getSantriList(session.user.santri);
        
        let allNotifications = [];

        for (const santri of santriList.data) {
            const detail = await getSantriDetail(santri.id);
            if (detail.data.activityLog) {
                const logsWithSantriId = detail.data.activityLog.map(log => ({...log, santriId: santri.id}));
                const santriNotifications = logsWithSantriId
                    .map(log => createNotificationFromLog(log, santri.name))
                    .filter(notif => notif !== null); 
                allNotifications.push(...santriNotifications);
            }
        }
        
        const sortedNotifications = allNotifications
            .filter(notif => notif && notif.timestamp)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        renderNotifications(sortedNotifications);

    } catch (error) {
        console.error("Gagal membuat notifikasi dinamis:", error);
        const container = document.getElementById('notifikasi-list');
        if (container) {
            container.innerHTML = `<p class="p-8 text-center text-red-500">Gagal memuat notifikasi.</p>`;
        }
    }
}
