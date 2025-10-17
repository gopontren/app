// src/pages/js/checkout.js
// [PEMBARUAN BESAR]
// - Logika rendering diubah total untuk menggunakan <template> dari file HTML.
// - Menghapus pembuatan string HTML dari dalam JavaScript.
// - Kode menjadi lebih bersih, deklaratif, dan mudah dikelola.

import { getCart, clearCart, getSession, getActiveSantriId, setActiveSantri } from '/src/services/state.js';
import { getSantriList, getCheckoutDetails, createOnlineOrder } from '/src/services/api.js';

// --- State Halaman ---
let currentCart = [];
let allSantriProfiles = []; 
let currentSantriData = null; 
let checkoutDetails = null;
let isSantriListOpen = false; 

/**
 * [DIUBAH] Merender blok pesanan untuk setiap toko menggunakan template.
 */
function renderOrdersByStore(ordersByStore) {
    const container = document.getElementById('orders-by-store-container');
    const storeTemplate = document.getElementById('store-order-template');
    const itemTemplate = document.getElementById('order-item-template');
    if (!container || !storeTemplate || !itemTemplate) return;

    container.innerHTML = ''; // Kosongkan container
    const fragment = document.createDocumentFragment();

    ordersByStore.forEach(storeOrder => {
        const storeClone = storeTemplate.content.cloneNode(true);
        storeClone.querySelector('.store-name').textContent = storeOrder.storeName;
        storeClone.querySelector('.store-subtotal').textContent = `Rp ${storeOrder.subtotal.toLocaleString('id-ID')}`;
        storeClone.querySelector('.store-shipping-fee').textContent = `Rp ${(storeOrder.shippingFee - storeOrder.shippingDiscount).toLocaleString('id-ID')}`;
        
        const itemsContainer = storeClone.querySelector('.store-items-container');
        storeOrder.items.forEach(item => {
            const itemClone = itemTemplate.content.cloneNode(true);
            itemClone.querySelector('.item-summary-text').textContent = `${item.quantity}x ${item.name}`;
            itemClone.querySelector('.item-summary-price').textContent = `Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`;
            itemsContainer.appendChild(itemClone);
        });
        
        fragment.appendChild(storeClone);
    });

    container.appendChild(fragment);
}

/**
 * Merender ringkasan pembayaran di footer. (Tidak ada perubahan logika, hanya memastikan ID tetap sama).
 */
function renderPaymentSummary(summary) {
    document.getElementById('summary-subtotal').textContent = `Rp ${summary.totalBelanjaProduk.toLocaleString('id-ID')}`;
    document.getElementById('summary-shipping').textContent = `Rp ${summary.totalOngkir.toLocaleString('id-ID')}`;
    document.getElementById('summary-service-fee').textContent = `Rp ${summary.biayaLayanan.toLocaleString('id-ID')}`;
    document.getElementById('summary-grand-total').textContent = `Rp ${summary.grandTotal.toLocaleString('id-ID')}`;
    const discountRow = document.getElementById('summary-discount-row');
    if (summary.totalDiskon > 0) {
        document.getElementById('summary-discount').textContent = `- Rp ${summary.totalDiskon.toLocaleString('id-ID')}`;
        discountRow.classList.remove('hidden');
    } else {
        discountRow.classList.add('hidden');
    }
}

/**
 * [DIUBAH] Merender UI untuk pemilih santri menggunakan template.
 */
function renderSantriSwitcher() {
    const changeBtn = document.getElementById('change-santri-btn');
    const displayInfo = document.getElementById('santri-display-info');
    const selectionList = document.getElementById('santri-selection-list');
    const template = document.getElementById('santri-option-template');

    if (!changeBtn || !selectionList || !template) return;

    changeBtn.classList.toggle('hidden', allSantriProfiles.length <= 1);
    document.getElementById('checkout-santri-name').textContent = `Pesanan untuk: ${currentSantriData.name}`;

    selectionList.innerHTML = ''; // Kosongkan daftar sebelum mengisi ulang
    allSantriProfiles.forEach(santri => {
        const clone = template.content.cloneNode(true);
        const radio = clone.querySelector('.santri-radio');
        const label = clone.querySelector('label');
        
        radio.value = santri.id;
        clone.querySelector('.santri-name').textContent = santri.name;

        if (santri.id === currentSantriData.id) {
            radio.checked = true;
            label.classList.add('bg-emerald-50');
        } else {
             label.classList.add('hover:bg-slate-50');
        }
        
        selectionList.appendChild(clone);
    });

    displayInfo.classList.toggle('hidden', isSantriListOpen);
    selectionList.classList.toggle('hidden', !isSantriListOpen);
    changeBtn.textContent = isSantriListOpen ? 'Selesai' : 'Ganti';
}

