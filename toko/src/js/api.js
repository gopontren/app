import {
    updateProductInStore,
    removeProductFromStore,
    updateCategoryInStore,
    removeCategoryFromStore,
    updateSupplierInStore,
    removeSupplierFromStore,
} from './store.js';
import { saveTransactionOffline } from './offline-handler.js';


/**
 * File ini mensimulasikan backend atau database.
 * ---
 * PERUBAHAN:
 * - Menambahkan mock data `mockUstadzTaskGroups` untuk mensimulasikan "Tim Drop Point"
 * yang dibuat oleh Admin Pesantren.
 * - Menambahkan mock data `mockUstadzPickupTasks` sebagai "database" untuk tugas pengambilan paket.
 * - Merombak fungsi `updateOrderStatus` untuk membuat tugas baru saat status pesanan
 * menjadi 'siap_diambil'.
 * - Menambahkan `tenantId` pada mock data pesanan online.
 */

// --- DATABASE MOCK ---

let mockSuppliers = [
    { id: 1, name: 'PT Indofood', contact: '081234567890', address: 'Jl. Sudirman, Jakarta' },
    { id: 2, name: 'Unilever Indonesia', contact: '081223344556', address: 'BSD City, Tangerang' },
];

let mockCategories = [
    { id: 1, name: 'Makanan Ringan' },
    { id: 2, name: 'Minuman' },
    { id: 3, name: 'Alat Tulis' },
    { id: 4, name: 'Perlengkapan Mandi' },
    { id: 5, name: 'Lain-lain' }
];

let mockProducts = [
    { id: 1, categoryId: 1, name: 'Chitato Sapi Panggang', sku: 'MR-001', barcode: '899001123456', price: 10000, costPrice: 8000, stock: 50, image: 'https://placehold.co/150x150/E2E8F0/334155?text=Chi' },
    { id: 2, categoryId: 2, name: 'Teh Pucuk Harum', sku: 'MN-001', barcode: '899002123457', price: 3500, costPrice: 2500, stock: 120, image: 'https://placehold.co/150x150/E2E8F0/334155?text=Teh' },
    { id: 3, categoryId: 3, name: 'Buku Tulis Sinar Dunia', sku: 'ATK-001', barcode: '899003123458', price: 5000, costPrice: 3500, stock: 80, image: 'https://placehold.co/150x150/E2E8F0/334155?text=Buku' },
    { id: 4, categoryId: 4, name: 'Sabun Lifebuoy', sku: 'PM-001', barcode: '899004123459', price: 4000, costPrice: 3000, stock: 40, image: 'https://placehold.co/150x150/E2E8F0/334155?text=Sabun' },
    { id: 5, categoryId: 1, name: 'Oreo Original', sku: 'MR-002', barcode: '899005123460', price: 8000, costPrice: 6000, stock: 60, image: 'https://placehold.co/150x150/E2E8F0/334155?text=Oreo' },
    { id: 6, categoryId: 2, name: 'Aqua 600ml', sku: 'MN-002', barcode: '899006123461', price: 3000, costPrice: 2000, stock: 200, image: 'https://placehold.co/150x150/E2E8F0/334155?text=Aqua' },
    { id: 7, categoryId: 3, name: 'Pulpen Standard', sku: 'ATK-002', barcode: '899007123462', price: 2000, costPrice: 1000, stock: 150, image: 'https://placehold.co/150x150/E2E8F0/334155?text=Pulp' },
];

let mockSantri = [
    { id: 'STZ-001', name: 'Ahmad Budi Santoso', balance: 50000, availableBalance: 30000, pin: '123456', image: 'https://placehold.co/100x100/E2E8F0/334155?text=Ahmad' },
    { id: 'STZ-002', name: 'Citra Lestari', balance: 150000, availableBalance: 150000, pin: '654321', image: 'https://placehold.co/100x100/E2E8F0/334155?text=Citra' },
];

let mockTransactions = [
    { id: 'TRX-101', date: '2025-09-10T10:05:00', total: 13500, payment: { method: 'cash' }, items: [{productId: 2, quantity:1}, {productId:5, quantity:1}] },
    { id: 'TRX-102', date: '2025-09-10T11:20:00', total: 20000, payment: { method: 'wallet', santri: {id: 'STZ-001'} }, items: [{productId: 1, quantity:2}] },
];

