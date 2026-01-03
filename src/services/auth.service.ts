import { UserRole, Gender } from '@prisma/client';
import { db } from './database.service';
import { cryptoService } from './crypto.service';
import { logger } from '../utils/logger';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
  TokenPayload,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  ResetPasswordRequest,
  UserSession,
  AuthError,
  ValidationError
} from '../types/auth.types';

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * تسجيل دخول المستخدم
   */
  public async login(loginData: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      // البحث عن المستخدم
      const user = await db.getClient().user.findUnique({
        where: { email: loginData.email },
        include: {
          studentProfile: true,
          teacherProfile: {
            include: {
              school: true
            }
          }
        }
      });

      if (!user) {
        throw this.createAuthError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }

      if (!user.isActive) {
        throw this.createAuthError('Account is deactivated', 'ACCOUNT_DEACTIVATED', 403);
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await cryptoService.comparePassword(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        throw this.createAuthError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }

      // إنشاء جلسة جديدة
      const sessionToken = cryptoService.generateSessionToken();
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: sessionToken
      };

      const accessToken = cryptoService.generateAccessToken(tokenPayload);
      const refreshToken = cryptoService.generateRefreshToken(tokenPayload);

      // حفظ الجلسة في قاعدة البيانات
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 يوم

      await db.getClient().userSession.create({
        data: {
          userId: user.id,
          sessionToken,
          refreshToken,
          ipAddress,
          userAgent,
          expiresAt
        }
      });

      // تحديث آخر تسجيل دخول
      await db.getClient().user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // تسجيل النشاط
      await this.logActivity(user.id, 'LOGIN', 'user', user.id, { ipAddress, userAgent });

      const userProfile = this.mapToUserProfile(user);

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: userProfile,
        accessToken,
        refreshToken,
        expiresIn: cryptoService.getAccessTokenExpirationTime()
      };

    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      logger.error('Login failed:', error);
      throw this.createAuthError('Login failed', 'LOGIN_ERROR', 500);
    }
  }

  /**
   * تسجيل مستخدم جديد
   */
  public async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      // التحقق من صحة البيانات
      const validationErrors = this.validateRegisterData(registerData);
      if (validationErrors.length > 0) {
        throw this.createAuthError('Validation failed', 'VALIDATION_ERROR', 400, validationErrors);
      }

      // التحقق من عدم وجود المستخدم مسبقاً
      const existingUser = await db.getClient().user.findUnique({
        where: { email: registerData.email }
      });

      if (existingUser) {
        throw this.createAuthError('Email already exists', 'EMAIL_EXISTS', 409);
      }

      // تشفير كلمة المرور
      const passwordHash = await cryptoService.hashPassword(registerData.password);

      // إنشاء المستخدم والملف الشخصي في معاملة واحدة
      const result = await db.transaction(async (prisma) => {
        // إنشاء المستخدم
        const user = await prisma.user.create({
          data: {
            email: registerData.email,
            passwordHash,
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            role: registerData.role,
            phone: registerData.phone,
            dateOfBirth: registerData.dateOfBirth,
            gender: registerData.gender
          }
        });

        // إنشاء الملف الشخصي حسب الدور
        if (registerData.role === UserRole.student) {
          await prisma.studentProfile.create({
            data: {
              userId: user.id,
              gradeLevel: registerData.gradeLevel || 1,
              classSection: registerData.classSection,
              parentName: registerData.parentName,
              parentPhone: registerData.parentPhone,
              parentEmail: registerData.parentEmail
            }
          });
        } else if (registerData.role === UserRole.teacher) {
          await prisma.teacherProfile.create({
            data: {
              userId: user.id,
              employeeId: registerData.employeeId,
              schoolId: registerData.schoolId,
              specialization: registerData.specialization,
              yearsExperience: registerData.yearsExperience,
              qualification: registerData.qualification,
              academicYear: registerData.academicYear || new Date().getFullYear().toString(),
              bio: registerData.bio
            }
          });
        }

        return user;
      });

      // جلب المستخدم مع الملف الشخصي
      const userWithProfile = await db.getClient().user.findUnique({
        where: { id: result.id },
        include: {
          studentProfile: true,
          teacherProfile: {
            include: {
              school: true
            }
          }
        }
      });

      if (!userWithProfile) {
        throw new Error('Failed to retrieve created user');
      }

      // تسجيل النشاط
      await this.logActivity(result.id, 'REGISTER', 'user', result.id);

      const userProfile = this.mapToUserProfile(userWithProfile);

      logger.info(`User registered successfully: ${registerData.email}`);

      return {
        user: userProfile,
        message: 'User registered successfully'
      };

    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      logger.error('Registration failed:', error);
      throw this.createAuthError('Registration failed', 'REGISTRATION_ERROR', 500);
    }
  }

  /**
   * تحديث الرمز المميز
   */
  public async refreshToken(refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      // التحقق من صحة الرمز المميز
      const tokenPayload = cryptoService.verifyRefreshToken(refreshData.refreshToken);

      // البحث عن الجلسة
      const session = await db.getClient().userSession.findUnique({
        where: { refreshToken: refreshData.refreshToken },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        throw this.createAuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
      }

      if (!session.user.isActive) {
        throw this.createAuthError('Account is deactivated', 'ACCOUNT_DEACTIVATED', 403);
      }

      // إنشاء رموز جديدة
      const newTokenPayload: TokenPayload = {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        sessionId: session.sessionToken
      };

      const newAccessToken = cryptoService.generateAccessToken(newTokenPayload);
      const newRefreshToken = cryptoService.generateRefreshToken(newTokenPayload);

      // تحديث الجلسة
      await db.getClient().userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          lastActivity: new Date()
        }
      });

      logger.info(`Token refreshed for user: ${session.user.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: cryptoService.getAccessTokenExpirationTime()
      };

    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      logger.error('Token refresh failed:', error);
      throw this.createAuthError('Token refresh failed', 'REFRESH_ERROR', 500);
    }
  }

  /**
   * تسجيل خروج المستخدم
   */
  public async logout(sessionToken: string): Promise<void> {
    try {
      const session = await db.getClient().userSession.findUnique({
        where: { sessionToken },
        include: { user: true }
      });

      if (session) {
        await db.getClient().userSession.delete({
          where: { id: session.id }
        });

        await this.logActivity(session.user.id, 'LOGOUT', 'user', session.user.id);
        logger.info(`User logged out: ${session.user.email}`);
      }

    } catch (error) {
      logger.error('Logout failed:', error);
      throw this.createAuthError('Logout failed', 'LOGOUT_ERROR', 500);
    }
  }

  /**
   * تغيير كلمة المرور
   */
  public async changePassword(userId: number, changePasswordData: ChangePasswordRequest): Promise<void> {
    try {
      const user = await db.getClient().user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw this.createAuthError('User not found', 'USER_NOT_FOUND', 404);
      }

      // التحقق من كلمة المرور الحالية
      const isCurrentPasswordValid = await cryptoService.comparePassword(
        changePasswordData.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        throw this.createAuthError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD', 400);
      }

      // التحقق من قوة كلمة المرور الجديدة
      const passwordValidation = cryptoService.validatePasswordStrength(changePasswordData.newPassword);
      if (!passwordValidation.isValid) {
        throw this.createAuthError('New password is too weak', 'WEAK_PASSWORD', 400, 
          passwordValidation.errors.map(error => ({ field: 'newPassword', message: error, code: 'WEAK_PASSWORD' }))
        );
      }

      // تشفير كلمة المرور الجديدة
      const newPasswordHash = await cryptoService.hashPassword(changePasswordData.newPassword);

      // تحديث كلمة المرور
      await db.getClient().user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      // إلغاء جميع الجلسات الأخرى
      await db.getClient().userSession.deleteMany({
        where: { userId }
      });

      await this.logActivity(userId, 'CHANGE_PASSWORD', 'user', userId);
      logger.info(`Password changed for user ID: ${userId}`);

    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      logger.error('Change password failed:', error);
      throw this.createAuthError('Change password failed', 'CHANGE_PASSWORD_ERROR', 500);
    }
  }

  /**
   * التحقق من صحة الرمز المميز
   */
  public async verifyToken(token: string): Promise<UserProfile> {
    try {
      const tokenPayload = cryptoService.verifyAccessToken(token);

      const session = await db.getClient().userSession.findUnique({
        where: { sessionToken: tokenPayload.sessionId },
        include: {
          user: {
            include: {
              studentProfile: true,
              teacherProfile: {
                include: {
                  school: true
                }
              }
            }
          }
        }
      });

      if (!session || session.expiresAt < new Date()) {
        throw this.createAuthError('Invalid or expired session', 'INVALID_SESSION', 401);
      }

      if (!session.user.isActive) {
        throw this.createAuthError('Account is deactivated', 'ACCOUNT_DEACTIVATED', 403);
      }

      // تحديث آخر نشاط
      await db.getClient().userSession.update({
        where: { id: session.id },
        data: { lastActivity: new Date() }
      });

      return this.mapToUserProfile(session.user);

    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      logger.error('Token verification failed:', error);
      throw this.createAuthError('Token verification failed', 'TOKEN_VERIFICATION_ERROR', 401);
    }
  }

  /**
   * التحقق من صحة بيانات التسجيل
   */
  private validateRegisterData(data: RegisterRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    // التحقق من البريد الإلكتروني
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Valid email is required', code: 'INVALID_EMAIL' });
    }

    // التحقق من كلمة المرور
    const passwordValidation = cryptoService.validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      passwordValidation.errors.forEach(error => {
        errors.push({ field: 'password', message: error, code: 'WEAK_PASSWORD' });
      });
    }

    // التحقق من الاسم الأول
    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.push({ field: 'firstName', message: 'First name must be at least 2 characters', code: 'INVALID_FIRST_NAME' });
    }

    // التحقق من الاسم الأخير
    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters', code: 'INVALID_LAST_NAME' });
    }

    // التحقق من الدور
    if (!Object.values(UserRole).includes(data.role)) {
      errors.push({ field: 'role', message: 'Valid role is required', code: 'INVALID_ROLE' });
    }

    // التحقق من بيانات الطالب
    if (data.role === UserRole.student) {
      if (!data.gradeLevel || data.gradeLevel < 1 || data.gradeLevel > 12) {
        errors.push({ field: 'gradeLevel', message: 'Grade level must be between 1 and 12', code: 'INVALID_GRADE_LEVEL' });
      }
    }

    // التحقق من بيانات المعلم
    if (data.role === UserRole.teacher) {
      if (!data.academicYear) {
        errors.push({ field: 'academicYear', message: 'Academic year is required for teachers', code: 'MISSING_ACADEMIC_YEAR' });
      }
    }

    return errors;
  }

  /**
   * التحقق من صحة البريد الإلكتروني
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * تحويل بيانات المستخدم إلى UserProfile
   */
  private mapToUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      studentProfile: user.studentProfile ? {
        id: user.studentProfile.id,
        studentId: user.studentProfile.studentId,
        gradeLevel: user.studentProfile.gradeLevel,
        classSection: user.studentProfile.classSection,
        parentName: user.studentProfile.parentName,
        parentPhone: user.studentProfile.parentPhone,
        parentEmail: user.studentProfile.parentEmail,
        totalPoints: user.studentProfile.totalPoints,
        currentLevel: user.studentProfile.currentLevel,
        currentStreak: user.studentProfile.currentStreak,
        longestStreak: user.studentProfile.longestStreak
      } : undefined,
      teacherProfile: user.teacherProfile ? {
        id: user.teacherProfile.id,
        employeeId: user.teacherProfile.employeeId,
        schoolId: user.teacherProfile.schoolId,
        specialization: user.teacherProfile.specialization,
        yearsExperience: user.teacherProfile.yearsExperience,
        qualification: user.teacherProfile.qualification,
        academicYear: user.teacherProfile.academicYear,
        bio: user.teacherProfile.bio,
        school: user.teacherProfile.school ? {
          id: user.teacherProfile.school.id,
          name: user.teacherProfile.school.name
        } : undefined
      } : undefined
    };
  }

  /**
   * إنشاء خطأ مصادقة
   */
  private createAuthError(message: string, code: string, statusCode: number, errors?: ValidationError[]): AuthError {
    const error = Object.assign(new Error(message), {
      code,
      statusCode,
      errors
    }) as AuthError;
    return error;
  }

  /**
   * تسجيل النشاط
   */
  private async logActivity(userId: number, action: string, resourceType?: string, resourceId?: number, details?: any): Promise<void> {
    try {
      await db.getClient().activityLog.create({
        data: {
          userId,
          action,
          resourceType,
          resourceId,
          details,
          ipAddress: details?.ipAddress,
          userAgent: details?.userAgent
        }
      });
    } catch (error) {
      logger.error('Failed to log activity:', error);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default AuthService;