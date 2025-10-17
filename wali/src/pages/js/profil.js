import { getSession } from '/src/services/state.js';

/**
 * Mendapatkan inisial dari nama.
 * @param {string} name - Nama lengkap.
 * @returns {string} Inisial.
 */
function getInitials(name = '') {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

/**
 * Mengisi data pengguna ke dalam elemen-elemen UI.
 * @param {object} user - Objek pengguna dari sesi.
 */
function populateUserData(user) {
    document.getElementById('profil-avatar').textContent = getInitials(user.name);
    document.getElementById('profil-name-display').textContent = user.name;
    document.getElementById('nama').value = user.name;
    document.getElementById('email').value = user.email;
    // Nomor telepon bisa ditambahkan ke data mock jika perlu
}

/**
 * Menangani event submit form.
 */
function handleFormSubmit() {
    const form = document.getElementById('profil-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('nama').value;
        const newPhone = document.getElementById('telepon').value;

        console.log('Data baru:', { name: newName, phone: newPhone });
        alert('Profil berhasil diperbarui! (Simulasi)');
        
        // Update tampilan nama jika berubah
        document.getElementById('profil-name-display').textContent = newName;
        document.getElementById('profil-avatar').textContent = getInitials(newName);
    });
}

// Fungsi utama yang dipanggil oleh router
export default async function initProfil() {
    const session = getSession();
    if (!session) {
        document.getElementById('app-content').innerHTML = `<p class="p-8 text-center">Sesi tidak ditemukan.</p>`;
        return;
    }

    populateUserData(session.user);
    handleFormSubmit();
}
