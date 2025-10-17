// src/services/api.js
// [PEMBARUAN]
// - Logika processTopUp diubah untuk membuat transaksi "pending".
// - completeMockTopUp disiapkan untuk dipanggil dari UI untuk mensimulasikan konfirmasi.
// - Menambahkan fungsi toggleLikePost untuk menangani suka/batal suka.

const MOCK_DB = {
    // Pengaturan Admin untuk biaya dinamis
    "admin_settings": {
        "biaya_layanan": 1000,
        "biaya_layanan_spp": 2500, // Biaya layanan ini akan kita gunakan untuk TopUp
        "ongkir_per_toko": 2000,
        "promo": {
            "aktif": true,
            "tipe": "gratis_ongkir",
            "minimal_belanja": 20000
        }
    },

    // Banner Promosi untuk Go-Kop
    "gokop_promo_banner": {
        "aktif": true,
        "imageUrl": "https://placehold.co/600x200/10b981/ffffff?text=Gratis+Ongkir+Go-Kop!",
        "linkUrl": "#promo/gratis-ongkir-gokop"
    },

    // Data Pengguna
    "user-wali-1": {
        id: "user-wali-1",
        name: "Bunda Aisyah",
        email: "aisyah@email.com",
        role: "wali_santri",
        santri: ["santri-ahmad-zaki", "santri-fatimah-zahra"]
    },
    
    "user-wali-2": {
        id: "user-wali-2",
        name: "Ayah Umar",
        email: "umar@email.com",
    },


    // Data Santri
    "santri-ahmad-zaki": { id: "santri-ahmad-zaki", name: "Ahmad Zaki", nis: "12345", avatar: "https://placehold.co/64x64/e2e8f0/334155?text=AZ", pondokName: "PP. Nurul Fikri" },
    "santri-fatimah-zahra": { id: "santri-fatimah-zahra", name: "Fatimah Az-Zahra", nis: "67890", avatar: "https://placehold.co/64x64/fbcfe8/86198f?text=FA", pondokName: "PP. Nurul Fikri" },

    // Data Detail Santri
    "detail-ahmad-zaki": {
        keuangan: { tagihan: [ { id: "spp-okt-25", title: "SPP Oktober 2025", amount: 750000, due_date: "2025-10-10", status: "unpaid" } ] },
        goKop: { saldo: 15000 },
        activityLog: []
    },
    "detail-fatimah-zahra": {
        keuangan: { tagihan: [ { id: "spp-okt-25-f", title: "SPP Oktober 2025", amount: 750000, due_date: "2025-10-10", status: "unpaid" } ] },
        goKop: { saldo: 225000 },
        activityLog: []
    },

    // Data Produk E-commerce
    "products": [
        { id: 1, storeId: 'koperasi-al-ikhlas', store: 'Koperasi Al-Ikhlas', name: 'Chitato Sapi Panggang 68g', price: 10000, image: 'https://placehold.co/300x300/f87171/ffffff?text=Chitato' },
        { id: 2, storeId: 'koperasi-al-ikhlas', store: 'Koperasi Al-Ikhlas', name: 'Teh Pucuk Harum 350ml', price: 3500, image: 'https://placehold.co/300x300/34d399/ffffff?text=Teh+Pucuk' },
        { id: 3, storeId: 'toko-atk-barokah', store: 'Toko ATK Barokah', name: 'Buku Tulis Sinar Dunia 58 lbr', price: 5000, image: 'https://placehold.co/300x300/60a5fa/ffffff?text=Buku' },
        { id: 4, storeId: 'koperasi-al-ikhlas', store: 'Koperasi Al-Ikhlas', name: 'Sabun Mandi Lifebuoy Total 10', price: 4000, image: 'https://placehold.co/300x300/facc15/ffffff?text=Sabun' },
        { id: 5, storeId: 'toko-atk-barokah', store: 'Toko ATK Barokah', name: 'Oreo Original 133g', price: 8000, image: 'https://placehold.co/300x300/818cf8/ffffff?text=Oreo' }
    ],

    // Data Riwayat Pesanan
    "myOrders": [],

    // Data untuk Go-Ngaji
    "go-ngaji-content": [
        { id: "artikel-1", type: "artikel", title: "5 Tips Menjaga Semangat Menghafal Al-Qur'an", author: "Ustadz H. Abdullah", pondok: "PP. Nurul Fikri", thumbnail: "https://placehold.co/600x300/a7f3d0/166534?text=Artikel" }
    ],

    // Data untuk Komunitas
    "komunitas": {
        pengumuman: [{ id: 1, title: "Info Jadwal Ujian", content: "UAS Ganjil akan dimulai pada 15 September 2025.", date: "2025-09-10" }],
        diskusi: [
            { 
                id: "post-1", 
                author: { id: "user-wali-1", name: "Bunda Aisyah" }, 
                content: "Assalamualaikum, mau tanya info seragam baru kapan ya dibagikannya?", 
                timestamp: "2025-09-15T10:00:00Z", 
                likes: 5, 
                replies: [
                    {
                        id: "reply-101",
                        author: { id: "user-wali-2", name: "Ayah Umar" },
                        content: "Waalaikumsalam, setahu saya info dari ustadz akan dibagikan minggu depan, bun.",
                        timestamp: "2025-09-15T10:05:00Z",
                    }
                ]
            },
            {
                id: "post-2",
                author: { id: "user-wali-2", name: "Ayah Umar" },
                content: "Apakah ada rekomendasi buku cerita islami yang bagus untuk anak usia 10 tahun?",
                timestamp: "2025-09-14T18:30:00Z",
                likes: 12,
                replies: []
            }
        ]
    }
};

