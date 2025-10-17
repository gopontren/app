/**
 * src/js/pages/beranda.js
 * [PEMBARUAN FITUR]
 * - Mengimpor getPickupTasks untuk mengambil data tugas paket.
 * - Memanggil getPickupTasks saat inisialisasi halaman.
 * - Menambahkan logika pada updateSmartActionBar untuk menampilkan
 * badge notifikasi pada tombol pengambilan paket.
 */

import { getUstadz, getCurrentSchedule, getRecentActivities, getBanners, getNextPrayerTime, getPickupTasks } from '../api.js';
import { createIcons } from '../ui.js';
import { appState } from '../app.js';

// --- Helper Functions ---
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
}

// --- Fungsi Rendering Komponen ---

function renderHeader(ustadz) {
    return `
        <div class="flex items-center justify-between">
            <div>
                <p class="text-slate-500">${getGreeting()},</p>
                <h1 class="text-2xl font-bold text-slate-800">${ustadz.name}</h1>
            </div>
            <button data-action="open-profile" class="relative">
                 <img src="${ustadz.photoUrl}" alt="${ustadz.name}" class="w-12 h-12 rounded-full ring-2 ring-white">
                 <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">
                    <i data-lucide="bell" class="h-3 w-3"></i>
                 </span>
            </button>
        </div>
    `;
}

function renderBannerSlider(banners) {
    if (!banners || banners.length === 0) return '';
    const bannerItems = banners.map(banner => `
        <a href="${banner.actionUrl}" class="banner-card">
            <img src="${banner.imageUrl}" class="w-full aspect-[2/1] rounded-2xl object-cover bg-slate-200">
        </a>
    `).join('');
    return `<div><div class="banner-carousel">${bannerItems}</div></div>`;
}

function renderScheduleCard(schedule) {
    if (!schedule) return `
        <div class="p-6 text-center bg-white rounded-2xl">
            <p class="font-semibold text-slate-700">Tidak ada jadwal untuk saat ini.</p>
            <p class="text-sm text-slate-500 mt-1">Aksi utama Anda adalah jadwal sholat terdekat.</p>
        </div>
    `;
    return `
        <div class="bg-gradient-to-br from-teal-700 to-teal-900 text-white p-5 rounded-2xl shadow-lg shadow-teal-800/20 relative overflow-hidden">
            <div class="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full opacity-80"></div>
            <div class="relative z-10">
                <p class="text-xs opacity-80 font-medium">JADWAL ANDA SEKARANG</p>
                <p class="text-xl font-semibold mt-1">${schedule.title}</p>
                <div class="mt-3 text-sm opacity-90 flex items-center gap-4">
                    <span class="flex items-center"><i data-lucide="clock" class="h-4 w-4 mr-1.5"></i>${schedule.startTime} - ${schedule.endTime}</span>
                    <span class="flex items-center"><i data-lucide="map-pin" class="h-4 w-4 mr-1.5"></i>${schedule.location}</span>
                </div>
            </div>
        </div>
    `;
}

function renderRecentActivities(activities) {
    if (!activities || activities.length === 0) return '';
    const activityItems = activities.map(item => `
        <div class="flex items-center space-x-4">
            <img src="${item.foto}" class="w-10 h-10 rounded-full bg-slate-200" alt="${item.santri}">
            <div class="flex-grow">
                <p class="font-semibold text-slate-800 text-sm">${item.santri}</p>
                <p class="text-xs text-slate-500">${item.kegiatan}</p>
            </div>
            <span class="text-xs font-medium text-slate-400">${item.waktu}</span>
        </div>
    `).join('');
    return `
        <div>
            <h2 class="text-base font-semibold text-slate-600 mb-3">Aktivitas Terkini</h2>
            <div class="space-y-4 bg-white p-4 rounded-2xl">${activityItems}</div>
        </div>
    `;
}

function updateSmartActionBar({ schedule, nextPrayer, pickupTasks }) {
    // Update tombol aksi utama
    const mainBtn = document.getElementById('smart-action-main-btn');
    if (mainBtn) {
        let permissionConfig = null;
        if (schedule && schedule.actionConfig) {
            permissionConfig = schedule.actionConfig;
            mainBtn.innerHTML = `<i data-lucide="scan-line" class="h-6 w-6"></i><span>Mulai ${permissionConfig.label || 'Absensi'}</span>`;
        } else if (nextPrayer) {
            permissionConfig = {
                label: `Absensi Sholat ${nextPrayer.name}`,
                handler: {
                    type: "GENERIC_SCAN",
                    config: { pageTitle: `Absensi Sholat ${nextPrayer.name}`, apiEndpoint: "/absensi/sholat", subActionKey: nextPrayer.key }
                }
            };
            mainBtn.innerHTML = `<i data-lucide="scan-line" class="h-6 w-6"></i><span>Absensi ${nextPrayer.name}</span>`;
        }
        if(permissionConfig) {
            mainBtn.dataset.action = 'process-permission';
            mainBtn.dataset.actionConfig = JSON.stringify(permissionConfig);
        }
    }
    
    // [BARU] Update badge notifikasi paket
    const badge = document.getElementById('pickup-badge');
    if (badge) {
        const taskCount = pickupTasks ? pickupTasks.length : 0;
        if (taskCount > 0) {
            badge.textContent = taskCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    createIcons();
}

// --- Fungsi Utama & State Handling ---

function renderBerandaSkeleton() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="p-6 space-y-6 animate-pulse">
                <div class="flex items-center justify-between">
                    <div><div class="h-5 w-24 skeleton bg-slate-200 rounded mb-2"></div><div class="h-8 w-40 skeleton bg-slate-200 rounded"></div></div>
                    <div class="w-12 h-12 rounded-full skeleton bg-slate-200"></div>
                </div>
                <div class="h-36 skeleton bg-slate-200 rounded-2xl"></div>
                <div class="h-24 skeleton bg-slate-200 rounded-2xl"></div>
                <div>
                    <div class="h-6 w-32 skeleton bg-slate-200 rounded mb-3"></div>
                    <div class="space-y-3 bg-white p-4 rounded-2xl">
                        <div class="h-10 skeleton bg-slate-200 rounded-lg"></div>
                        <div class="h-10 skeleton bg-slate-200 rounded-lg"></div>
                    </div>
                </div>
            </div>`;
    }
}

function renderBerandaContent(data) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="p-6 space-y-6">
                ${renderHeader(data.ustadz)}
                ${renderBannerSlider(data.banners)}
                ${renderScheduleCard(data.schedule)}
                ${renderRecentActivities(data.activities)}
            </div>
        `;
    }
    updateSmartActionBar({ 
        schedule: data.schedule, 
        nextPrayer: data.nextPrayer,
        pickupTasks: data.pickupTasks 
    });
}

export async function initBeranda() {
    renderBerandaSkeleton();
    try {
        const ustadzId = "ustadz-didi"; // ID Ustadz yang sedang login
        const [ustadz, schedule, activities, banners, pickupTasks] = await Promise.all([
            getUstadz(),
            getCurrentSchedule(ustadzId),
            getRecentActivities(),
            getBanners(),
            getPickupTasks(ustadzId) // Panggil API baru
        ]);
        
        let nextPrayer = null;
        if (!schedule) {
            nextPrayer = await getNextPrayerTime();
        }

        appState.currentUser = ustadz;
        renderBerandaContent({ ustadz, schedule, activities, banners, nextPrayer, pickupTasks });

    } catch (error) {
        console.error("Gagal memuat data Beranda:", error);
    } finally {
        createIcons();
    }
}
