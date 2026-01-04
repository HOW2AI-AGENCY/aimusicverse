/**
 * Shared Authentication Utilities for Edge Functions
 * Common patterns for validating requests and checking permissions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface User {
  id: string;
  email?: string;
  telegram_id?: number;
}

export interface AuthResult {
  user: User | null;
  isAdmin: boolean;
  error?: string;
}

/**
 * Validate request and extract user from authorization header
 */
export async function validateRequest(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return { user: null, isAdmin: false, error: 'Missing authorization header' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, isAdmin: false, error: 'Invalid token' };
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      isAdmin: !!isAdmin,
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { user: null, isAdmin: false, error: 'Authentication failed' };
  }
}

/**
 * Quick check if user is authenticated (no admin check)
 */
export async function getAuthenticatedUser(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<User | null> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<User> {
  const user = await getAuthenticatedUser(req, supabaseUrl, supabaseServiceKey);
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<User> {
  const result = await validateRequest(req, supabaseUrl, supabaseServiceKey);
  
  if (!result.user) {
    throw new Error(result.error || 'Authentication required');
  }
  
  if (!result.isAdmin) {
    throw new Error('Admin access required');
  }

  return result.user;
}
