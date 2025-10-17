/**
 * Mengelola fungsionalitas yang terkait dengan UI otentikasi,
 * seperti dropdown profil dan proses logout.
 */

// --- DROPDOWN PROFIL ---

export function initProfileDropdown() {
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (!profileButton || !profileDropdown) return;

    const toggleDropdown = () => {
        const isHidden = profileDropdown.classList.contains('hidden');
        if (isHidden) {
            profileDropdown.classList.remove('hidden');
            setTimeout(() => {
                profileDropdown.classList.remove('opacity-0', 'scale-95');
            }, 10);
        } else {
            profileDropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                profileDropdown.classList.add('hidden');
            }, 200);
        }
    };
    
    profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleDropdown();
    });

    window.addEventListener('click', () => {
        if (!profileDropdown.classList.contains('hidden')) {
            toggleDropdown();
        }
    });

    profileDropdown.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            // Biarkan event hashchange yang menutup dropdown
        }
    });

    window.addEventListener('hashchange', () => {
         if (!profileDropdown.classList.contains('hidden')) {
            toggleDropdown();
        }
    });
}


// --- FUNGSI LOGOUT ---

/**
 * Melakukan aksi final logout.
 * Dalam aplikasi nyata, ini akan memanggil API untuk menghapus token sesi 
 * dan kemudian mengarahkan pengguna ke halaman login.
 */
export function performLogout() {
    console.log("Melakukan logout...");
    
    // Di aplikasi nyata, Anda akan memanggil backend di sini, contoh:
    // await fetch('/api/logout', { method: 'POST' });

    // Hapus data sesi dari browser
    // localStorage.removeItem('authToken');
    
    // Me-reload halaman untuk kembali ke state awal (simulasi halaman login)
    window.location.reload();
}