// --- Helper Functions ---
const apiCall = (data, delay = 300) => new Promise(resolve => setTimeout(() => resolve({ status: "success", data: JSON.parse(JSON.stringify(data)) }), delay));

// --- API Functions ---
export const getAdminSettings = () => apiCall(MOCK_DB["admin_settings"]);
export const getPromoBanner = () => apiCall(MOCK_DB["gokop_promo_banner"]);
export const login = (email, password) => apiCall({ user: MOCK_DB["user-wali-1"], token: "mock-jwt-token" });
export const getSantriList = (santriIds) => apiCall(santriIds.map(id => MOCK_DB[id]));
export const getSantriDetail = (santriId) => {
    const detailKey = `detail-${santriId.split('-').slice(1).join('-')}`;
    return apiCall(MOCK_DB[detailKey] || {});
};
export const getStoreProducts = ({ search = '', page = 1, limit = 8 } = {}) => {
    return new Promise(resolve => setTimeout(() => {
        let filteredProducts = MOCK_DB.products;
        if (search) {
            filteredProducts = MOCK_DB.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }
        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const productsForPage = filteredProducts.slice(startIndex, startIndex + limit);
        resolve({ status: "success", data: productsForPage, pagination: { currentPage: page, totalPages, totalProducts } });
    }, 500));
};
export const getProductDetail = (productId) => {
    const product = MOCK_DB.products.find(p => p.id == productId);
    return apiCall(product);
};

// --- API untuk Go-Ngaji & Komunitas ---
export const getGoNgajiFeed = () => apiCall(MOCK_DB["go-ngaji-content"]);
export const getCommunityAnnouncements = () => apiCall(MOCK_DB.komunitas.pengumuman);
export const getCommunityDiscussions = () => apiCall(MOCK_DB.komunitas.diskusi);

export const postCommunityDiscussion = (postData) => {
    const newPost = { id: `post-${Date.now()}`, ...postData, timestamp: new Date().toISOString(), likes: 0, replies: [] };
    MOCK_DB.komunitas.diskusi.push(newPost);
    return apiCall(newPost);
};

export const postCommunityReply = (postId, replyData) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const post = MOCK_DB.komunitas.diskusi.find(p => p.id === postId);
            if (post) {
                const newReply = {
                    id: `reply-${Date.now()}`,
                    ...replyData,
                    timestamp: new Date().toISOString()
                };
                post.replies.push(newReply);
                resolve({ status: "success", data: newReply });
            } else {
                reject(new Error("Postingan tidak ditemukan."));
            }
        }, 400);
    });
};

export const toggleLikePost = (postId, isLiked) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const post = MOCK_DB.komunitas.diskusi.find(p => p.id === postId);
            if (post) {
                post.likes = isLiked ? post.likes - 1 : post.likes + 1;
                resolve({ status: "success", data: { newLikesCount: post.likes } });
            } else {
                reject(new Error("Postingan tidak ditemukan."));
            }
        }, 200);
    });
};

// --- API Functions for Checkout & Payment ---
export const getCheckoutDetails = (cartItems) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const settings = MOCK_DB.admin_settings;
            let totalBelanjaProduk = 0;
            const ordersByStore = cartItems.reduce((acc, item) => {
                const storeId = item.storeId || 'toko-tidak-dikenal';
                if (!acc[storeId]) {
                    acc[storeId] = { storeName: item.store, items: [], subtotal: 0, shippingFee: settings.ongkir_per_toko, shippingDiscount: 0 };
                }
                const itemTotal = item.price * item.quantity;
                acc[storeId].items.push(item);
                acc[storeId].subtotal += itemTotal;
                totalBelanjaProduk += itemTotal;
                return acc;
            }, {});

            let totalOngkir = 0;
            let totalDiskon = 0;
            const storeOrdersArray = Object.values(ordersByStore);
            storeOrdersArray.forEach(storeOrder => { totalOngkir += storeOrder.shippingFee; });

            if (settings.promo.aktif && totalBelanjaProduk >= settings.promo.minimal_belanja) {
                totalDiskon = totalOngkir;
                storeOrdersArray.forEach(storeOrder => { storeOrder.shippingDiscount = storeOrder.shippingFee; });
            }

            const grandTotal = totalBelanjaProduk + totalOngkir - totalDiskon + settings.biaya_layanan;

            resolve({ status: "success", data: {
                ordersByStore: storeOrdersArray,
                summary: { totalBelanjaProduk, totalOngkir, totalDiskon, biayaLayanan: settings.biaya_layanan, grandTotal }
            }});
        }, 500);
    });
};

