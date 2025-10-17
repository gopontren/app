// src/components/SantriSwitcher.js
// KOMPONEN BARU: Bertanggung jawab untuk merender dan mengelola UI pemilih santri.
// Komponen ini bisa digunakan kembali di halaman Tagihan dan Riwayat.

/**
 * Merender tombol pemilih santri.
 * @param {HTMLElement} container - Elemen container untuk menempatkan switcher.
 * @param {object} currentSantriProfile - Profil santri yang sedang aktif.
 * @param {Array} allSantriProfiles - Daftar semua profil santri.
 */
function renderSwitcherButton(container, currentSantriProfile, allSantriProfiles) {
    if (!container || !currentSantriProfile) return;

    // Jika hanya ada 1 santri, tampilkan info statis.
    if (allSantriProfiles.length <= 1) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl p-4 shadow-sm flex items-center">
                <img src="${currentSantriProfile.avatar}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
                <div>
                    <p class="text-xs text-slate-500">Menampilkan data untuk:</p>
                    <p class="font-bold text-slate-800">${currentSantriProfile.name}</p>
                </div>
            </div>
        `;
    } else {
        // Jika lebih dari 1 santri, tampilkan tombol yang bisa membuka modal.
        container.innerHTML = `
            <button id="open-santri-modal-btn" class="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between hover:bg-slate-50 transition">
                <div class="flex items-center text-left">
                    <img src="${currentSantriProfile.avatar}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
                    <div>
                        <p class="text-xs text-slate-500">Menampilkan data untuk:</p>
                        <p class="font-bold text-slate-800">${currentSantriProfile.name}</p>
                    </div>
                </div>
                <i data-lucide="chevrons-up-down" class="w-5 h-5 text-slate-400"></i>
            </button>
        `;
    }
    lucide.createIcons();
}

/**
 * Merender isi dari modal pemilihan santri.
 * @param {HTMLElement} listContainer - Elemen container untuk daftar pilihan santri.
 * @param {object} currentSantriProfile - Profil santri yang sedang aktif.
 * @param {Array} allSantriProfiles - Daftar semua profil santri.
 */
function renderModalList(listContainer, currentSantriProfile, allSantriProfiles) {
    if (!listContainer) return;

    listContainer.innerHTML = allSantriProfiles.map(santri => {
        const isActive = santri.id === currentSantriProfile.id;
        return `
            <button data-santri-id="${santri.id}" class="santri-select-item w-full flex items-center justify-between p-3 rounded-xl transition ${isActive ? 'bg-emerald-100' : 'hover:bg-white'}">
                <div class="flex items-center">
                    <img src="${santri.avatar}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
                    <span class="font-semibold text-slate-700">${santri.name}</span>
                </div>
                ${isActive ? '<i data-lucide="check-circle-2" class="w-6 h-6 text-emerald-600"></i>' : ''}
            </button>
        `;
    }).join('');
    lucide.createIcons();
}


/**
 * Fungsi utama untuk menginisialisasi Santri Switcher pada sebuah halaman.
 * @param {object} config - Objek konfigurasi.
 * @param {string} config.switcherContainerId - ID elemen untuk menempatkan tombol switcher.
 * @param {string} config.modalId - ID elemen modal.
 * @param {string} config.modalContentId - ID elemen konten di dalam modal.
 * @param {string} config.modalListId - ID elemen untuk daftar pilihan santri di modal.
 * @param {string} config.closeModalBtnId - ID tombol untuk menutup modal.
 * @param {object} config.currentSantri - Profil santri yang aktif saat ini.
 * @param {Array} config.allSantri - Daftar semua profil santri.
 * @param {Function} config.onSantriChange - Callback function yang akan dipanggil saat santri diganti, menerima santriId sebagai argumen.
 */
export function initSantriSwitcher({
    switcherContainerId,
    modalId,
    modalContentId,
    modalListId,
    closeModalBtnId,
    currentSantri,
    allSantri,
    onSantriChange
}) {
    const switcherContainer = document.getElementById(switcherContainerId);
    const modal = document.getElementById(modalId);
    const modalContent = document.getElementById(modalContentId);
    const modalList = document.getElementById(modalListId);
    const closeModalBtn = document.getElementById(closeModalBtnId);

    // Render tombol awal
    renderSwitcherButton(switcherContainer, currentSantri, allSantri);

    // Jika tidak ada cukup santri untuk diganti, hentikan eksekusi.
    if (allSantri.length <= 1) {
        return;
    }

    // Fungsi untuk membuka dan menutup modal
    const openModal = () => {
        renderModalList(modalList, currentSantri, allSantri);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modalContent.classList.remove('translate-y-full'), 10);
    };

    const closeModal = () => {
        modalContent.classList.add('translate-y-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    // Tambahkan event listeners
    switcherContainer.addEventListener('click', (e) => {
        if (e.target.closest('#open-santri-modal-btn')) {
            openModal();
        }
    });

    modalList.addEventListener('click', (e) => {
        const selectedButton = e.target.closest('.santri-select-item');
        if (selectedButton) {
            const newSantriId = selectedButton.dataset.santriId;
            if (newSantriId !== currentSantri.id) {
                // Panggil callback jika santri berubah
                onSantriChange(newSantriId);
            }
            closeModal();
        }
    });

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Tutup modal jika area di luar konten diklik
        if (e.target === modal) {
            closeModal();
        }
    });
}
