// src/components/ProductCard.js
// KOMPONEN BARU: Berisi fungsi untuk membuat markup HTML dari satu kartu produk.
// Tujuannya adalah untuk memisahkan logika tampilan dari logika pemuatan data di gokop-home.js.

/**
 * Membuat dan mengembalikan string HTML untuk satu kartu produk.
 * @param {object} product - Objek produk yang berisi data seperti id, image, name, store, dan price.
 * @returns {string} String HTML dari elemen kartu produk.
 */
export function createProductCardHTML(product) {
    if (!product) return '';

    return `
        <a href="#go-kop/produk/${product.id}" class="block bg-white rounded-2xl shadow-md shadow-slate-200/50 overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <div class="overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300">
            </div>
            <div class="p-3">
                <p class="text-xs text-slate-500">${product.store}</p>
                <h3 class="font-bold text-sm text-slate-800 truncate mt-1">${product.name}</h3>
                <p class="font-semibold text-emerald-600 mt-2">Rp ${product.price.toLocaleString('id-ID')}</p>
            </div>
        </a>
    `;
}