let mockOnlineOrders = [
    { id: 'ORD-001', tenantId: 'pesantren-nf', date: '2025-09-16T10:15:00', waliName: 'Bunda Aisyah', santriName: 'Ahmad Zaki', total: 12000, status: 'baru', deliveryOption: 'ambil_ditempat', items: [{productId: 7, qty: 6, price: 2000}], receiverName: null },
    { id: 'ORD-003', tenantId: 'pesantren-nf', date: '2025-09-16T09:30:00', waliName: 'Bunda Aisyah', santriName: 'Fatimah Az-Zahra', total: 11500, status: 'baru', deliveryOption: 'ambil_ditempat', items: [{productId: 5, qty: 1, price: 8000}, {productId: 2, qty: 1, price: 3500}], receiverName: null },
    { id: 'ORD-004', tenantId: 'pesantren-nf', date: '2025-09-15T14:00:00', waliName: 'Ayah Abdullah', santriName: 'Putra Ramadhan', total: 15000, status: 'siap_diambil', deliveryOption: 'ambil_ditempat', items: [{productId: 3, qty: 3, price: 5000}], receiverName: null },
    { id: 'ORD-002', tenantId: 'pesantren-nf', date: '2025-09-14T18:30:00', waliName: 'Ibu Wati', santriName: 'Citra Lestari', total: 32000, status: 'selesai', deliveryOption: 'pengiriman_toko', items: [{productId: 5, qty: 4, price: 8000}], receiverName: 'Petugas Asrama Putri'},
];

// --- [DATA BARU] Simulasi data dari Aplikasi Admin ---
let mockUstadzTaskGroups = {
    "pesantren-nf": [
        { id: 'group-1', name: 'Tim Drop Point Paket', memberIds: ['ustadz-nf-1', 'ustadz-nf-3'] }
    ]
};

// --- [DATA BARU] Database untuk tugas pengambilan paket ---
let mockUstadzPickupTasks = [];
// -----------------------------------------------------------

let mockPurchases = [
    { id: 'PUR-001', date: '2025-09-07T10:00:00', supplierId: 1, total: 500000 }, 
    { id: 'PUR-002', date: '2025-09-08T14:30:00', supplierId: 3, total: 350000 }
];
let mockExpenses = [
    { id: 'EXP-001', date: '2025-09-05T16:00:00', description: 'Bayar Listrik', amount: 350000 }, 
];
let mockWallet = {
    pendingBalance: 25000,
    availableBalance: 150000,
};
let mockRevenueHistory = [
    { date: '2025-09-10T11:20:00', transactionId: 'TRX-102', amount: 20000 },
    { date: '2025-09-09T18:30:00', transactionId: 'ORD-002', amount: 32000 },
];
let mockWithdrawalHistory = [
    { date: '2025-09-08T15:00:00', amount: 500000, status: 'Selesai' },
];
let mockNotifications = [];
let mockSettings = {
    profile: { name: 'Kasir 1', email: 'kasir1@kopontren.com', avatar: 'https://placehold.co/40x40/E2E8F0/1E40AF?text=K' },
    store: { name: 'Koperasi Al-Ikhlas', address: 'Jl. Pesantren No. 1, Kab. Sejahtera', phone: '0812-3456-7890', description: 'Menyediakan segala kebutuhan santri dan umum.', withdrawalAccountNumber: '1234567890' },
    delivery: { ambil_ditempat: true, pengiriman_toko: true, jasa_pengiriman_aktif: false, jasa_pengiriman_tersedia: [ { id: 'Express', name: 'Express', active: true }, { id: 'Sameday', name: 'Hari yang sama', active: false } ] },
    schedule: { senin: { active: true, open: '08:00', close: '19:00' }, selasa: { active: true, open: '08:00', close: '19:00' }, rabu: { active: true, open: '08:00', close: '19:00' }, kamis: { active: true, open: '08:00', close: '19:00' }, jumat: { active: true, open: '08:00', close: '19:00' }, sabtu: { active: true, open: '08:00', close: '17:00' }, minggu: { active: false, open: '08:00', close: '17:00' } },
    security: { lastPasswordChange: '2025-08-01T10:00:00Z' }
};
const mockUserPassword = 'password123';


