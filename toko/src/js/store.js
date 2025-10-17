import * as api from './api.js';

// The single source of truth for our application data.
const state = {
    products: [],
    categories: [],
    suppliers: [],
    isInitialized: false
};

/**
 * Fetches all initial data from the API and populates the state.
 * This should be called once when the application starts.
 */
export async function initStore() {
    if (state.isInitialized) return;
    
    try {
        // Fetch all core data in parallel for faster loading
        const [products, categories, suppliers] = await Promise.all([
            api.getProducts(),
            api.getCategories(),
            api.getSuppliers()
        ]);
        
        state.products = products;
        state.categories = categories;
        state.suppliers = suppliers;
        state.isInitialized = true;
        
        console.log("Store initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize data store:", error);
        // In a real app, you might want to show an error message to the user
    }
}

// --- Getters: Functions to access the state from other parts of the app ---

export const getProducts = () => state.products;
export const getCategories = () => state.categories;
export const getSuppliers = () => state.suppliers;
export const getProductById = (id) => state.products.find(p => p.id == id);
export const getCategoryById = (id) => state.categories.find(c => c.id == id);
export const getSupplierById = (id) => state.suppliers.find(s => s.id == id);

// --- Setters/Updaters: Functions to modify the state after an API call ---
// This ensures our local data is always in sync with the (mock) backend.

export const setProducts = (newProducts) => {
    state.products = newProducts;
};

export const setCategories = (newCategories) => {
    state.categories = newCategories;
};

export const setSuppliers = (newSuppliers) => {
    state.suppliers = newSuppliers;
};

export const updateProductInStore = (updatedProduct) => {
    const index = state.products.findIndex(p => p.id == updatedProduct.id);
    if (index > -1) {
        // Update existing product
        state.products[index] = updatedProduct;
    } else {
        // Add new product
        state.products.push(updatedProduct);
    }
};

export const removeProductFromStore = (productId) => {
    state.products = state.products.filter(p => p.id != productId);
};

export const updateCategoryInStore = (updatedCategory) => {
    const index = state.categories.findIndex(c => c.id == updatedCategory.id);
    if (index > -1) {
        state.categories[index] = updatedCategory;
    } else {
        state.categories.push(updatedCategory);
    }
};

export const removeCategoryFromStore = (categoryId) => {
    state.categories = state.categories.filter(c => c.id != categoryId);
};

export const updateSupplierInStore = (updatedSupplier) => {
    const index = state.suppliers.findIndex(s => s.id == updatedSupplier.id);
    if (index > -1) {
        state.suppliers[index] = updatedSupplier;
    } else {
        state.suppliers.push(updatedSupplier);
    }
};

export const removeSupplierFromStore = (supplierId) => {
    state.suppliers = state.suppliers.filter(s => s.id != supplierId);
};
