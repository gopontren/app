// src/pages/js/home.js
// [PEMBARUAN BESAR]
// - Fungsi createSantriCardHTML dihapus dan diganti dengan penggunaan <template> dari home.html.
// - Logika setupInteractiveSlider diubah untuk meng-kloning dan mengisi template.
// - Menambahkan `loading="lazy"` pada gambar avatar di dalam template.

import { getSantriList, getSantriDetail } from '/src/services/api.js';
import { getSession, getActiveSantriId, setActiveSantri } from '/src/services/state.js';
import { createSantriCardSkeleton } from '/src/components/SkeletonLoader.js';

/**
 * Memeriksa apakah ada notifikasi yang belum dibaca dan menampilkan badge.
 */
async function checkUnreadNotifications() {
    try {
        const session = getSession();
        if (!session) return;

        const santriListResponse = await getSantriList(session.user.santri);
        const santriProfiles = santriListResponse.data;
        let hasUnread = false;

        for (const santri of santriProfiles) {
            const detailResponse = await getSantriDetail(santri.id);
            const logs = detailResponse.data.activityLog || [];
            
            const unreadLog = logs.find(log => {
                const isRecent = new Date(log.timestamp) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
                const isValidNotifType = ['setoran_hafalan', 'pemeriksaan_kesehatan', 'gokop_order', 'catat_spp'].includes(log.type);
                return isRecent && isValidNotifType;
            });

            if (unreadLog) {
                hasUnread = true;
                break; 
            }
        }

        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.classList.toggle('hidden', !hasUnread);
        }
    } catch (error) {
        console.warn("Gagal memeriksa status notifikasi:", error);
    }
}

/**
 * [BARU] Mengisi data ke dalam satu klon template kartu santri.
 * @param {DocumentFragment} clone - Klon dari template.
 * @param {object} santri - Data profil santri.
 * @param {object} details - Data detail santri.
 */
function populateSantriCard(clone, santri, details) {
    const saldo = details.goKop?.saldo.toLocaleString('id-ID') || '0';
    const hafalanLog = (details.activityLog || [])
        .filter(log => log.type === 'setoran_hafalan')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const hafalanTerakhir = hafalanLog.length > 0 ? hafalanLog[0].metadata.surat : '-';

    clone.querySelector('.santri-detail-link').href = `#detail_santri/${santri.id}`;
    clone.querySelector('.santri-avatar').src = santri.avatar;
    clone.querySelector('.santri-name').textContent = santri.name;
    clone.querySelector('.santri-pondok').textContent = santri.pondokName;
    clone.querySelector('.hafalan-link').href = `#detail_santri/${santri.id}/hafalan`;
    clone.querySelector('.santri-hafalan').textContent = hafalanTerakhir;
    clone.querySelector('.santri-saldo').textContent = saldo;
    clone.querySelector('.topup-link').href = `#topup/${santri.id}`;
}


/**
 * [DIUBAH] Mengatur slider interaktif menggunakan <template>.
 */
