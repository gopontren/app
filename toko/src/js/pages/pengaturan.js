import { getSettings, saveSettings, updateWithdrawalAccount } from '../api.js';
import { showNotification, showConfirmationModal } from '../ui.js';
import { performLogout } from '../auth.js';
import { SETTINGS_SECTIONS } from '../config.js'; // <-- PERUBAHAN: Impor dari config

// const sections = { ... } // <-- PERUBAHAN: Dihapus dan diganti dari config

/**
 * Memuat konten dari file HTML partial ke dalam area konten utama.
 * @param {string} sectionName - Nama seksi yang akan dimuat.
 */
async function loadSection(sectionName) {
    const settingsContent = document.getElementById('settings-content');
    if (!settingsContent) {
        console.error("Fatal Error: #settings-content tidak ditemukan.");
        return;
    }

    const section = SETTINGS_SECTIONS[sectionName];
    if (!section) {
        console.error(`Seksi pengaturan "${sectionName}" tidak ditemukan.`);
        settingsContent.innerHTML = `<p class="text-red-500 text-center">Konten tidak ditemukan.</p>`;
        return;
    }

    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.classList.toggle('bg-blue-100', item.dataset.section === sectionName);
        item.classList.toggle('text-blue-700', item.dataset.section === sectionName);
    });

    try {
        const response = await fetch(section.template);
        if (!response.ok) throw new Error(`Gagal memuat template: ${section.template}`);
        const html = await response.text();
        settingsContent.innerHTML = html;
        
        // Ganti nama fungsi init dari config agar sesuai
        const initFunction = sectionInitializers[sectionName];
        if (typeof initFunction === 'function') {
            await initFunction();
        }
    } catch (error) {
        console.error(`Error saat memuat seksi "${sectionName}":`, error);
        settingsContent.innerHTML = `<p class="text-red-500 text-center">Gagal memuat konten seksi.</p>`;
    }
}

// --- MODAL LOGIC (UNTUK UBAH REKENING) ---
const openChangeAccountModal = () => {
    const modal = document.getElementById('change-account-modal');
    if (!modal) return;
    modal.classList.replace('hidden', 'flex');
    setTimeout(() => modal.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0'), 10);
};

const closeChangeAccountModal = () => {
    const modal = document.getElementById('change-account-modal');
    if (!modal) return;
    modal.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.replace('flex', 'hidden'), 300);
};

// --- SECTION INITIALIZERS ---
async function initProfileSection() {
    const form = document.getElementById('profile-settings-form');
    if (!form) return;
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const changeAvatarBtn = document.getElementById('btn-change-avatar');
    const avatarFileInput = document.getElementById('avatar-file-input');
    let newAvatarBase64 = null;

    const settings = await getSettings('profile');
    form.querySelector('#profile-name').value = settings.name;
    form.querySelector('#profile-email').value = settings.email;
    if (avatarPreview && settings.avatar) {
        avatarPreview.src = settings.avatar;
    }
    changeAvatarBtn.addEventListener('click', () => avatarFileInput.click());
    avatarFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
            showNotification('Ukuran file terlalu besar, maksimal 1MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            newAvatarBase64 = reader.result;
            avatarPreview.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dataToSave = {
            name: form.querySelector('#profile-name').value,
            email: form.querySelector('#profile-email').value,
        };
        if (newAvatarBase64) {
            dataToSave.avatar = newAvatarBase64;
        }
        await saveSettings('profile', dataToSave);
        showNotification('Pengaturan profil berhasil disimpan.');
    });
}

