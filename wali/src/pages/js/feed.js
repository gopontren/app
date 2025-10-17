// src/pages/js/feed.js
// [PEMBARUAN BESAR]
// - Menghapus fungsi createFeedItemHTML yang membuat string HTML.
// - Merubah logika rendering untuk menggunakan <template> dari file feed.html.
// - Kode menjadi lebih bersih dan memisahkan markup dari logika.

import { getGoNgajiFeed } from '/src/services/api.js';

/**
 * [DIUBAH] Merender feed konten menggunakan <template>.
 * @param {Array} feedData - Data artikel atau video dari API.
 */
function renderFeed(feedData) {
    const feedContainer = document.getElementById('go-ngaji-feed-container');
    const template = document.getElementById('feed-item-template');
    if (!feedContainer || !template) return;

    feedContainer.innerHTML = ''; // Hapus skeleton loader

    if (!feedData || feedData.length === 0) {
        feedContainer.innerHTML = '<p class="text-center text-slate-500 p-8">Belum ada konten yang tersedia saat ini.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    feedData.forEach(item => {
        const clone = template.content.cloneNode(true);
        const isVideo = item.type === 'video';

        clone.querySelector('.feed-item-link').href = `#content/${item.id}`;
        
        const thumbnail = clone.querySelector('.feed-item-thumbnail');
        thumbnail.src = item.thumbnail;
        thumbnail.alt = `Thumbnail untuk ${item.title}`;

        const category = clone.querySelector('.feed-item-category');
        category.textContent = isVideo ? 'Video Kajian' : 'Artikel';
        category.className = `feed-item-category text-sm ${isVideo ? 'text-rose-600' : 'text-sky-600'} font-semibold mb-1`;
        
        clone.querySelector('.feed-item-title').textContent = item.title;
        clone.querySelector('.feed-item-author').textContent = `${item.author} - ${item.pondok}`;

        if (isVideo) {
            clone.querySelector('.feed-item-video-overlay').classList.remove('hidden');
            const durationEl = clone.querySelector('.feed-item-duration');
            durationEl.textContent = item.duration;
            durationEl.classList.remove('hidden');
        }
        
        fragment.appendChild(clone);
    });

    feedContainer.appendChild(fragment);
    lucide.createIcons();
}


// Fungsi utama yang dipanggil oleh router
export default async function initGoNgajiFeed() {
    try {
        const feedResponse = await getGoNgajiFeed();
        renderFeed(feedResponse.data);
    } catch (error) {
        console.error("Gagal memuat feed Go-Ngaji:", error);
        const feedContainer = document.getElementById('go-ngaji-feed-container');
        if (feedContainer) {
            feedContainer.innerHTML = '<p class="text-center text-red-500 p-8">Gagal memuat konten. Silakan coba lagi.</p>';
        }
    }
}