// --- HELPER ---
const simulateDelay = (data, delay = 300) => new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay));
const paginate = (data, { page, limit }) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const items = data.slice(startIndex, startIndex + limit);
    return { items, totalItems, totalPages, currentPage: page };
};
const createNotification = (notificationData) => {
    const newId = mockNotifications.length > 0 ? Math.max(...mockNotifications.map(n => n.id)) + 1 : 1;
    const newNotification = {
        id: newId,
        read: false,
        timestamp: new Date().toISOString(),
        ...notificationData
    };
    mockNotifications.unshift(newNotification);
};


// --- API FUNCTIONS ---

// Produk
export const getProducts = async () => simulateDelay(mockProducts);
// ... (sisa fungsi tidak berubah)

// Pesanan Online
export const getOnlineOrders = async () => simulateDelay(mockOnlineOrders);

/**
 * [FUNGSI DIROMBAK]
 * Memperbarui status pesanan dan memicu pembuatan tugas pengambilan jika statusnya 'siap_diambil'.
 */
export const updateOrderStatus = async (orderId, newStatus, details = {}) => {
    const order = mockOnlineOrders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        if (newStatus === 'selesai') {
            order.receiverName = details.receiverName || 'N/A';
            mockWallet.pendingBalance += order.total;
            mockRevenueHistory.unshift({ date: new Date().toISOString(), transactionId: order.id, amount: order.total });

            for (const item of order.items) {
                const product = mockProducts.find(p => p.id === item.productId);
                if (!product || product.stock < item.qty) {
                    order.status = 'diproses';
                    throw new Error(`Stok produk ${product ? product.name : ''} tidak cukup.`);
                }
            }
            order.items.forEach(item => {
                const product = mockProducts.find(p => p.id === item.productId);
                if (product) {
                    product.stock -= item.qty;
                    updateProductInStore(product);
                }
            });
        }
        
        // --- [LOGIKA INTI BARU] ---
        // Jika status diubah menjadi "Siap Diambil", buat tugas untuk Tim Drop Point.
        if (newStatus === 'siap_diambil') {
            const tenantId = order.tenantId;
            const dropPointTeam = mockUstadzTaskGroups[tenantId]?.find(group => group.name.toLowerCase().includes('drop point'));
            
            if (dropPointTeam && dropPointTeam.memberIds.length > 0) {
                const newTask = {
                    id: `TASK-${Date.now()}`,
                    orderId: order.id,
                    koperasiName: mockSettings.store.name, // Ambil dari pengaturan toko
                    santriName: order.santriName,
                    itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
                    status: 'menunggu_pengambilan', // Status awal tugas
                    assignedUstadzIds: dropPointTeam.memberIds,
                    createdAt: new Date().toISOString(),
                    pickedUpAt: null,
                    completedAt: null,
                };
                mockUstadzPickupTasks.push(newTask);
                console.log('[API KASIR] Tugas pengambilan baru dibuat:', newTask);
                createNotification({
                    title: `Pesanan Baru Siap Diambil (#${order.id})`,
                    message: `Pesanan untuk ${order.santriName} siap diambil di ${newTask.koperasiName}.`,
                    type: 'info',
                    link: `#/pengambilanPaket` 
                });
            } else {
                console.warn(`[API KASIR] Peringatan: Tidak ada 'Tim Drop Point' yang ditemukan untuk tenant ${tenantId}. Notifikasi tidak dikirim.`);
            }
        }
        // --- [AKHIR LOGIKA BARU] ---
    }
    return simulateDelay(order);
};
export const cancelOrder = async (orderId) => {
    mockOnlineOrders = mockOnlineOrders.filter(o => o.id !== orderId);
    return simulateDelay({ success: true });
};


// ... Sisa file ini sama persis seperti sebelumnya ...

