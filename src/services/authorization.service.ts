import { logger } from '../utils/logger';
import { DEFAULT_PERMISSIONS, RolePermissions } from '../types/auth.types';

// Define UserRole enum locally to avoid Prisma dependency issues in tests
enum UserRole {
  student = 'student',
  teacher = 'teacher',
  admin = 'admin'
}

/**
 * خدمة إدارة الصلاحيات والتحكم في الوصول
 */
class AuthorizationService {
  private static instance: AuthorizationService;
  private rolePermissions: RolePermissions;

  private constructor() {
    this.rolePermissions = { ...DEFAULT_PERMISSIONS };
  }

  public static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  /**
   * التحقق من وجود صلاحية معينة للمستخدم
   */
  public hasPermission(userRole: UserRole, permission: string): boolean {
    const userPermissions = this.rolePermissions[userRole] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }

    return userPermissions.includes(permission);
  }

  /**
   * التحقق من وجود جميع الصلاحيات المطلوبة
   */
  public hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
    const userPermissions = this.rolePermissions[userRole] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }

    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * التحقق من وجود صلاحية واحدة على الأقل من المجموعة
   */
  public hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
    const userPermissions = this.rolePermissions[userRole] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }

    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * الحصول على جميع صلاحيات الدور
   */
  public getRolePermissions(userRole: UserRole): string[] {
    return this.rolePermissions[userRole] || [];
  }

  /**
   * إضافة صلاحية جديدة لدور معين
   */
  public addPermissionToRole(userRole: UserRole, permission: string): void {
    if (!this.rolePermissions[userRole]) {
      this.rolePermissions[userRole] = [];
    }

    if (!this.rolePermissions[userRole].includes(permission)) {
      this.rolePermissions[userRole].push(permission);
      logger.info(`Added permission '${permission}' to role '${userRole}'`);
    }
  }

  /**
   * إزالة صلاحية من دور معين
   */
  public removePermissionFromRole(userRole: UserRole, permission: string): void {
    if (this.rolePermissions[userRole]) {
      const index = this.rolePermissions[userRole].indexOf(permission);
      if (index > -1) {
        this.rolePermissions[userRole].splice(index, 1);
        logger.info(`Removed permission '${permission}' from role '${userRole}'`);
      }
    }
  }

  /**
   * تعيين صلاحيات جديدة لدور معين
   */
  public setRolePermissions(userRole: UserRole, permissions: string[]): void {
    this.rolePermissions[userRole] = [...permissions];
    logger.info(`Set permissions for role '${userRole}': ${permissions.join(', ')}`);
  }

  /**
   * التحقق من صحة الصلاحية
   */
  public isValidPermission(permission: string): boolean {
    const validPermissionPattern = /^[a-z]+:[a-z]+$/;
    return validPermissionPattern.test(permission) || permission === '*';
  }

  /**
   * الحصول على جميع الصلاحيات المتاحة في النظام
   */
  public getAllSystemPermissions(): string[] {
    const allPermissions = new Set<string>();
    
    Object.values(this.rolePermissions).forEach(permissions => {
      permissions.forEach(permission => {
        if (permission !== '*') {
          allPermissions.add(permission);
        }
      });
    });

    return Array.from(allPermissions).sort();
  }

  /**
   * التحقق من التسلسل الهرمي للأدوار
   */
  public isRoleHierarchyValid(userRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.admin]: 3,
      [UserRole.teacher]: 2,
      [UserRole.student]: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[targetRole];
  }

  /**
   * التحقق من إمكانية الوصول للمورد
   */
  public canAccessResource(
    userRole: UserRole, 
    userId: number, 
    resourceOwnerId: number, 
    requiredPermission: string,
    allowOwnerAccess: boolean = true
  ): boolean {
    // Check if user has the required permission
    if (this.hasPermission(userRole, requiredPermission)) {
      return true;
    }

    // Check if user owns the resource and owner access is allowed
    if (allowOwnerAccess && userId === resourceOwnerId) {
      return true;
    }

    return false;
  }

  /**
   * إنشاء سياق التحكم في الوصول
   */
  public createAccessContext(userRole: UserRole, userId: number) {
    return {
      role: userRole,
      userId,
      permissions: this.getRolePermissions(userRole),
      hasPermission: (permission: string) => this.hasPermission(userRole, permission),
      hasAllPermissions: (permissions: string[]) => this.hasAllPermissions(userRole, permissions),
      hasAnyPermission: (permissions: string[]) => this.hasAnyPermission(userRole, permissions),
      canAccessResource: (resourceOwnerId: number, requiredPermission: string, allowOwnerAccess = true) =>
        this.canAccessResource(userRole, userId, resourceOwnerId, requiredPermission, allowOwnerAccess)
    };
  }

  /**
   * تسجيل محاولة الوصول غير المصرح بها
   */
  public logUnauthorizedAccess(
    userRole: UserRole,
    userId: number,
    attemptedAction: string,
    requiredPermission: string,
    resourceId?: number
  ): void {
    logger.warn('Unauthorized access attempt', {
      userRole,
      userId,
      attemptedAction,
      requiredPermission,
      resourceId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * التحقق من صلاحيات الوصول للبيانات الحساسة
   */
  public canAccessSensitiveData(userRole: UserRole, dataType: string): boolean {
    const sensitiveDataPermissions = {
      'user_personal_info': ['admin:read', 'profile:read'],
      'financial_data': ['admin:read', 'finance:read'],
      'system_logs': ['admin:read', 'system:read'],
      'security_settings': ['admin:read', 'admin:update']
    };

    const requiredPermissions = sensitiveDataPermissions[dataType as keyof typeof sensitiveDataPermissions];
    if (!requiredPermissions) {
      return false;
    }

    return this.hasAnyPermission(userRole, requiredPermissions);
  }

  /**
   * إعادة تعيين الصلاحيات إلى القيم الافتراضية
   */
  public resetToDefaultPermissions(): void {
    this.rolePermissions = { ...DEFAULT_PERMISSIONS };
    logger.info('Role permissions reset to default values');
  }

  /**
   * التحقق من صحة تكوين الصلاحيات
   */
  public validatePermissionConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if all roles have permissions defined
    const roles = ['student', 'teacher', 'admin'];
    roles.forEach(role => {
      if (!this.rolePermissions[role] || this.rolePermissions[role].length === 0) {
        errors.push(`Role '${role}' has no permissions defined`);
      }
    });

    // Check if all permissions are valid
    Object.entries(this.rolePermissions).forEach(([role, permissions]) => {
      permissions.forEach(permission => {
        if (!this.isValidPermission(permission)) {
          errors.push(`Invalid permission '${permission}' for role '${role}'`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const authorizationService = AuthorizationService.getInstance();
export default AuthorizationService;