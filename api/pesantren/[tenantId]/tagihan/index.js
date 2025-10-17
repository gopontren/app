/**
 * GET /api/pesantren/[tenantId]/tagihan
 * POST /api/pesantren/[tenantId]/tagihan
 * Get list tagihan atau buat tagihan baru
 */

import { withAuth, belongsToTenant } from '../../../../lib/middleware/auth';
import { adminDb } from '../../../../lib/firebase/admin';
import { sendPaginated, sendSuccess, sendError, asyncHandler } from '../../../../lib/utils/response';
import { validateRequired } from '../../../../lib/utils/validation';

async function handler(req, res) {
  const { tenantId } = req.query;

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
  } = req.query;

  try {
    const snapshot = await adminDb
      .collection('pesantren')
      .doc(tenantId)
      .collection('tagihan')
      .get();

    let tagihanList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Search filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      tagihanList = tagihanList.filter(t =>
        t.title.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort by due date
    tagihanList.sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateB - dateA;
    });

    // Pagination
    const totalItems = tagihanList.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = tagihanList.slice(startIndex, startIndex + parseInt(limit));

    return sendPaginated(res, paginatedData, {
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error('Get tagihan error:', error);
    return sendError(res, 'Gagal mengambil data tagihan', 500);
  }
}

async function handlePost(req, res, tenantId) {
  const { title, amount, dueDate, mandatory, targets } = req.body;

  // Validation
  const validation = validateRequired(['title', 'amount', 'dueDate'], req.body);
  if (!validation.valid) {
    return sendError(res, `Missing fields: ${validation.missing.join(', ')}`);
  }

  try {
    // Get total santri if targets not specified
    let totalTargets = 0;
    if (targets && targets.length > 0) {
      totalTargets = targets.length;
    } else {
      const santriSnapshot = await adminDb
        .collection('pesantren')
        .doc(tenantId)
        .collection('santri')
        .get();
      totalTargets = santriSnapshot.size;
    }

    // Create tagihan
    const tagihanRef = adminDb
      .collection('pesantren')
      .doc(tenantId)
      .collection('tagihan')
      .doc();

    const tagihanData = {
      title,
      amount: parseFloat(amount),
      dueDate,
      mandatory: mandatory !== false,
      targets: targets || [],
      totalTargets,
      paidCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await tagihanRef.set(tagihanData);

    return sendSuccess(res, {
      id: tagihanRef.id,
      ...tagihanData,
    }, 201);
  } catch (error) {
    console.error('Create tagihan error:', error);
    return sendError(res, 'Gagal membuat tagihan', 500);
  }
}

export default withAuth(asyncHandler(handler), { roles: ['platform_admin', 'pesantren_admin'] });
