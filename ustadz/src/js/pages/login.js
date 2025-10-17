/**
 * src/js/pages/login.js
 * File ini berfungsi untuk menginisialisasi layar Login.
 * Logika klik pada tombol login ditangani secara global di main.js.
 * Fungsi ini hanya memastikan ikon-ikon di layar ini di-render dengan benar.
 */

import { createIcons } from '../ui.js';

export function initLogin() {
  // Panggil createIcons untuk me-render ikon lucide di halaman login
  // (contohnya, ikon 'shield-check').
  createIcons();
}
