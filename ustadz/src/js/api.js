/**
 * src/js/api.js
 * [PEMBARUAN]
 * - Memastikan data mock untuk ustadz memiliki properti `photoUrl`.
 * - Menambahkan mock data dan fungsi API untuk fitur pengambilan paket.
 */

const mockData = {
    ustadz: {
        id: "ustadz-didi",
        name: "Didi Santoso",
        photoUrl: "https://placehold.co/100x100/ccfbf1/134e4a?text=DS", // Pastikan properti ini ada
        permissions: [
            {
                "key": "absensi_sholat", "label": "Absensi Sholat", "icon": "moon-star", "color": "teal",
                "handler": { "type": "SELECT_SUB_ACTION", "config": { "title": "Pilih Waktu Sholat", "subActions": [ { "key": "subuh", "label": "Subuh" }, { "key": "dzuhur", "label": "Dzuhur" } ], "nextHandler": { "type": "GENERIC_SCAN", "config": { "apiEndpoint": "/absensi/sholat" } } } }
            },
            {
                "key": "absensi_ngaji", "label": "Absensi Ngaji", "icon": "book-open-check", "color": "sky",
                "handler": { "type": "SELECT_SUB_ACTION", "config": { "title": "Pilih Sesi Ngaji", "subActions": [ { "key": "siang", "label": "Madrasah Siang" } ], "nextHandler": { "type": "GENERIC_SCAN", "config": { "apiEndpoint": "/absensi/ngaji" } } } }
            },
             {
                "key": "awasi_pembangunan", "label": "Awasi Pembangunan", "icon": "hard-hat", "color": "orange",
                "handler": { "type": "GENERIC_SCAN", "config": { "pageTitle": "Pencatatan Progres", "apiEndpoint": "/kegiatan/pencatatan" }}
            }
        ]
    },
    banners: [ { id: 'banner-1', imageUrl: 'https://placehold.co/600x300/166534/ffffff?text=Info+Manasik+Haji', actionUrl: '#' } ],
    prayerTimes: [ { key: 'subuh', name: 'Subuh', time: '04:30' }, { key: 'dzuhur', name: 'Dzuhur', time: '12:00' }, { key: 'ashar', name: 'Ashar', time: '15:15' }, { key: 'maghrib', name: 'Maghrib', time: '18:05' }, { key: 'isya', name: 'Isya', time: '19:20' } ],
    schedules: [
        { ustadzId: "ustadz-didi", startTime: "08:30", endTime: "09:30", type: 'akademik', mapelId: 1, kelasId: 'kelas-1', location: "Masjid Utama, Sayap Kanan", taskId: "absensi_ngaji" },
        { ustadzId: "ustadz-didi", startTime: "10:00", endTime: "11:00", type: 'umum', location: "Area Belakang", taskId: "awasi_pembangunan" }
    ],
    santri: [ { id: "santri-123", name: "Ahmad Zaki", kelas: "Kelas 1A", photoUrl: "https://placehold.co/120x120/e0f2fe/0c4a6e?text=AZ", status: "active", permitInfo: null } ],
    recentActivities: [ { santri: "Ahmad Zaki", foto: "https://placehold.co/120x120/e0f2fe/0c4a6e?text=AZ", kegiatan: "Absen Sholat Maghrib", waktu: "Kemarin" } ],
    mapel: [{ id: 1, name: "Ngaji Kitab Safinah" }],
    // [BARU] Mock data untuk tugas pengambilan paket
    pickupTasks: [
        {
            id: 'task-001',
            orderId: 'ORD-2025-XYZ',
            storeName: 'Koperasi Al-Ikhlas',
            santriName: 'Budi Hartono',
            itemCount: 3,
            ustadzId: 'ustadz-didi',
            status: 'pending_pickup' // status: 'pending_pickup', 'in_delivery', 'completed'
        },
        {
            id: 'task-002',
            orderId: 'ORD-2025-ABC',
            storeName: 'Toko Buku Barokah',
            santriName: 'Citra Lestari',
            itemCount: 1,
            ustadzId: 'ustadz-didi',
            status: 'pending_pickup'
        },
        {
            id: 'task-003',
            orderId: 'ORD-2025-DEF',
            storeName: 'Koperasi Al-Ikhlas',
            santriName: 'Doni Kusuma',
            itemCount: 5,
            ustadzId: 'ustadz-didi',
            status: 'in_delivery'
        }
    ]
};

