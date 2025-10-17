/**
 * src/js/pages/pengambilanPaket.js
 * [FILE BARU]
 * Mengelola logika untuk halaman pengambilan paket, termasuk memuat,
 * menampilkan, dan memperbarui status tugas.
 */

import { getPickupTasks, updatePickupTaskStatus } from '../api.js';
import { createIcons } from '../ui.js';
import { appState } from '../app.js';
import { showToast } from '../ui.js';

// --- Fungsi Rendering ---

function renderTasks(tasks) {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16">
                <i data-lucide="package-check" class="h-16 w-16 mx-auto text-slate-400"></i>
                <h3 class="mt-4 text-lg font-semibold text-slate-700">Tidak Ada Tugas</h3>
                <p class="text-slate-500 mt-1">Semua paket sudah terkelola dengan baik.</p>
            </div>
        `;
        createIcons();
        return;
    }

    const taskItems = tasks.map(task => {
        const isPending = task.status === 'pending_pickup';
        const isInDelivery = task.status === 'in_delivery';

        return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-slate-800">${task.santriName}</p>
                        <p class="text-xs text-slate-500">${task.orderId} • ${task.storeName}</p>
                    </div>
                    <span class="text-sm font-semibold ${isPending ? 'text-amber-600' : 'text-teal-600'}">
                        ${isPending ? 'Siap Diambil' : 'Dalam Pengantaran'}
                    </span>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                    ${isPending ? `
                        <button data-action="update-task-status" data-task-id="${task.id}" data-new-status="in_delivery" class="flex-1 bg-teal-600 text-white py-2.5 rounded-lg font-semibold text-sm">
                            Konfirmasi Pengambilan
                        </button>
                    ` : ''}
                     ${isInDelivery ? `
                        <button data-action="update-task-status" data-task-id="${task.id}" data-new-status="completed" class="flex-1 bg-sky-600 text-white py-2.5 rounded-lg font-semibold text-sm">
                            Selesaikan Tugas
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="space-y-4">${taskItems}</div>`;
}

async function loadTasks() {
    try {
        if (!appState.currentUser || !appState.currentUser.id) {
            throw new Error("Data ustadz tidak ditemukan.");
        }
        const tasks = await getPickupTasks(appState.currentUser.id);
        renderTasks(tasks);
    } catch (error) {
        console.error("Gagal memuat tugas:", error);
        const container = document.getElementById('tasks-list-container');
        if(container) container.innerHTML = `<p class="text-center text-red-500">Gagal memuat data tugas.</p>`;
    } finally {
        createIcons();
    }
}


// --- Fungsi Inisialisasi dan Event Handling ---

export function initPengambilanPaket() {
    loadTasks();

    const container = document.getElementById('tasks-list-container');
    if (container) {
        container.addEventListener('click', async (event) => {
            const target = event.target.closest('[data-action="update-task-status"]');
            if (!target) return;

            target.disabled = true;
            target.textContent = 'Memproses...';

            const { taskId, newStatus } = target.dataset;

            try {
                await updatePickupTaskStatus(taskId, newStatus);
                showToast('Status berhasil diperbarui!', 'success');
                // Muat ulang daftar tugas untuk menampilkan perubahan
                await loadTasks(); 
            } catch (error) {
                console.error('Gagal memperbarui status tugas:', error);
                showToast('Gagal memperbarui status.', 'error');
                target.disabled = false;
                // Kembalikan teks tombol jika gagal
                if (newStatus === 'in_delivery') target.textContent = 'Konfirmasi Pengambilan';
                if (newStatus === 'completed') target.textContent = 'Selesaikan Tugas';
            }
        });
    }
}