/**
 * Memperbarui status UI checkout. (Tidak ada perubahan)
 */
function updateCheckoutState() {
    const confirmButton = document.getElementById('confirm-order-button');
    const buttonText = confirmButton.querySelector('.button-text');

    confirmButton.disabled = currentCart.length === 0;
    buttonText.textContent = 'Lanjutkan ke Pembayaran';
}

/**
 * Menangani proses saat tombol konfirmasi diklik. (Tidak ada perubahan)
 */
async function handleConfirmOrder() {
    const confirmButton = document.getElementById('confirm-order-button');
    const buttonText = confirmButton.querySelector('.button-text');
    const spinner = confirmButton.querySelector('.button-spinner');
    const orderNotes = document.getElementById('order-notes').value;

    confirmButton.disabled = true;
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');

    try {
        const session = getSession();
        const orderData = {
            waliId: session.user.id,
            santriId: currentSantriData.id,
            paymentMethod: 'pembayaran_online',
            notes: orderNotes,
            checkoutDetails: checkoutDetails,
        };

        const response = await createOnlineOrder(orderData);
        
        if (response.status === 'redirect') {
            clearCart();
            window.location.href = response.data.paymentUrl;
        } else {
            clearCart();
            alert('Pesanan berhasil dibuat!');
            window.location.hash = '#riwayat/pesanan';
        }

    } catch (error) {
        console.error('Error saat konfirmasi pesanan:', error);
        alert(`Terjadi kesalahan: ${error.message}`);
        confirmButton.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

/**
 * Menangani semua event listener untuk halaman ini.
 */
function setupEventListeners() {
    const changeBtn = document.getElementById('change-santri-btn');
    const selectionList = document.getElementById('santri-selection-list');

    changeBtn.addEventListener('click', () => {
        isSantriListOpen = !isSantriListOpen;
        renderSantriSwitcher();
    });

    selectionList.addEventListener('change', async (e) => {
        const selectedSantriId = e.target.value;
        if (selectedSantriId !== currentSantriData.id) {
            const profile = allSantriProfiles.find(s => s.id === selectedSantriId);
            currentSantriData = { ...currentSantriData, ...profile };
            setActiveSantri(selectedSantriId);
            renderSantriSwitcher();
        }
    });

    document.getElementById('confirm-order-button').addEventListener('click', handleConfirmOrder);
}

// Fungsi utama yang dipanggil oleh router
export default async function initCheckout() {
    currentCart = getCart();
    if (currentCart.length === 0) {
        window.location.hash = '#go-kop/home';
        return;
    }

    try {
        const session = getSession();
        const activeSantriId = getActiveSantriId();

        const [santriListResponse, checkoutDetailsResponse] = await Promise.all([
            getSantriList(session.user.santri),
            getCheckoutDetails(currentCart)
        ]);
        
        allSantriProfiles = santriListResponse.data;
        currentSantriData = allSantriProfiles.find(s => s.id === activeSantriId);
        checkoutDetails = checkoutDetailsResponse.data;

        renderSantriSwitcher();
        renderOrdersByStore(checkoutDetails.ordersByStore);
        renderPaymentSummary(checkoutDetails.summary);

        document.getElementById('checkout-skeleton-loader').classList.add('hidden');
        document.getElementById('checkout-footer-skeleton').classList.add('hidden');
        document.getElementById('checkout-real-content').classList.remove('hidden');
        document.getElementById('checkout-action-footer').classList.remove('hidden');

        setupEventListeners();
        updateCheckoutState();

    } catch (error) {
        console.error('Gagal memuat data checkout:', error);
        document.getElementById('checkout-content').innerHTML = `<p class="p-8 text-center text-red-500">Gagal memuat data. Silakan kembali ke keranjang.</p>`;
        document.getElementById('checkout-footer-skeleton').classList.add('hidden');
    }
}
