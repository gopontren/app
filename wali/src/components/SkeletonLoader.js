// src/components/SkeletonLoader.js
// KOMPONEN BARU: Berisi kumpulan fungsi untuk menghasilkan markup HTML
// untuk berbagai jenis skeleton loader yang digunakan di seluruh aplikasi.

/**
 * Menghasilkan HTML untuk skeleton loader pada grid produk Go-Kop.
 * @param {number} count - Jumlah kartu skeleton yang ingin dibuat.
 * @returns {string} String HTML dari skeleton loader.
 */
export function createProductGridSkeleton(count = 4) {
    const skeletonCard = `
        <div class="bg-white rounded-2xl shadow-sm animate-pulse">
            <div class="w-full h-28 bg-slate-200 rounded-t-2xl"></div>
            <div class="p-3 space-y-3">
                <div class="h-3 bg-slate-200 rounded w-1/3"></div>
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-5 bg-slate-200 rounded w-1/2"></div>
            </div>
        </div>
    `;
    return Array(count).fill(skeletonCard).join('');
}

/**
 * Menghasilkan HTML untuk skeleton loader item daftar (seperti di Riwayat atau Tagihan).
 * @param {number} count - Jumlah item skeleton yang ingin dibuat.
 * @returns {string} String HTML dari skeleton loader.
 */
export function createListItemSkeleton(count = 3) {
    const skeletonItem = `
        <div class="bg-white rounded-2xl p-4 h-20 shadow-sm animate-pulse w-full">
            <div class="flex items-center h-full">
                <div class="flex-1 space-y-2">
                    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div class="w-16 h-8 bg-slate-200 rounded-full"></div>
            </div>
        </div>
    `;
    return Array(count).fill(skeletonItem).join('');
}

/**
 * Menghasilkan HTML untuk skeleton loader pada komponen Santri Switcher.
 * @returns {string} String HTML dari skeleton loader.
 */
export function createSantriSwitcherSkeleton() {
    return `<div class="bg-slate-200 rounded-2xl p-4 h-16 animate-pulse"></div>`;
}

/**
 * Menghasilkan HTML untuk skeleton loader pada halaman Checkout.
 * @returns {string} String HTML dari skeleton loader.
 */
export function createCheckoutPageSkeleton() {
    return `
        <div class="space-y-4">
            <div class="bg-white rounded-2xl p-4 h-20 animate-pulse"></div>
            <div class="bg-white rounded-2xl p-4 h-40 animate-pulse"></div>
            <div class="bg-white rounded-2xl p-4 h-32 animate-pulse"></div>
        </div>
    `;
}
export function createSantriCardSkeleton() {
    return `
        <div class="santri-slide w-full flex-shrink-0 px-2 box-border">
            <div class="bg-gray-800/50 rounded-3xl p-6 h-[220px] animate-pulse"></div>
        </div>
    `;
}