// Kategori
export const getCategories = async () => simulateDelay(mockCategories);
export const saveCategory = async (categoryData) => {
    let savedCategory;
    if (categoryData.id) {
        const index = mockCategories.findIndex(c => c.id == categoryData.id);
        if (index > -1) {
            mockCategories[index] = { ...mockCategories[index], ...categoryData };
            savedCategory = mockCategories[index];
        }
    } else {
        const newId = mockCategories.length > 0 ? Math.max(...mockCategories.map(c => c.id)) + 1 : 1;
        savedCategory = { ...categoryData, id: newId };
        mockCategories.push(savedCategory);
    }
    updateCategoryInStore(savedCategory);
    return simulateDelay(savedCategory);
};
export const deleteCategory = async (categoryId) => {
    mockCategories = mockCategories.filter(c => c.id != categoryId);
    removeCategoryFromStore(categoryId);
    return simulateDelay({ success: true });
};
// Supplier
export const getSuppliers = async () => simulateDelay(mockSuppliers);
export const saveSupplier = async (supplierData) => {
    let savedSupplier;
    if (supplierData.id) {
        const index = mockSuppliers.findIndex(s => s.id == supplierData.id);
        if (index > -1) {
            mockSuppliers[index] = { ...mockSuppliers[index], ...supplierData };
            savedSupplier = mockSuppliers[index];
        }
    } else {
        const newId = mockSuppliers.length > 0 ? Math.max(...mockSuppliers.map(s => s.id)) + 1 : 1;
        savedSupplier = { ...supplierData, id: newId };
        mockSuppliers.push(savedSupplier);
    }
    updateSupplierInStore(savedSupplier);
    return simulateDelay(savedSupplier);
};
export const deleteSupplier = async (supplierId) => {
    mockSuppliers = mockSuppliers.filter(s => s.id != supplierId);
    removeSupplierFromStore(supplierId);
    return simulateDelay({ success: true });
};
// Pembelian
export const getPurchasesPaginated = async ({ page = 1, limit = 10 }) => {
    const sorted = mockPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    return simulateDelay(paginate(sorted, { page, limit }));
};
export const addPurchase = async (purchaseData) => {
    const newId = `PUR-${String(mockPurchases.length + 1).padStart(3, '0')}`;
    const newPurchase = { ...purchaseData, id: newId, date: new Date().toISOString() };
    mockPurchases.push(newPurchase);
    newPurchase.items.forEach(item => {
        const product = mockProducts.find(p => p.id == item.productId);
        if (product) {
            product.stock += item.qty;
            product.costPrice = item.costPrice;
            updateProductInStore(product);
        }
    });
    return simulateDelay(newPurchase);
};
// Pengeluaran
export const getExpensesPaginated = async ({ page = 1, limit = 10 }) => {
    const sorted = mockExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    return simulateDelay(paginate(sorted, { page, limit }));
};
export const addExpense = async (expenseData) => {
    const newId = `EXP-${String(mockExpenses.length + 1).padStart(3, '0')}`;
    const newExpense = { ...expenseData, id: newId, date: new Date().toISOString() };
    mockExpenses.push(newExpense);
    return simulateDelay(newExpense);
};
// Stok Opname
export const adjustStock = async (productId, newStock, oldStock, reason) => {
    const product = mockProducts.find(p => p.id == productId);
    if (product) {
        product.stock = newStock;
        updateProductInStore(product);
    }
    return simulateDelay(product);
};
// Kasir
export const findSantri = async (query) => {
    const lowerQuery = query.toLowerCase();
    const santri = mockSantri.find(s => s.id.toLowerCase() === lowerQuery || s.name.toLowerCase().includes(lowerQuery));
    return simulateDelay(santri, 500);
};
export const verifySantriPin = async (santriId, pin) => {
    const santri = mockSantri.find(s => s.id === santriId);
    if (santri && santri.pin === pin) {
        return simulateDelay({ success: true }, 1000);
    }
    return simulateDelay({ success: false }, 1000);
};
export const addTransaction = async (txData, isSyncing = false) => {
    if (!navigator.onLine && !isSyncing) {
        saveTransactionOffline(txData);
        return Promise.resolve({ success: true, offline: true });
    }
    const newId = `TRX-${String(mockTransactions.length + 103).padStart(3, '0')}`;
    const newTx = { ...txData, id: newId, date: txData.savedAt || new Date().toISOString() };
    mockTransactions.push(newTx);
    txData.items.forEach(item => {
        const product = mockProducts.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
            updateProductInStore(product);
        }
    });
    if (txData.payment.method === 'wallet') {
        if (txData.payment.santri) {
            const santri = mockSantri.find(s => s.id === txData.payment.santri.id);
            if (santri) santri.availableBalance -= txData.total;
        }
        mockWallet.pendingBalance += txData.total;
        mockRevenueHistory.unshift({ date: newTx.date, transactionId: newTx.id, amount: txData.total });
    }
    delete newTx.offlineId;
    delete newTx.savedAt;
    return simulateDelay(newTx);
};
// Laporan
export const getTransactionHistory = async () => {
    const posTx = mockTransactions.map(tx => ({...tx, type: 'Kasir'}));
    const onlineTx = mockOnlineOrders.filter(o => o.status === 'selesai').map(o => ({...o, type: 'Online'}));
    return simulateDelay([...posTx, ...onlineTx].sort((a, b) => new Date(b.date) - new Date(a.date)));
}
export const getComprehensiveReportData = async (period) => {
    const allTransactions = await getTransactionHistory();
    let filteredTransactions = allTransactions;
    if (period.startDate && period.endDate) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        filteredTransactions = allTransactions.filter(tx => new Date(tx.date) >= start && new Date(tx.date) <= end);
    }
    const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
    let totalCOGS = 0;
    const salesByProduct = {};
    const salesByCategory = {};
    filteredTransactions.forEach(tx => {
        (tx.items || []).forEach(item => {
            const product = mockProducts.find(p => p.id === (item.productId || item.id));
            if (product) {
                const qty = item.quantity || item.qty;
                totalCOGS += (product.costPrice || 0) * qty;
                salesByProduct[product.id] = (salesByProduct[product.id] || 0) + qty;
                const category = mockCategories.find(c => c.id === product.categoryId);
                if (category) salesByCategory[category.name] = (salesByCategory[category.name] || 0) + (product.price * qty);
            }
        });
    });
    const grossProfit = totalRevenue - totalCOGS;
    const allExpenses = await simulateDelay(mockExpenses);
    let filteredExpenses = allExpenses;
    if(period.startDate && period.endDate) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        filteredExpenses = allExpenses.filter(ex => new Date(ex.date) >= start && new Date(ex.date) <= end);
    }
    const totalExpenses = filteredExpenses.reduce((sum, ex) => sum + ex.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const bestSellers = Object.entries(salesByProduct).sort(([, qtyA], [, qtyB]) => qtyB - qtyA).slice(0, 5).map(([productId, quantity]) => ({ product: mockProducts.find(p => p.id == productId), quantity }));
    const lowStockProducts = mockProducts.filter(p => p.stock > 0 && p.stock < 20).sort((a,b) => a.stock - b.stock);
    return simulateDelay({ financialSummary: { totalRevenue, totalCOGS, grossProfit, totalExpenses, netProfit }, bestSellers, lowStockProducts, salesByCategory });
};
// Saldo E-Wallet
export const getWalletData = async (period = { startDate: null, endDate: null }) => {
    const today = new Date('2025-09-11T00:00:00');
    const revenuesToSettle = mockRevenueHistory.filter(rev => new Date(rev.date) < today && !rev.settled);
    if (revenuesToSettle.length > 0) {
        let amountToSettle = 0;
        revenuesToSettle.forEach(rev => {
            amountToSettle += rev.amount;
            rev.settled = true;
        });
        mockWallet.availableBalance += amountToSettle;
        mockWallet.pendingBalance -= amountToSettle; 
        if(mockWallet.pendingBalance < 0) mockWallet.pendingBalance = 0;
    }
    let filteredRevenue = mockRevenueHistory;
    let filteredWithdrawal = mockWithdrawalHistory;
    if (period.startDate && period.endDate) {
        filteredRevenue = mockRevenueHistory.filter(item => new Date(item.date) >= period.startDate && new Date(item.date) <= period.endDate);
        filteredWithdrawal = mockWithdrawalHistory.filter(item => new Date(item.date) >= period.startDate && new Date(item.date) <= period.endDate);
    }
    return simulateDelay({ balances: mockWallet, revenueHistory: filteredRevenue, withdrawalHistory: filteredWithdrawal });
};
export const requestWithdrawal = async (amount) => {
    if (amount > mockWallet.availableBalance) throw new Error("Saldo tidak mencukupi untuk melakukan penarikan.");
    mockWallet.availableBalance -= amount;
    const newWithdrawal = { date: new Date().toISOString(), amount: amount, status: 'Diproses' };
    mockWithdrawalHistory.unshift(newWithdrawal);
    return simulateDelay({ success: true, newBalance: mockWallet.availableBalance });
};
// Pengaturan
export const getSettings = async (section) => {
    if (section && mockSettings[section]) return simulateDelay(mockSettings[section]);
    return simulateDelay(mockSettings);
};
export const saveSettings = async (section, data) => {
    if (mockSettings[section]) {
        if (data.withdrawalAccountNumber) delete data.withdrawalAccountNumber;
        mockSettings[section] = { ...mockSettings[section], ...data };
        return simulateDelay({ success: true, data: mockSettings[section] });
    }
    return Promise.reject(new Error("Bagian pengaturan tidak ditemukan."));
};
export const updateWithdrawalAccount = async (currentPassword, newAccountNumber) => {
    if (currentPassword !== mockUserPassword) return Promise.reject(new Error("Password yang Anda masukkan salah."));
    mockSettings.store.withdrawalAccountNumber = newAccountNumber;
    createNotification({
        title: 'Keamanan: Nomor Rekening Diubah',
        message: `Nomor rekening penarikan dana berhasil diubah. Penarikan dana ditangguhkan selama 24 jam.`,
        type: 'warning',
        link: '#/pengaturan?section=store'
    });
    return simulateDelay({ success: true, newAccountNumber });
};
// Notifikasi
export const getNotifications = async () => simulateDelay(mockNotifications);
export const markNotificationAsRead = async (notificationId) => {
    const notification = mockNotifications.find(n => n.id == notificationId);
    if (notification) notification.read = true;
    return simulateDelay(notification);
};
export const markAllNotificationsAsRead = async () => {
    mockNotifications.forEach(n => n.read = true);
    return simulateDelay({ success: true });
};
// ... (fungsi saveProduct tidak perlu ditampilkan lagi karena tidak berubah)
export const saveProduct = async (productData, isFromQuickAdd = false) => {
    let savedProduct;
    if (productData.id) {
        const index = mockProducts.findIndex(p => p.id == productData.id);
        if (index > -1) {
            mockProducts[index] = { ...mockProducts[index], ...productData };
            savedProduct = mockProducts[index];
        }
    } else {
        const newId = mockProducts.length > 0 ? Math.max(...mockProducts.map(p => p.id)) + 1 : 1;
        savedProduct = { ...productData, id: newId };
        mockProducts.push(savedProduct);
    }
    savedProduct.hasNoImage = !savedProduct.image || savedProduct.image.includes('placehold.co');
    savedProduct.hasNoCostPrice = !savedProduct.costPrice || savedProduct.costPrice <= 0;
    if (isFromQuickAdd && (savedProduct.hasNoImage || savedProduct.hasNoCostPrice)) {
         createNotification({
            title: 'Perlu Tinjauan: Produk Baru Ditambahkan',
            message: `Produk "${savedProduct.name}" ditambahkan via kasir. Mohon lengkapi data gambar dan harga belinya.`,
            type: 'warning',
            link: `#/produk?edit=${savedProduct.id}`
        });
    }
    updateProductInStore(savedProduct);
    return simulateDelay(savedProduct);
};
export const deleteProduct = async (productId) => {
    mockProducts = mockProducts.filter(p => p.id != productId);
    removeProductFromStore(productId);
    return simulateDelay({ success: true });
};
