import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, DEFAULT_PERMISSIONS } from '../types/auth.types';

/**
 * Middleware للتحقق من المصادقة
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access token is required',
        code: 'MISSING_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const user = await authService.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      logger.warn('Authentication failed:', error);
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
    return;
  }
};

/**
 * Middleware للتحقق من الأدوار
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}. Required roles: ${allowedRoles.join(', ')}`);
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware للتحقق من الصلاحيات
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userPermissions = DEFAULT_PERMISSIONS[req.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      return next();
    }

    logger.warn(`Permission denied for user ${req.user.email}. Required permission: ${permission}`);
    return res.status(403).json({
      error: 'Permission denied',
      code: 'PERMISSION_DENIED',
      requiredPermission: permission,
      userRole: req.user.role
    });
  };
};

/**
 * Middleware للتحقق من صلاحيات متعددة (يجب أن يملك المستخدم جميع الصلاحيات)
 */
export const requireAllPermissions = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userPermissions = DEFAULT_PERMISSIONS[req.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    const missingPermissions = permissions.filter(permission => !userPermissions.includes(permission));
    
    if (missingPermissions.length > 0) {
      logger.warn(`Multiple permissions denied for user ${req.user.email}. Missing permissions: ${missingPermissions.join(', ')}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions,
        missingPermissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware للتحقق من صلاحية واحدة على الأقل من مجموعة صلاحيات
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userPermissions = DEFAULT_PERMISSIONS[req.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    const hasAnyPermission = permissions.some(permission => userPermissions.includes(permission));
    
    if (!hasAnyPermission) {
      logger.warn(`No matching permissions for user ${req.user.email}. Required any of: ${permissions.join(', ')}`);
      return res.status(403).json({
        error: 'No matching permissions',
        code: 'NO_MATCHING_PERMISSIONS',
        requiredAnyOf: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Decorator للحماية بالأدوار
 */
export const protectWithRoles = (allowedRoles: UserRole[]) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Role-based access denied for user ${req.user.email} with role ${req.user.role}. Required roles: ${allowedRoles.join(', ')}`);
        return res.status(403).json({
          error: 'Role-based access denied',
          code: 'ROLE_ACCESS_DENIED',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      return method.apply(this, [req, res, next]);
    };
  };
};

/**
 * Decorator للحماية بالصلاحيات
 */
export const protectWithPermissions = (requiredPermissions: string[]) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const userPermissions = DEFAULT_PERMISSIONS[req.user.role] || [];
      
      // Admin has all permissions
      if (!userPermissions.includes('*')) {
        const missingPermissions = requiredPermissions.filter(permission => !userPermissions.includes(permission));
        
        if (missingPermissions.length > 0) {
          logger.warn(`Permission-based access denied for user ${req.user.email}. Missing permissions: ${missingPermissions.join(', ')}`);
          return res.status(403).json({
            error: 'Permission-based access denied',
            code: 'PERMISSION_ACCESS_DENIED',
            requiredPermissions,
            missingPermissions,
            userRole: req.user.role
          });
        }
      }

      return method.apply(this, [req, res, next]);
    };
  };
};

/**
 * Middleware اختياري للمصادقة (لا يرفض الطلب إذا لم يكن هناك token)
 */
export const optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(); // Continue without authentication
      return;
    }

    const token = authHeader.substring(7);

    try {
      const user = await authService.verifyToken(token);
      req.user = user;
    } catch (error) {
      // Log but don't fail the request
      logger.debug('Optional authentication failed:', error);
    }

    next();

  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware للتحقق من ملكية المورد
 */
export const requireOwnership = (resourceIdParam: string = 'id', allowedRoles: UserRole[] = [UserRole.admin]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const resourceId = parseInt((req as any).params[resourceIdParam]);
    
    // Admin and other allowed roles can access any resource
    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    // Check if user owns the resource
    if (req.user.id !== resourceId) {
      logger.warn(`Ownership check failed for user ${req.user.email}. Trying to access resource ${resourceId}`);
      res.status(403).json({
        error: 'Access denied - resource ownership required',
        code: 'OWNERSHIP_REQUIRED'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware للتحقق من حالة المستخدم النشطة
 */
export const requireActiveUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  if (!req.user.isActive) {
    logger.warn(`Inactive user attempted access: ${req.user.email}`);
    res.status(403).json({
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED'
    });
    return;
  }

  next();
};

/**
 * Middleware للتحقق من تأكيد البريد الإلكتروني
 */
export const requireEmailVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  if (!req.user.emailVerified) {
    logger.warn(`Unverified user attempted access: ${req.user.email}`);
    res.status(403).json({
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
    return;
  }

  next();
};