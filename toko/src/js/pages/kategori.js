import { saveCategory, deleteCategory } from '../api.js';
import { getCategories, getCategoryById } from '../store.js';
import { showNotification, showConfirmationModal } from '../ui.js';

// --- ELEMENT SELECTORS ---
const categoryModalEl = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');
const categoryModalTitle = document.getElementById('category-modal-title');
const categoryIdInput = document.getElementById('category-id');
const categoryNameInput = document.getElementById('category-name');

// --- RENDER FUNCTIONS ---
const renderCategories = () => {
    const categories = getCategories();
    const tbody = document.getElementById('category-list');
    tbody.innerHTML = '';

    if (categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-500">Belum ada kategori.</td></tr>`;
        return;
    }

    categories.forEach(category => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-4 font-semibold">${category.name}</td>
            <td class="p-4 space-x-2">
                <button data-category-id="${category.id}" class="edit-category-btn text-blue-600 hover:underline">Edit</button>
                <button data-category-id="${category.id}" class="delete-category-btn text-red-600 hover:underline">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('.edit-category-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
    tbody.querySelectorAll('.delete-category-btn').forEach(btn => btn.addEventListener('click', handleDeleteClick));
};

// --- MODAL LOGIC ---
const openCategoryModal = (title = 'Tambah Kategori Baru', category = {}) => {
    categoryModalTitle.textContent = title;
    categoryIdInput.value = category.id || '';
    categoryNameInput.value = category.name || '';
    categoryModalEl.classList.replace('hidden', 'flex');
    setTimeout(() => {
        categoryModalEl.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
    }, 10);
};

const closeCategoryModal = () => {
    categoryModalEl.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        categoryModalEl.classList.replace('flex', 'hidden');
    }, 300);
};

// --- EVENT HANDLERS ---
const handleAddClick = () => {
    openCategoryModal();
};

const handleEditClick = (e) => {
    const categoryId = e.target.dataset.categoryId;
    const category = getCategoryById(categoryId);
    if (category) {
        openCategoryModal('Edit Kategori', category);
    }
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const categoryData = {
        id: categoryIdInput.value,
        name: categoryNameInput.value,
    };

    try {
        await saveCategory(categoryData);
        showNotification('Kategori berhasil disimpan.');
        closeCategoryModal();
        renderCategories();
    } catch (error) {
        showNotification('Gagal menyimpan kategori.', 'error');
        console.error("Save category error:", error);
    }
};

const handleDeleteClick = async (e) => {
    const categoryId = e.target.dataset.categoryId;
    const category = getCategoryById(categoryId);
    if (!category) return;

    showConfirmationModal(
        `Apakah Anda yakin ingin menghapus kategori <strong>"${category.name}"</strong>?`,
        async () => {
            try {
                await deleteCategory(categoryId);
                showNotification('Kategori berhasil dihapus.');
                renderCategories();
            } catch (error) {
                showNotification('Gagal menghapus kategori.', 'error');
                console.error("Delete category error:", error);
            }
        }
    );
};


// --- INITIALIZATION ---
export function init() {
    // PERUBAHAN: Blok try-catch dihapus, biarkan error ditangkap oleh router
    renderCategories();

    document.getElementById('btn-add-category').addEventListener('click', handleAddClick);
    categoryForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancel-category').addEventListener('click', closeCategoryModal);
    categoryModalEl.querySelector('.modal-backdrop').addEventListener('click', closeCategoryModal);
}
