/**
 * Shared response utilities for Supabase Edge Functions
 * 
 * Provides consistent response formatting for success and error cases.
 * Uses 2xx status codes with error information in the response body for better integration.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuccessResponseData {
  success: true;
  data?: unknown;
  message?: string;
}

interface ErrorResponseData {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Create a successful response with 200 status
 * 
 * @param data - Response data to return
 * @param message - Optional success message
 * @returns Response with success: true and data
 */
export function successResponse(data?: unknown, message?: string): Response {
  const responseData: SuccessResponseData = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };

  return new Response(
    JSON.stringify(responseData),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create an error response with 200 status (for better client integration)
 * The error information is in the response body with success: false
 * 
 * @param error - Error message or Error object
 * @param code - Optional error code for client handling
 * @param details - Optional additional error details
 * @returns Response with success: false and error info
 */
export function errorResponse(
  error: string | Error,
  code?: string,
  details?: unknown
): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const responseData: ErrorResponseData = {
    success: false,
    error: errorMessage,
    ...(code ? { code } : {}),
    ...(details ? { details } : {}),
  };

  return new Response(
    JSON.stringify(responseData),
    {
      status: 200, // Use 200 for consistent handling in clients
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create a validation error response
 * 
 * @param message - Validation error message
 * @param fields - Optional field-specific errors
 * @returns Response with validation error
 */
export function validationErrorResponse(
  message: string,
  fields?: Record<string, string>
): Response {
  return errorResponse(message, 'VALIDATION_ERROR', fields);
}

/**
 * Create an authorization error response
 * 
 * @param message - Auth error message
 * @returns Response with auth error
 */
export function authErrorResponse(message = 'Unauthorized'): Response {
  return errorResponse(message, 'AUTH_ERROR');
}

/**
 * Create a not found error response
 * 
 * @param resource - Resource that was not found
 * @returns Response with not found error
 */
export function notFoundResponse(resource: string): Response {
  return errorResponse(`${resource} not found`, 'NOT_FOUND');
}

/**
 * Handle OPTIONS request for CORS
 */
export function optionsResponse(): Response {
  return new Response(null, { headers: corsHeaders });
}
