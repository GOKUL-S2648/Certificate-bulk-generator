import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from './supabase.ts';

/**
 * Verify the Supabase access token and attach the verified user
 * to res.locals.authUser.
 */
export async function requireAuth(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = _req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please sign in and try again.',
    });
    return;
  }

  const accessToken = authorization
    .slice('Bearer '.length)
    .trim();

  if (!accessToken) {
    res.status(401).json({
      error: 'Invalid authentication token',
    });
    return;
  }

  try {
    const { data, error } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      res.status(401).json({
        error: 'Invalid or expired session',
        message: 'Please sign in again.',
      });
      return;
    }

    res.locals.authUser = {
      id: data.user.id,
      email: data.user.email ?? null,
    };

    next();
  } catch (error) {
    console.error(
      'Authentication verification failed:',
      error,
    );

    res.status(401).json({
      error: 'Could not verify your login session',
    });
  }
}