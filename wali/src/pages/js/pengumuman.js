// src/pages/js/pengumuman.js
// [PEMBARUAN BESAR]
// - Mengubah fungsi renderAnnouncements untuk menggunakan <template> dari pengumuman.html.
// - Menghapus pembuatan string HTML dari dalam JavaScript.

import { getCommunityAnnouncements } from '/src/services/api.js';

/**
 * [DIUBAH] Merender daftar pengumuman ke dalam kontainer menggunakan <template>.
 * @param {Array} announcements - Array berisi objek pengumuman.
 */
function renderAnnouncements(announcements) {
    const listContainer = document.getElementById('pengumuman-list');
    const template = document.getElementById('announcement-item-template');
    if (!listContainer || !template) return;

    listContainer.innerHTML = ''; // Hapus skeleton loader

    if (!announcements || announcements.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-slate-500 p-8">Belum ada pengumuman resmi dari pesantren.</p>`;
        return;
    }

    const sorted = announcements.sort((a, b) => new Date(b.date) - new Date(a.date));

    const fragment = document.createDocumentFragment();
    sorted.forEach(item => {
        const clone = template.content.cloneNode(true);
        const postDate = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        clone.querySelector('.announcement-title').textContent = item.title;
        clone.querySelector('.announcement-date').textContent = `Diposting pada ${postDate} oleh Admin`;
        clone.querySelector('.announcement-content').textContent = item.content;
        
        fragment.appendChild(clone);
    });
    
    listContainer.appendChild(fragment);
}


// Fungsi utama yang dipanggil oleh router
export default async function initPengumuman() {
    try {
        const response = await getCommunityAnnouncements();
        renderAnnouncements(response.data);
    } catch (error) {
        console.error("Gagal memuat pengumuman:", error);
        const listContainer = document.getElementById('pengumuman-list');
        if(listContainer) {
            listContainer.innerHTML = `<p class="text-center text-red-500 p-8">Gagal memuat data pengumuman.</p>`;
        }
    }
}
