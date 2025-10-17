/**
 * GET /api/pesantren/[tenantId]/santri
 * POST /api/pesantren/[tenantId]/santri
 * Get list santri atau tambah santri baru
 */

import { withAuth, belongsToTenant } from '../../../../lib/middleware/auth';
import { adminDb } from '../../../../lib/firebase/admin';
import { sendPaginated, sendSuccess, sendError, asyncHandler } from '../../../../lib/utils/response';
import { validateRequired } from '../../../../lib/utils/validation';

async function handler(req, res) {
  const { tenantId } = req.query;

  // Check tenant access
  if (!belongsToTenant(req.user, tenantId)) {
    return sendError(res, 'Akses ditolak', 403);
  }

  if (req.method === 'GET') {
    return await handleGet(req, res, tenantId);
  } else if (req.method === 'POST') {
    return await handlePost(req, res, tenantId);
  } else {
    return sendError(res, 'Method not allowed', 405);
  }
}

async function handleGet(req, res, tenantId) {
  const {
    page = 1,
    limit = 10,
    query = '',
    status = 'all',
  } = req.query;

  try {
    let santriQuery = adminDb
      .collection('pesantren')
      .doc(tenantId)
      .collection('santri');

    // Filter by status
    if (status && status !== 'all') {
      santriQuery = santriQuery.where('status', '==', status);
    }

    const snapshot = await santriQuery.get();

    let santriList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Search filter (name or NIS)
    if (query) {
      const lowerQuery = query.toLowerCase();
      santriList = santriList.filter(s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.nis?.toLowerCase().includes(lowerQuery)
      );
    }

    // Pagination
    const totalItems = santriList.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = santriList.slice(startIndex, startIndex + parseInt(limit));

    return sendPaginated(res, paginatedData, {
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error('Get santri error:', error);
    return sendError(res, 'Gagal mengambil data santri', 500);
  }
}

async function handlePost(req, res, tenantId) {
  const { name, nis, classId } = req.body;

  // Validation
  const validation = validateRequired(['name', 'nis', 'classId'], req.body);
  if (!validation.valid) {
    return sendError(res, `Missing fields: ${validation.missing.join(', ')}`);
  }

  try {
    // Check NIS uniqueness
    const existingSantri = await adminDb
      .collection('pesantren')
      .doc(tenantId)
      .collection('santri')
      .where('nis', '==', nis)
      .limit(1)
      .get();

    if (!existingSantri.empty) {
      return sendError(res, 'NIS sudah terdaftar');
    }

    // Create santri
    const santriRef = adminDb
      .collection('pesantren')
      .doc(tenantId)
      .collection('santri')
      .doc();

    const santriData = {
      name,
      nis,
      classId,
      balance: 0,
      status: 'active',
      permitInfo: null,
      transactionPin: 'hashed_123456', // Default PIN, should be changed
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await santriRef.set(santriData);

    // Update pesantren santriCount
    const pesantrenRef = adminDb.collection('pesantren').doc(tenantId);
    await pesantrenRef.update({
      santriCount: adminDb.FieldValue.increment(1),
    });

    return sendSuccess(res, {
      id: santriRef.id,
      ...santriData,
    }, 201);
  } catch (error) {
    console.error('Add santri error:', error);
    return sendError(res, 'Gagal menambahkan santri', 500);
  }
}

export default withAuth(asyncHandler(handler), { roles: ['platform_admin', 'pesantren_admin'] });