function setupInteractiveSlider(santriProfiles, santriDetails) {
    const sliderContainer = document.getElementById('santri-slider-container');
    const sliderTrack = document.getElementById('santri-slider-track');
    const dotsContainer = document.getElementById('santri-slider-dots');
    const template = document.getElementById('santri-card-template');

    if (!sliderTrack || !dotsContainer || !template) return;

    sliderTrack.innerHTML = ''; // Kosongkan skeleton
    const fragment = document.createDocumentFragment();

    santriProfiles.forEach((santri, index) => {
        const clone = template.content.cloneNode(true);
        populateSantriCard(clone, santri, santriDetails[index]);
        fragment.appendChild(clone);
    });
    sliderTrack.appendChild(fragment);
    
    dotsContainer.innerHTML = santriProfiles.map((_, index) => 
        `<button data-index="${index}" class="slider-dot w-2 h-2 bg-white/40 rounded-full transition-all duration-300"></button>`
    ).join('');

    const dots = dotsContainer.querySelectorAll('.slider-dot');
    let currentSlide = santriProfiles.findIndex(s => s.id === getActiveSantriId());
    if (currentSlide === -1) currentSlide = 0;

    let slideInterval;
    let isDragging = false, startX = 0, currentTranslate = 0, prevTranslate = 0;

    const goToSlide = (slideIndex) => {
        currentSlide = (slideIndex + santriProfiles.length) % santriProfiles.length;
        const slideWidth = sliderContainer.offsetWidth;
        currentTranslate = -currentSlide * slideWidth;
        sliderTrack.style.transition = 'transform 0.5s ease-in-out';
        sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
        
        dots.forEach(dot => {
            dot.classList.remove('bg-white', 'w-4');
            dot.classList.add('bg-white/40', 'w-2');
        });
        dots[currentSlide].classList.add('bg-white', 'w-4');
        dots[currentSlide].classList.remove('bg-white/40', 'w-2');
        
        setActiveSantri(santriProfiles[currentSlide].id);
    };

    const startAutoSlide = () => {
        stopAutoSlide();
        if (santriProfiles.length > 1) {
            slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
        }
    };
    const stopAutoSlide = () => clearInterval(slideInterval);

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            goToSlide(parseInt(dot.dataset.index));
            startAutoSlide();
        });
    });

    const touchStart = (e) => {
        if (santriProfiles.length <= 1) return;
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        stopAutoSlide();
        sliderTrack.style.transition = 'none';
        prevTranslate = currentTranslate;
    };

    const touchMove = (e) => {
        if (!isDragging) return;
        const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentPosition - startX;
        currentTranslate = prevTranslate + diff;
        sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
    };

    const touchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const movedBy = currentTranslate - prevTranslate;
        if (movedBy < -50) goToSlide(currentSlide + 1);
        else if (movedBy > 50) goToSlide(currentSlide - 1);
        else goToSlide(currentSlide);
        startAutoSlide();
    };

    sliderContainer.addEventListener('mousedown', touchStart);
    sliderContainer.addEventListener('touchstart', touchStart, { passive: true });
    sliderContainer.addEventListener('mouseup', touchEnd);
    sliderContainer.addEventListener('touchend', touchEnd);
    sliderContainer.addEventListener('mousemove', touchMove);
    sliderContainer.addEventListener('touchmove', touchMove, { passive: true });
    sliderContainer.addEventListener('mouseleave', () => isDragging && touchEnd());

    goToSlide(currentSlide);
    startAutoSlide();
}

function setupHeaderScroll() {
    const mainHeader = document.getElementById('main-header');
    const appContent = document.getElementById('app-content');
    if (!mainHeader || !appContent) return;
    let lastScrollTop = 0;
    appContent.onscroll = function() {
        let scrollTop = appContent.scrollTop;
        if (scrollTop > 10) { 
            mainHeader.classList.toggle('hidden', scrollTop > lastScrollTop);
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };
}

export default async function initHome() {
    const session = getSession();
    if (!session) {
        window.location.hash = '#login';
        return;
    }

    document.getElementById('user-greeting-name').textContent = session.user.name;
    const sliderTrack = document.getElementById('santri-slider-track');
    sliderTrack.innerHTML = createSantriCardSkeleton();

    checkUnreadNotifications();

    try {
        const santriListResponse = await getSantriList(session.user.santri);
        const santriProfiles = santriListResponse.data;

        const detailPromises = santriProfiles.map(s => getSantriDetail(s.id));
        const detailResponses = await Promise.all(detailPromises);
        const santriDetails = detailResponses.map(res => res.data);
        
        const dotsContainer = document.getElementById('santri-slider-dots');

        if (santriProfiles && santriProfiles.length > 0) {
            dotsContainer.style.display = 'flex';
            setupInteractiveSlider(santriProfiles, santriDetails);
        } else {
            dotsContainer.style.display = 'none';
            sliderTrack.innerHTML = `<div class="text-center p-8 text-white/50">Tidak ada data santri ditemukan.</div>`;
        }
    } catch (error) {
        console.error("Gagal memuat data santri:", error);
        document.getElementById('santri-slider-track').innerHTML = `<div class="text-center p-8 text-red-400">Gagal memuat data.</div>`;
    }
    
    setupHeaderScroll();
}
