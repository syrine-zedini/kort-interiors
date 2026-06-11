import { Request, Response, NextFunction } from 'express';
import { auth } from './auth';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  // First run the standard auth middleware to decode the JWT
  auth(req, res, (err?: any) => {
    if (err) return next(err);

    // After auth, req.user should exist
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role } = req.user;
    if (role !== 'SuperAdmin' && role !== 'Admin') {
      console.warn(`Access denied for user ${req.user.email} with role ${role}`);
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    next();
  });
};
