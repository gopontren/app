/**
 * GET /api/platform/pesantren
 * List semua pesantren dengan pagination dan filter
 */

import { withAuth } from '../../../lib/middleware/auth';
import { adminDb } from '../../../lib/firebase/admin';
import { sendPaginated, sendError, asyncHandler } from '../../../lib/utils/response';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  const {
    page = 1,
    limit = 10,
    query = '',
    status = 'all',
  } = req.query;

  try {
    let pesantrenQuery = adminDb.collection('pesantren');

    // Filter by status
    if (status && status !== 'all') {
      pesantrenQuery = pesantrenQuery.where('status', '==', status);
    }

    // Get all documents (filtering by name will be done client-side due to Firestore limitations)
    const snapshot = await pesantrenQuery.get();

    let pesantrenList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by search query (nama atau id)
    if (query) {
      const lowerQuery = query.toLowerCase();
      pesantrenList = pesantrenList.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.id.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort by createdAt descending
    pesantrenList.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });

    // Pagination
    const totalItems = pesantrenList.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = pesantrenList.slice(startIndex, startIndex + parseInt(limit));

    return sendPaginated(res, paginatedData, {
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error('Get pesantren list error:', error);
    return sendError(res, 'Gagal mengambil data pesantren', 500);
  }
}

export default withAuth(asyncHandler(handler), { roles: ['platform_admin'] });
