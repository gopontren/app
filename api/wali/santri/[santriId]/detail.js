/**
 * GET /api/wali/santri/[santriId]/detail
 * Get detail santri untuk wali (keuangan, saldo, tagihan)
 */

import { withAuth } from '../../../../lib/middleware/auth';
import { adminDb } from '../../../../lib/firebase/admin';
import { sendSuccess, sendError, asyncHandler } from '../../../../lib/utils/response';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  const { santriId } = req.query;

  // TODO: Verify wali has access to this santri
  // For now, check if user is wali_santri role

  if (req.user.role !== 'wali_santri') {
    return sendError(res, 'Akses ditolak', 403);
  }

  try {
    // Get santri data dari semua pesantren (inefficient, better to know tenantId)
    // In production, santriId should include tenantId or we should store wali-santri relation
    const pesantrenSnapshot = await adminDb.collection('pesantren').get();
    
    let santriData = null;
    let tenantId = null;

    for (const pesantrenDoc of pesantrenSnapshot.docs) {
      const santriDoc = await pesantrenDoc.ref
        .collection('santri')
        .doc(santriId)
        .get();
      
      if (santriDoc.exists) {
        santriData = { id: santriDoc.id, ...santriDoc.data() };
        tenantId = pesantrenDoc.id;
        break;
      }
    }

    if (!santriData) {
      return sendError(res, 'Santri tidak ditemukan', 404);
    }

    // Get tagihan for this santri
    const tagihanSnapshot = await adminDb
      .collection('pesantren')
      .doc(tenantId)
      .collection('tagihan')
      .get();

    const tagihan = tagihanSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: 'unpaid', // TODO: Check payment status
    }));

    // Get activity log (simplified)
    const activityLog = []; // TODO: Implement activity tracking

    return sendSuccess(res, {
      santri: santriData,
      keuangan: {
        tagihan,
      },
      goKop: {
        saldo: santriData.balance || 0,
      },
      activityLog,
    });
  } catch (error) {
    console.error('Get santri detail error:', error);
    return sendError(res, 'Gagal mengambil detail santri', 500);
  }
}

export default withAuth(asyncHandler(handler), { roles: ['wali_santri'] });
