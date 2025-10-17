/**
 * POST /api/platform/pesantren/[id]/reject
 * Reject pesantren registration
 */

import { withAuth } from '../../../../lib/middleware/auth';
import { adminDb } from '../../../../lib/firebase/admin';
import { sendSuccess, sendError, asyncHandler } from '../../../../lib/utils/response';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  const { id } = req.query;
  const { reason } = req.body;

  if (!reason) {
    return sendError(res, 'Alasan penolakan wajib diisi');
  }

  try {
    const pesantrenRef = adminDb.collection('pesantren').doc(id);
    const pesantrenDoc = await pesantrenRef.get();

    if (!pesantrenDoc.exists) {
      return sendError(res, 'Pesantren tidak ditemukan', 404);
    }

    const pesantrenData = pesantrenDoc.data();

    // Update pesantren status
    await pesantrenRef.update({
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date(),
    });

    // Update admin user status
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', pesantrenData.admin.email)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        status: 'rejected',
        updatedAt: new Date(),
      });
    }

    return sendSuccess(res, {
      success: true,
      message: 'Pesantren berhasil ditolak',
    });
  } catch (error) {
    console.error('Reject pesantren error:', error);
    return sendError(res, 'Gagal menolak pesantren', 500);
  }
}

export default withAuth(asyncHandler(handler), { roles: ['platform_admin'] });
