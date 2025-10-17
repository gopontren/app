/**
 * GET /api/toko/[koperasiId]/products
 * POST /api/toko/[koperasiId]/products
 * Get list produk atau tambah produk baru
 */

import { withAuth } from '../../../../lib/middleware/auth';
import { adminDb } from '../../../../lib/firebase/admin';
import { sendSuccess, sendError, asyncHandler } from '../../../../lib/utils/response';
import { validateRequired } from '../../../../lib/utils/validation';

async function handler(req, res) {
  const { koperasiId } = req.query;

  // TODO: Verify user has access to this koperasi
  // For now, allow koperasi_admin and pesantren_admin

  if (req.method === 'GET') {
    return await handleGet(req, res, koperasiId);
  } else if (req.method === 'POST') {
    return await handlePost(req, res, koperasiId);
  } else {
    return sendError(res, 'Method not allowed', 405);
  }
}

async function handleGet(req, res, koperasiId) {
  try {
    const snapshot = await adminDb
      .collection('koperasi')
      .doc(koperasiId)
      .collection('products')
      .get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return sendSuccess(res, products);
  } catch (error) {
    console.error('Get products error:', error);
    return sendError(res, 'Gagal mengambil data produk', 500);
  }
}

async function handlePost(req, res, koperasiId) {
  const { name, sku, barcode, price, costPrice, stock, categoryId, image } = req.body;

  // Validation
  const validation = validateRequired(['name', 'price', 'stock'], req.body);
  if (!validation.valid) {
    return sendError(res, `Missing fields: ${validation.missing.join(', ')}`);
  }

  try {
    const productRef = adminDb
      .collection('koperasi')
      .doc(koperasiId)
      .collection('products')
      .doc();

    const productData = {
      name,
      sku: sku || '',
      barcode: barcode || '',
      price: parseFloat(price),
      costPrice: parseFloat(costPrice) || 0,
      stock: parseInt(stock),
      categoryId: categoryId || null,
      image: image || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await productRef.set(productData);

    return sendSuccess(res, {
      id: productRef.id,
      ...productData,
    }, 201);
  } catch (error) {
    console.error('Add product error:', error);
    return sendError(res, 'Gagal menambahkan produk', 500);
  }
}

export default withAuth(asyncHandler(handler), { roles: ['koperasi_admin', 'pesantren_admin'] });
