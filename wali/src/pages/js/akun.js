import { getSession, clearSession } from '/src/services/state.js';

/**
 * Mendapatkan inisial dari nama. Contoh: "Bunda Aisyah" -> "BA"
 * @param {string} name - Nama lengkap.
 * @returns {string} Inisial nama.
 */
function getInitials(name) {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
}

// Fungsi utama yang dipanggil oleh router
export default async function initAkun() {
    const session = getSession();
    if (!session) {
        // Jika tidak ada sesi, idealnya arahkan ke halaman login
        document.getElementById('app-content').innerHTML = `<p class="p-8 text-center">Sesi tidak ditemukan. Silakan login kembali.</p>`;
        return;
    }

    const { user } = session;

    // Isi data pengguna ke elemen HTML
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-avatar').textContent = getInitials(user.name);

    // Menambahkan fungsi pada tombol logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Hapus data sesi dari localStorage
            clearSession();
            
            // Arahkan pengguna kembali ke halaman utama
            // Reload halaman untuk membersihkan semua state
            window.location.hash = '#home';
            window.location.reload(); 
        });
    }
}