const networkDelay = (ms) => new Promise(res => setTimeout(res, ms));

function getCurrentTime() {
    const now = new Date();
    // Untuk demo, set waktu ke 10:15 agar jadwal umum yang aktif
    now.setHours(10, 15, 0); 
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export async function getUstadz() {
    await networkDelay(800);
    return mockData.ustadz;
}

export async function getBanners() {
    await networkDelay(1000);
    return mockData.banners;
}

export async function getCurrentSchedule(ustadzId) {
    await networkDelay(800);
    const now = getCurrentTime();

    const activeSchedule = mockData.schedules.find(schedule =>
        schedule.ustadzId === ustadzId &&
        now >= schedule.startTime &&
        now <= schedule.endTime
    );

    if (!activeSchedule) return null;

    const taskDetails = mockData.ustadz.permissions.find(p => p.key === activeSchedule.taskId);

    let scheduleTitle = "Jadwal Tidak Dikenal";
    if (activeSchedule.type === 'akademik' && activeSchedule.mapelId) {
        const mapel = mockData.mapel.find(m => m.id === activeSchedule.mapelId);
        scheduleTitle = mapel ? mapel.name : "Pelajaran";
    } else if (activeSchedule.type === 'umum' && taskDetails) {
        scheduleTitle = taskDetails.label;
    }

    const enrichedSchedule = {
        ...activeSchedule,
        title: scheduleTitle,
        actionConfig: taskDetails || null
    };

    return enrichedSchedule;
}

export async function getNextPrayerTime() {
    await networkDelay(100);
    const now = getCurrentTime();
    for (const prayer of mockData.prayerTimes) {
        if (now < prayer.time) return prayer;
    }
    return mockData.prayerTimes[0];
}

export async function getSantriById(id) {
    await networkDelay(200);
    const santri = mockData.santri.find(s => s.id === id);
    if (!santri) throw new Error("Data santri tidak ditemukan");
    return santri;
}

export async function getRecentActivities() {
    await networkDelay(1200);
    return mockData.recentActivities;
}

export async function postScanResult(endpoint, payload) {
    await networkDelay(500);
    console.log(`[API CALL] Mengirim data ke endpoint: ${endpoint}`);
    console.log(`[API CALL] Payload:`, payload);
    const santri = await getSantriById(payload.santriId);
    if (santri) {
        mockData.recentActivities.unshift({
            santri: santri.name,
            foto: santri.photoUrl,
            kegiatan: payload.activityLabel,
            waktu: "Baru saja"
        });
        if (mockData.recentActivities.length > 5) {
            mockData.recentActivities.pop();
        }
    }
    return { success: true, message: `Data berhasil dikirim ke ${endpoint}` };
}

// [BARU] Mengambil daftar tugas pengambilan paket untuk ustadz tertentu
export async function getPickupTasks(ustadzId) {
    await networkDelay(700);
    // Filter tugas yang belum selesai untuk ustadz yang sedang login
    return mockData.pickupTasks.filter(task => task.ustadzId === ustadzId && task.status !== 'completed');
}

// [BARU] Memperbarui status tugas pengambilan paket
export async function updatePickupTaskStatus(taskId, newStatus) {
    await networkDelay(400);
    const taskIndex = mockData.pickupTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        mockData.pickupTasks[taskIndex].status = newStatus;
        console.log(`[API CALL] Status tugas ${taskId} diubah menjadi ${newStatus}`);
        return { success: true, message: `Status tugas berhasil diperbarui.` };
    } else {
        throw new Error("Tugas tidak ditemukan.");
    }
}
