/**
 * GET /api/platform/summary
 * Dashboard summary untuk Platform Admin
 */

import { withAuth } from '../../lib/middleware/auth';
import { adminDb } from '../../lib/firebase/admin';
import { sendSuccess, sendError, asyncHandler } from '../../lib/utils/response';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    // Hitung total pesantren
    const pesantrenSnapshot = await adminDb
      .collection('pesantren')
      .where('status', '==', 'active')
      .get();
    
    const totalPesantren = pesantrenSnapshot.size;

    // Hitung total santri dari semua pesantren
    let totalSantri = 0;
    for (const pesantrenDoc of pesantrenSnapshot.docs) {
      const santriSnapshot = await adminDb
        .collection('pesantren')
        .doc(pesantrenDoc.id)
        .collection('santri')
        .get();
      totalSantri += santriSnapshot.size;
    }

    // Hitung total transaksi bulan ini (placeholder - implement sesuai logic bisnis)
    const totalTransaksiBulanan = 0; // TODO: Calculate from transactions

    // Hitung pendapatan platform bulan ini (placeholder)
    const pendapatanPlatform = 0; // TODO: Calculate from monetization settings

    return sendSuccess(res, {
      totalPesantren,
      totalSantri,
      totalTransaksiBulanan,
      pendapatanPlatform,
    });
  } catch (error) {
    console.error('Platform summary error:', error);
    return sendError(res, 'Gagal mengambil data summary', 500);
  }
}

// Protect route - only platform_admin can access
export default withAuth(asyncHandler(handler), { roles: ['platform_admin'] });
