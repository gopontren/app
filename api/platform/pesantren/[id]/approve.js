/**
 * POST /api/platform/pesantren/[id]/approve
 * Approve pesantren registration
 */

import { withAuth } from '../../../../lib/middleware/auth';
import { adminDb } from '../../../../lib/firebase/admin';
import { sendSuccess, sendError, asyncHandler } from '../../../../lib/utils/response';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  const { id } = req.query;

  try {
    const pesantrenRef = adminDb.collection('pesantren').doc(id);
    const pesantrenDoc = await pesantrenRef.get();

    if (!pesantrenDoc.exists) {
      return sendError(res, 'Pesantren tidak ditemukan', 404);
    }

    const pesantrenData = pesantrenDoc.data();

    // Calculate subscription until (1 year from now)
    const subscriptionUntil = new Date();
    subscriptionUntil.setFullYear(subscriptionUntil.getFullYear() + 1);

    // Update pesantren status
    await pesantrenRef.update({
      status: 'active',
      subscriptionUntil: subscriptionUntil,
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
        status: 'active',
        updatedAt: new Date(),
      });
    }

    return sendSuccess(res, {
      success: true,
      message: 'Pesantren berhasil disetujui',
    });
  } catch (error) {
    console.error('Approve pesantren error:', error);
    return sendError(res, 'Gagal menyetujui pesantren', 500);
  }
}

export default withAuth(asyncHandler(handler), { roles: ['platform_admin'] });
