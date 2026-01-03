import { Router, Response } from 'express';
import { 
  authenticate, 
  authorize, 
  requirePermission, 
  requireAllPermissions,
  requireAnyPermission,
  requireOwnership,
  requireActiveUser,
  requireEmailVerification
} from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/auth.types';
import { authorizationService } from '../services/authorization.service';
import { logger } from '../utils/logger';

// Import UserRole enum locally to avoid Prisma dependency issues
enum UserRole {
  student = 'student',
  teacher = 'teacher',
  admin = 'admin'
}

const router = Router();

/**
 * مثال على استخدام التحقق من الأدوار
 */
router.get('/admin-only', 
  authenticate,
  authorize([UserRole.admin]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: 'This is admin-only content',
      user: req.user?.email
    });
  }
);

/**
 * مثال على استخدام التحقق من الصلاحيات
 */
router.get('/content/create',
  authenticate,
  requirePermission('content:create'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: 'You can create content',
      user: req.user?.email,
      role: req.user?.role
    });
  }
);

/**
 * مثال على استخدام التحقق من صلاحيات متعددة
 */
router.get('/advanced-analytics',
  authenticate,
  requireAllPermissions(['analytics:view', 'student:read']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: 'Advanced analytics data',
      user: req.user?.email
    });
  }
);

/**
 * مثال على استخدام التحقق من صلاحية واحدة من مجموعة
 */
router.get('/content-management',
  authenticate,
  requireAnyPermission(['content:create', 'content:update', 'content:delete']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: 'Content management interface',
      user: req.user?.email,
      permissions: authorizationService.getRolePermissions(req.user!.role as any)
    });
  }
);

/**
 * مثال على التحقق من ملكية المورد
 */
router.get('/profile/:id',
  authenticate,
  requireOwnership('id', [UserRole.admin, UserRole.teacher]),
  (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.id);
    res.json({
      message: `Profile data for user ${userId}`,
      canAccess: true,
      user: req.user?.email
    });
  }
);

/**
 * مثال على التحقق من حالة المستخدم النشطة
 */
router.get('/active-users-only',
  authenticate,
  requireActiveUser,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: 'This content is for active users only',
      user: req.user?.email,
      isActive: req.user?.isActive
    });
  }
);

/**
 * مثال على التحقق من تأكيد البريد الإلكتروني
 */
router.get('/verified-users-only',
  authenticate,
  requireEmailVerification,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: 'This content requires email verification',
      user: req.user?.email,
      emailVerified: req.user?.emailVerified
    });
  }
);

/**
 * مثال على استخدام سياق التحكم في الوصول
 */
router.get('/user-context',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const context = authorizationService.createAccessContext(req.user.role as any, req.user.id);
    
    return res.json({
      message: 'User access context',
      context: {
        role: context.role,
        userId: context.userId,
        permissions: context.permissions,
        canCreateContent: context.hasPermission('content:create'),
        canManageStudents: context.hasPermission('student:read'),
        canAccessAnalytics: context.hasPermission('analytics:view')
      }
    });
  }
);

/**
 * مثال على التحقق من الوصول للبيانات الحساسة
 */
router.get('/sensitive-data/:type',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const dataType = req.params.type;
    const canAccess = authorizationService.canAccessSensitiveData(req.user.role as any, dataType);

    if (!canAccess) {
      authorizationService.logUnauthorizedAccess(
        req.user.role as any,
        req.user.id,
        `access_sensitive_data_${dataType}`,
        `sensitive_data:${dataType}`
      );

      return res.status(403).json({
        error: 'Access denied to sensitive data',
        dataType,
        userRole: req.user.role
      });
    }

    return res.json({
      message: `Access granted to ${dataType}`,
      dataType,
      user: req.user.email
    });
  }
);

/**
 * مثال على التحقق من التسلسل الهرمي للأدوار
 */
router.get('/manage-user/:targetRole',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const targetRole = req.params.targetRole;
    
    if (!Object.values(UserRole).includes(targetRole as UserRole)) {
      return res.status(400).json({ error: 'Invalid target role' });
    }

    const canManage = authorizationService.isRoleHierarchyValid(req.user.role as any, targetRole as any);

    if (!canManage) {
      return res.status(403).json({
        error: 'Cannot manage users of this role',
        userRole: req.user.role,
        targetRole
      });
    }

    return res.json({
      message: `Can manage users with role ${targetRole}`,
      userRole: req.user.role,
      targetRole
    });
  }
);

/**
 * مثال على إدارة الصلاحيات الديناميكية (للمديرين فقط)
 */
router.post('/permissions/manage',
  authenticate,
  authorize([UserRole.admin]),
  (req: AuthenticatedRequest, res: Response) => {
    const { role, permission, action } = req.body;

    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!authorizationService.isValidPermission(permission)) {
      return res.status(400).json({ error: 'Invalid permission format' });
    }

    try {
      switch (action) {
        case 'add':
          authorizationService.addPermissionToRole(role, permission);
          break;
        case 'remove':
          authorizationService.removePermissionFromRole(role, permission);
          break;
        default:
          return res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
      }

      logger.info(`Permission ${action}ed: ${permission} for role ${role} by ${req.user?.email}`);

      return res.json({
        message: `Permission ${action}ed successfully`,
        role,
        permission,
        action,
        updatedPermissions: authorizationService.getRolePermissions(role)
      });

    } catch (error) {
      logger.error('Permission management error:', error);
      return res.status(500).json({ error: 'Failed to manage permission' });
    }
  }
);

/**
 * الحصول على جميع الصلاحيات المتاحة
 */
router.get('/permissions/available',
  authenticate,
  authorize([UserRole.admin]),
  (req: AuthenticatedRequest, res: Response) => {
    const allPermissions = authorizationService.getAllSystemPermissions();
    const validation = authorizationService.validatePermissionConfiguration();

    return res.json({
      message: 'Available system permissions',
      permissions: allPermissions,
      configurationValid: validation.isValid,
      configurationErrors: validation.errors
    });
  }
);

/**
 * الحصول على صلاحيات دور معين
 */
router.get('/permissions/role/:role',
  authenticate,
  authorize([UserRole.admin, UserRole.teacher]),
  (req: AuthenticatedRequest, res: Response) => {
    const role = req.params.role;

    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Teachers can only view their own role permissions
    if (req.user?.role === UserRole.teacher && role !== UserRole.teacher) {
      return res.status(403).json({ error: 'Can only view your own role permissions' });
    }

    const permissions = authorizationService.getRolePermissions(role as any);

    return res.json({
      message: `Permissions for role ${role}`,
      role,
      permissions,
      permissionCount: permissions.length
    });
  }
);

export default router;