async function initStoreSection() {
    const form = document.getElementById('store-settings-form');
    if (!form) return;
    const changeAccountModal = document.getElementById('change-account-modal');
    const changeAccountForm = document.getElementById('change-account-form');
    const btnShowChangeModal = document.getElementById('btn-show-change-account-modal');
    const btnCancelChangeAccount = document.getElementById('btn-cancel-change-account');

    const loadStoreData = async () => {
        const settings = await getSettings('store');
        form.querySelector('#store-name').value = settings.name;
        form.querySelector('#store-address').value = settings.address;
        form.querySelector('#store-phone').value = settings.phone;
        form.querySelector('#store-description').value = settings.description;
        form.querySelector('#store-withdrawal-account-display').textContent = settings.withdrawalAccountNumber;
    };
    await loadStoreData();
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { description: form.querySelector('#store-description').value };
        await saveSettings('store', data);
        showNotification('Pengaturan deskripsi toko berhasil disimpan.');
    });
    if (btnShowChangeModal) btnShowChangeModal.addEventListener('click', () => {
        if (changeAccountForm) changeAccountForm.reset();
        openChangeAccountModal();
    });
    if (btnCancelChangeAccount) btnCancelChangeAccount.addEventListener('click', closeChangeAccountModal);
    if (changeAccountModal) changeAccountModal.querySelector('.modal-backdrop').addEventListener('click', closeChangeAccountModal);
    if (changeAccountForm) changeAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password-for-change').value;
        const newAccountNumber = document.getElementById('new-account-number').value;
        const confirmNewAccountNumber = document.getElementById('confirm-new-account-number').value;
        if(!currentPassword || !newAccountNumber || !confirmNewAccountNumber) {
            showNotification('Semua kolom wajib diisi.', 'error'); return;
        }
        if (newAccountNumber !== confirmNewAccountNumber) {
            showNotification('Konfirmasi nomor rekening tidak cocok.', 'error'); return;
        }
        try {
            await updateWithdrawalAccount(currentPassword, newAccountNumber);
            showNotification('Nomor rekening berhasil diubah.');
            closeChangeAccountModal();
            await loadStoreData(); 
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

async function initDeliverySection() {
    const form = document.getElementById('delivery-settings-form');
    if (!form) return;
    const courierContainer = document.getElementById('courier-list-container');
    const jasaPengirimanToggle = document.getElementById('toggle-jasa-pengiriman');
    const settings = await getSettings('delivery');
    
    form.querySelector('#toggle-ambil-ditempat').checked = settings.ambil_ditempat;
    form.querySelector('#toggle-pengiriman-toko').checked = settings.pengiriman_toko;
    jasaPengirimanToggle.checked = settings.jasa_pengiriman_aktif;

    const renderCourierList = () => {
        if (!courierContainer) return;
        courierContainer.innerHTML = '';
        settings.jasa_pengiriman_tersedia.forEach(courier => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-3 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" data-courier-id="${courier.id}" class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 courier-checkbox" ${courier.active ? 'checked' : ''}>
                <span class="font-medium text-gray-800">${courier.name}</span>
            `;
            courierContainer.appendChild(label);
        });
    };
    const toggleCourierListVisibility = () => {
        if (courierContainer) courierContainer.classList.toggle('hidden', !jasaPengirimanToggle.checked);
    };
    renderCourierList();
    toggleCourierListVisibility();
    jasaPengirimanToggle.addEventListener('change', toggleCourierListVisibility);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedCouriers = settings.jasa_pengiriman_tersedia.map(courier => ({...courier, active: courierContainer.querySelector(`input[data-courier-id="${courier.id}"]`).checked }));
        const data = {
            ambil_ditempat: form.querySelector('#toggle-ambil-ditempat').checked,
            pengiriman_toko: form.querySelector('#toggle-pengiriman-toko').checked,
            jasa_pengiriman_aktif: jasaPengirimanToggle.checked,
            jasa_pengiriman_tersedia: updatedCouriers
        };
        await saveSettings('delivery', data);
        showNotification('Pengaturan pengiriman berhasil disimpan.');
    });
}

function toggleDayInputs(day, isActive) {
    const openInput = document.getElementById(`open-${day}`);
    const closeInput = document.getElementById(`close-${day}`);
    if (openInput && closeInput) {
        openInput.disabled = !isActive;
        closeInput.disabled = !isActive;
        openInput.closest('.grid').parentElement.classList.toggle('opacity-50', !isActive);
    }
}

async function initScheduleSection() {
    const form = document.getElementById('schedule-settings-form');
    const container = document.getElementById('schedule-container');
    if (!form || !container) return;
    const { schedule } = await getSettings();
    container.innerHTML = '';
    const days = [
        { key: 'senin', name: 'Senin' }, { key: 'selasa', name: 'Selasa' },
        { key: 'rabu', name: 'Rabu' }, { key: 'kamis', name: 'Kamis' },
        { key: 'jumat', name: 'Jumat' }, { key: 'sabtu', name: 'Sabtu' },
        { key: 'minggu', name: 'Minggu' }
    ];
    days.forEach(dayInfo => {
        const daySchedule = schedule[dayInfo.key] || { active: false, open: '08:00', close: '19:00' };
        const row = document.createElement('div');
        row.className = 'grid grid-cols-3 md:grid-cols-4 items-center gap-4 py-3 border-b';
        row.innerHTML = `
            <label class="flex items-center space-x-3 cursor-pointer col-span-2 md:col-span-1">
                <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="${dayInfo.key}" id="toggle-${dayInfo.key}" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${daySchedule.active ? 'checked' : ''}/>
                    <label for="toggle-${dayInfo.key}" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
                <span class="font-semibold text-gray-700">${dayInfo.name}</span>
            </label>
            <div class="grid grid-cols-2 gap-2 col-span-2 md:col-span-3">
                <input type="time" id="open-${dayInfo.key}" value="${daySchedule.open}" class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100">
                <input type="time" id="close-${dayInfo.key}" value="${daySchedule.close}" class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100">
            </div>
        `;
        container.appendChild(row);
        toggleDayInputs(dayInfo.key, daySchedule.active);
    });
    container.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox' && e.target.id.startsWith('toggle-')) {
            const day = e.target.id.split('-')[1];
            toggleDayInputs(day, e.target.checked);
        }
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newSchedule = {};
        days.forEach(day => {
            newSchedule[day.key] = {
                active: document.getElementById(`toggle-${day.key}`).checked,
                open: document.getElementById(`open-${day.key}`).value,
                close: document.getElementById(`close-${day.key}`).value,
            };
        });
        await saveSettings('schedule', newSchedule);
        showNotification('Jadwal buka toko berhasil disimpan.');
    });
}

async function initSecuritySection() {
    const btnForgotPassword = document.getElementById('btn-forgot-password');
    const btnLogout = document.getElementById('btn-logout');
    if (btnForgotPassword) {
        btnForgotPassword.addEventListener('click', () => {
            showNotification('Fitur Lupa Password akan mengirimkan instruksi ke email terdaftar Anda.', 'info');
        });
    }
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            showConfirmationModal({
                message: 'Apakah Anda yakin ingin keluar dari akun ini?',
                callback: () => performLogout()
            });
        });
    }
}

// PERUBAHAN: Peta untuk menghubungkan nama seksi dengan fungsi inisialisasinya
const sectionInitializers = {
    profile: initProfileSection,
    store: initStoreSection,
    delivery: initDeliverySection,
    schedule: initScheduleSection,
    security: initSecuritySection
};

/**
 * Fungsi inisialisasi utama.
 */
export async function init(queryParams) {
    const settingsNav = document.getElementById('settings-nav');
    if (!settingsNav) return;

    try {
        const sectionToLoad = queryParams.get('section') || 'profile';
        await loadSection(sectionToLoad);
    } catch (error) {
        // PERUBAHAN: Lempar error jika seksi awal gagal dimuat
        console.error("Gagal memuat seksi pengaturan awal:", error);
        throw new Error('Gagal memuat halaman pengaturan.');
    }

    settingsNav.addEventListener('click', (e) => {
        e.preventDefault();
        const navItem = e.target.closest('.settings-nav-item');
        if (navItem && navItem.dataset.section) {
            const newSection = navItem.dataset.section;
            const currentSection = new URLSearchParams(window.location.hash.split('?')[1]).get('section') || 'profile';
            if (newSection !== currentSection) {
                 history.pushState(null, '', `#/pengaturan?section=${newSection}`);
                 loadSection(newSection);
            }
        }
    });
}
