import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      username?: string;
      role?: string;
    };
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dridibackupkey';
    const decoded = jwt.verify(token, secret);
    req.user = decoded as { id: string; email: string; username?: string };
    next();
  } catch (error: any) {
    console.error('JWT verification failed:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};