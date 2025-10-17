/**
 * POST /api/auth/register-pesantren
 * Endpoint untuk registrasi pesantren baru
 */

import { adminDb } from '../../lib/firebase/admin';
import { sendSuccess, sendError, asyncHandler } from '../../lib/utils/response';
import { validateEmail, validateRequired, validatePhoneNumber } from '../../lib/utils/validation';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  const {
    pesantrenName,
    address,
    phone,
    santriCount,
    ustadzCount,
    adminName,
    adminEmail,
    logo,
  } = req.body;

  // Validation
  const validation = validateRequired(
    ['pesantrenName', 'address', 'phone', 'adminName', 'adminEmail'],
    req.body
  );
  
  if (!validation.valid) {
    return sendError(res, `Missing fields: ${validation.missing.join(', ')}`);
  }

  if (!validateEmail(adminEmail)) {
    return sendError(res, 'Format email admin tidak valid');
  }

  if (!validatePhoneNumber(phone)) {
    return sendError(res, 'Format nomor telepon tidak valid');
  }

  try {
    // Check if email already exists
    const existingUser = await adminDb
      .collection('users')
      .where('email', '==', adminEmail)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return sendError(res, 'Email admin sudah terdaftar');
    }

    // Create pesantren document
    const pesantrenRef = adminDb.collection('pesantren').doc();
    const pesantrenData = {
      name: pesantrenName,
      address,
      contact: phone,
      logoUrl: logo || '',
      documentUrl: '', // Will be uploaded separately
      santriCount: parseInt(santriCount) || 0,
      ustadzCount: parseInt(ustadzCount) || 0,
      status: 'pending',
      subscriptionUntil: null,
      admin: {
        name: adminName,
        email: adminEmail,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await pesantrenRef.set(pesantrenData);

    // Create admin user
    const userRef = adminDb.collection('users').doc();
    const userData = {
      name: adminName,
      email: adminEmail,
      role: 'pesantren_admin',
      tenantId: pesantrenRef.id,
      pesantrenName,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await userRef.set(userData);

    return sendSuccess(res, {
      success: true,
      message: 'Pendaftaran berhasil, menunggu verifikasi.',
      pesantrenId: pesantrenRef.id,
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, 'Terjadi kesalahan saat mendaftar', 500);
  }
}

export default asyncHandler(handler);
