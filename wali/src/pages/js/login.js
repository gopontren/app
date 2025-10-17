import { login } from '/src/services/api.js';
import { saveSession } from '/src/services/state.js';

// Fungsi utama yang dipanggil oleh router
export default async function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Tampilkan status loading
        submitButton.disabled = true;
        submitButton.textContent = 'Memproses...';

        try {
            const response = await login(email, password);

            if (response.status === 'success' && response.data) {
                // Simpan data sesi ke localStorage
                saveSession(response.data);
                
                // Arahkan ke halaman utama dan reload untuk memulai sesi baru
                window.location.hash = '#home';
                window.location.reload();
            } else {
                alert('Login gagal. Periksa kembali email dan kata sandi Anda.');
            }
        } catch (error) {
            console.error("Error saat login:", error);
            alert('Terjadi kesalahan saat mencoba login.');
        } finally {
            // Kembalikan tombol ke keadaan semula
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}
