/**
 * src/js/pages/editor.js
 * File ini mengelola layar editor generik.
 * Fungsinya adalah menerima parameter dari router dan menggunakannya
 * untuk mengisi judul dan placeholder secara dinamis.
 */

import { createIcons } from '../ui.js';

export function initEditor(params) {
  // params adalah objek yang dikirim dari router, cth: { title: "Buat Artikel Baru", type: "Artikel" }
  
  // Menggunakan ID untuk selector yang lebih spesifik dan andal
  const titleEl = document.getElementById('editor-title');
  const inputEl = document.getElementById('editor-input-title');
  const textareaEl = document.getElementById('editor-textarea-content');

  // Memeriksa apakah params ada sebelum mengakses propertinya
  if (params) {
    if (titleEl && params.title) {
      titleEl.textContent = params.title;
    }
    if (inputEl && params.type) {
      inputEl.placeholder = `Judul ${params.type}`;
    }
  }

  if (textareaEl) {
    textareaEl.placeholder = 'Tulis konten di sini...';
  }

  // Render semua ikon di halaman
  createIcons();
}
