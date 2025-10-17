/**
 * Mengelola fungsionalitas navigasi, terutama untuk tampilan mobile.
 */

// --- ELEMENT SELECTORS ---
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const overlay = document.getElementById('mobile-menu-overlay');
const mobilePageTitle = document.getElementById('mobile-page-title');
const sidebarNav = document.getElementById('sidebar-nav');
// PERUBAHAN: Memastikan elemen ini ditargetkan
const mobileHeaderIcon = document.getElementById('mobile-header-icon');

/**
 * Membuka atau menutup sidebar pada tampilan mobile
 * dengan menukar kelas utilitas Tailwind.
 */
const toggleMobileMenu = () => {
    const isHidden = sidebar.classList.contains('-translate-x-full');
    if (isHidden) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
    }
    overlay.classList.toggle('hidden');
};

/**
 * Menutup sidebar mobile (jika sedang terbuka).
 */
const closeMobileMenu = () => {
    if (sidebar.classList.contains('translate-x-0')) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
};

/**
 * [UPDATED] Memperbarui judul DAN IKON di header mobile.
 * @param {HTMLElement} activeLink - Elemen <a> dari link sidebar yang aktif.
 */
export const updateMobileHeader = (activeLink) => {
    if (!activeLink) return;

    // 1. Update Ikon
    const iconSvg = activeLink.querySelector('svg');
    if (mobileHeaderIcon && iconSvg) {
        // Baris ini menyalin SVG dari sidebar ke header mobile
        mobileHeaderIcon.innerHTML = iconSvg.outerHTML;
    }

    // 2. Update Teks Judul
    if (mobilePageTitle) {
        const title = activeLink.cloneNode(true);
        // Hapus elemen lain (ikon, badge notif) agar hanya teks judul yang tersisa
        title.querySelectorAll('svg, span').forEach(el => el.remove());
        mobilePageTitle.textContent = title.textContent.trim();
    }
};

/**
 * Inisialisasi semua event listener yang berhubungan dengan navigasi.
 */
export function initNavigation() {
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleMobileMenu);
    }
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (e) => {
            // Jika elemen yang diklik adalah link, tutup menu
            if (e.target.closest('a')) {
                closeMobileMenu();
            }
        });
    }
}
