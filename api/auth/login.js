/**
 * POST /api/auth/login
 * Login endpoint untuk semua roles
 */

import { adminDb } from '../../lib/firebase/admin';
import { sendSuccess, sendError, asyncHandler } from '../../lib/utils/response';
import { validateEmail, validateRequired } from '../../lib/utils/validation';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  const { email, password } = req.body;

  // Validation
  const validation = validateRequired(['email', 'password'], req.body);
  if (!validation.valid) {
    return sendError(res, `Missing fields: ${validation.missing.join(', ')}`);
  }

  if (!validateEmail(email)) {
    return sendError(res, 'Invalid email format');
  }

  try {
    // Query user by email
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return sendError(res, 'Email atau kata sandi salah', 401);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check password (dalam implementasi real, gunakan bcrypt)
    // Untuk sekarang, kita simulasikan dengan password default '123456'
    if (password !== '123456') {
      return sendError(res, 'Email atau kata sandi salah', 401);
    }

    // Check status untuk pesantren admin
    if (userData.role === 'pesantren_admin' && userData.status === 'pending') {
      return sendError(res, 'Akun Anda sedang menunggu verifikasi oleh Admin Platform', 403);
    }

    if (userData.role === 'pesantren_admin' && userData.status === 'rejected') {
      return sendError(res, 'Akun Anda ditolak. Silakan hubungi Admin Platform', 403);
    }

    // Create custom token menggunakan Firebase Admin
    const { adminAuth } = await import('../../lib/firebase/admin');
    const customToken = await adminAuth.createCustomToken(userDoc.id, {
      role: userData.role,
      tenantId: userData.tenantId || null,
    });

    // Return user data dan token
    return sendSuccess(res, {
      token: customToken,
      user: {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        tenantId: userData.tenantId || null,
        pesantrenName: userData.pesantrenName || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Terjadi kesalahan saat login', 500);
  }
}

export default asyncHandler(handler);
