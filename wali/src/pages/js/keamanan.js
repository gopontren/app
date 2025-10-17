/**
 * Menangani logika submit form ubah kata sandi.
 */
function handleChangePassword() {
    const form = document.getElementById('keamanan-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const oldPass = document.getElementById('pass-lama').value;
        const newPass = document.getElementById('pass-baru').value;
        const confirmPass = document.getElementById('konfirmasi-pass').value;

        // Validasi sederhana
        if (!oldPass || !newPass || !confirmPass) {
            alert('Semua kolom wajib diisi.');
            return;
        }

        if (newPass !== confirmPass) {
            alert('Konfirmasi kata sandi baru tidak cocok.');
            return;
        }

        // Di aplikasi nyata, di sini akan ada panggilan API
        console.log(`Mengubah kata sandi dari ${oldPass} menjadi ${newPass}`);
        alert('Kata sandi berhasil diubah! (Simulasi)');
        form.reset(); // Kosongkan form setelah berhasil
    });
}

/**
 * Menangani logika klik tombol hapus akun.
 */
function handleDeleteAccount() {
    const deleteButton = document.getElementById('hapus-akun-btn');
    if (!deleteButton) return;

    deleteButton.addEventListener('click', () => {
        const isConfirmed = confirm('Apakah Anda benar-benar yakin ingin menghapus akun Anda? Tindakan ini tidak dapat dibatalkan.');
        
        if (isConfirmed) {
            // Di aplikasi nyata, panggil API untuk hapus akun, lalu panggil clearSession()
            console.log('Akun dihapus.');
            alert('Akun Anda telah berhasil dihapus. (Simulasi)');
            // Arahkan ke halaman utama seolah-olah sudah logout
            window.location.hash = '#home';
            window.location.reload();
        }
    });
}


// Fungsi utama yang dipanggil oleh router
export default async function initKeamanan() {
    handleChangePassword();
    handleDeleteAccount();
}
