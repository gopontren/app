/**
 * Authentication Middleware
 * Verify JWT token and user permissions
 */

import { adminAuth } from '../firebase/admin';

/**
 * Verify Firebase ID token from request header
 */
export async function verifyAuth(req) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return decodedToken;
  } catch (error) {
    console.error('Auth verification error:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user, allowedRoles) {
  if (!user || !user.role) {
    return false;
  }
  
  return allowedRoles.includes(user.role);
}

/**
 * Check if user belongs to tenant
 */
export function belongsToTenant(user, tenantId) {
  if (!user || !tenantId) {
    return false;
  }
  
  // Platform admin can access all tenants
  if (user.role === 'platform_admin') {
    return true;
  }
  
  return user.tenantId === tenantId;
}

/**
 * Middleware wrapper untuk API routes
 */
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    try {
      // Verify token
      const decodedToken = await verifyAuth(req);
      
      // Get user data from Firestore
      const { adminDb } = await import('../firebase/admin');
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
      
      const user = { id: userDoc.id, ...userDoc.data() };
      
      // Check role if specified
      if (options.roles && !hasRole(user, options.roles)) {
        return res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
      }
      
      // Attach user to request
      req.user = user;
      
      // Call original handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
  };
}