export const createOnlineOrder = (orderData) => {
    return new Promise(resolve => setTimeout(() => {
        const santriProfile = MOCK_DB[orderData.santriId];
        const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
        const newOrder = {
            id: newOrderId,
            waliId: orderData.waliId,
            santriId: orderData.santriId,
            santriName: santriProfile.name,
            date: new Date().toISOString(),
            status: 'menunggu pengambilan',
            paymentMethod: orderData.paymentMethod,
            notes: orderData.notes || null,
            details: orderData.checkoutDetails
        };
        MOCK_DB["myOrders"].unshift(newOrder);

        if (orderData.paymentMethod === 'pembayaran_online') {
            resolve({ status: "redirect", data: { orderId: newOrderId, paymentUrl: "https://app.sandbox.midtrans.com/payment-links/1234-abcd-5678" } });
        } else {
            resolve({ status: "success", data: newOrder });
        }
    }, 1000));
};

export const getMyOrders = () => {
    const waliId = "user-wali-1";
    const orders = MOCK_DB["myOrders"].filter(o => o.waliId === waliId || true);
    return apiCall(orders.sort((a, b) => new Date(b.date) - new Date(a, b)));
};

export const processPayment = (santriId, tagihanId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const detailKey = `detail-${santriId.split('-').slice(1).join('-')}`;
            const santriDetail = MOCK_DB[detailKey];
            if (!santriDetail) return reject(new Error("Data santri tidak ditemukan"));

            const tagihanIndex = santriDetail.keuangan.tagihan.findIndex(t => t.id === tagihanId);
            if (tagihanIndex === -1) return reject(new Error("Tagihan tidak ditemukan"));
            
            const tagihan = santriDetail.keuangan.tagihan[tagihanIndex];
            
            santriDetail.keuangan.tagihan[tagihanIndex].status = 'paid';

            const newLog = {
                id: `act-payment-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: "catat_spp",
                title: `Pembayaran ${tagihan.title}`,
                recordedBy: "Aplikasi Wali Santri",
                metadata: {
                    tagihanId: tagihan.id,
                    amount: tagihan.amount,
                    method: "Virtual Account (Simulasi)"
                }
            };
            santriDetail.activityLog.unshift(newLog);

            resolve({ status: "success", data: { message: "Pembayaran berhasil" } });
        }, 800);
    });
};

/**
 * [DIUBAH] Mensimulasikan pembuatan transaksi Top-Up dengan status 'pending'.
 * Fungsi ini hanya akan membuat log aktivitas dan mengembalikan ID transaksinya.
 */
export const processTopUp = (santriId, amount) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const detailKey = `detail-${santriId.split('-').slice(1).join('-')}`;
            const santriDetail = MOCK_DB[detailKey];
            if (!santriDetail) {
                return reject(new Error("Santri tidak ditemukan"));
            }

            const transactionId = `act-topup-${Date.now()}`;
            const newLog = {
                id: transactionId,
                timestamp: new Date().toISOString(),
                type: "topup_saldo",
                title: `Top-Up Saldo Saku`,
                status: "pending", // Status awal adalah 'pending'
                recordedBy: "Aplikasi Wali Santri",
                metadata: {
                    amount: amount,
                    method: "Virtual Account (Simulasi)"
                }
            };

            if (!santriDetail.activityLog) {
                santriDetail.activityLog = [];
            }
            santriDetail.activityLog.unshift(newLog);

            // Kembalikan ID transaksi agar bisa digunakan untuk konfirmasi
            resolve({
                status: "pending",
                data: { transactionId: transactionId }
            });
        }, 800);
    });
};

/**
 * [DIUBAH] Mensimulasikan konfirmasi pembayaran yang berhasil setelah beberapa saat.
 * Fungsi ini akan dipanggil terpisah dari UI untuk mengubah status 'pending' menjadi 'paid'.
 */
export const completeMockTopUp = (santriId, transactionId) => {
    // Simulasi delay dari payment gateway (misalnya 5 detik)
    setTimeout(() => {
        const detailKey = `detail-${santriId.split('-').slice(1).join('-')}`;
        const santriDetail = MOCK_DB[detailKey];
        if (!santriDetail) return;

        const logIndex = santriDetail.activityLog.findIndex(log => log.id === transactionId);

        if (logIndex > -1) {
            // Ubah status log menjadi 'paid'
            santriDetail.activityLog[logIndex].status = 'paid';
            
            // Tambahkan nominal ke saldo santri
            const amount = santriDetail.activityLog[logIndex].metadata.amount;
            santriDetail.goKop.saldo += amount;
            
            console.log(`[SIMULASI] Top-Up ${transactionId} berhasil. Saldo baru: ${santriDetail.goKop.saldo}`);
        } else {
            console.error(`[SIMULASI] Gagal menemukan transaksi Top-Up dengan ID: ${transactionId}`);
        }
    }, 5000); // Jeda 5 detik
};
