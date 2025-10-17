/**
 * Standardized API Response Utilities
 */

export function successResponse(data, message = null) {
  return {
    status: 'success',
    data,
    ...(message && { message }),
  };
}

export function errorResponse(message, code = null) {
  return {
    status: 'error',
    message,
    ...(code && { code }),
  };
}

export function paginatedResponse(data, pagination) {
  return {
    status: 'success',
    data,
    pagination: {
      currentPage: pagination.page || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || 0,
      limit: pagination.limit || 10,
    },
  };
}

/**
 * Send success response
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json(successResponse(data));
}

/**
 * Send error response
 */
export function sendError(res, message, statusCode = 400) {
  return res.status(statusCode).json(errorResponse(message));
}

/**
 * Send paginated response
 */
export function sendPaginated(res, data, pagination, statusCode = 200) {
  return res.status(statusCode).json(paginatedResponse(data, pagination));
}

/**
 * Handle async errors in API routes
 */
export function asyncHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error('API Error:', error);
      return sendError(res, error.message || 'Internal server error', 500);
    }
  };
}
