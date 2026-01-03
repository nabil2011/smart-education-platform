import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { authService } from '../services/auth.service';
import { rateLimiter } from '../middleware/rateLimiter';
import { authenticate, authorize, requireOwnership } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  AuthenticatedRequest
} from '../types/auth.types';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: student@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePassword123!
 *     
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [student, teacher, admin]
 *         phone:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         gradeLevel:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         classSection:
 *           type: string
 *         parentName:
 *           type: string
 *         parentPhone:
 *           type: string
 *         parentEmail:
 *           type: string
 *           format: email
 *         employeeId:
 *           type: string
 *         schoolId:
 *           type: integer
 *         specialization:
 *           type: string
 *         yearsExperience:
 *           type: integer
 *         qualification:
 *           type: string
 *         academicYear:
 *           type: string
 *         bio:
 *           type: string
 *     
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         uuid:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [student, teacher, admin]
 *         avatarUrl:
 *           type: string
 *         phone:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         isActive:
 *           type: boolean
 *         emailVerified:
 *           type: boolean
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         studentProfile:
 *           type: object
 *         teacherProfile:
 *           type: object
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/UserProfile'
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         expiresIn:
 *           type: integer
 *     
 *     AuthError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         code:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *               code:
 *                 type: string
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: تسجيل دخول المستخدم
 *     description: تسجيل دخول المستخدم باستخدام البريد الإلكتروني وكلمة المرور
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: بيانات دخول خاطئة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       403:
 *         description: الحساب معطل
 *       429:
 *         description: تم تجاوز حد المحاولات
 */
router.post('/login', rateLimiter, async (req: Request, res: Response) => {
  try {
    const loginData: LoginRequest = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await authService.login(loginData, ipAddress, userAgent);

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Login route error:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Login failed',
      code: error.code || 'LOGIN_ERROR',
      errors: error.errors
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: تسجيل مستخدم جديد
 *     description: إنشاء حساب جديد للطالب أو المعلم أو المدير
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *                 message:
 *                   type: string
 *       400:
 *         description: بيانات غير صحيحة
 *       409:
 *         description: البريد الإلكتروني مستخدم مسبقاً
 *       429:
 *         description: تم تجاوز حد المحاولات
 */
router.post('/register', rateLimiter, async (req: Request, res: Response) => {
  try {
    const registerData: RegisterRequest = req.body;

    const result = await authService.register(registerData);

    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Register route error:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Registration failed',
      code: error.code || 'REGISTRATION_ERROR',
      errors: error.errors
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: تحديث الرمز المميز
 *     description: الحصول على رمز وصول جديد باستخدام رمز التحديث
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تحديث الرمز بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *       401:
 *         description: رمز التحديث غير صحيح أو منتهي الصلاحية
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshData: RefreshTokenRequest = req.body;

    const result = await authService.refreshToken(refreshData);

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Refresh token route error:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Token refresh failed',
      code: error.code || 'REFRESH_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: تسجيل خروج المستخدم
 *     description: إنهاء جلسة المستخدم الحالية
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم تسجيل الخروج بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: غير مصرح بالوصول
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const authHeader = req.get('authorization');
    if (!authHeader) {
      res.status(400).json({
        error: 'Authorization header is required',
        code: 'MISSING_AUTH_HEADER'
      });
      return;
    }

    // Extract session token from JWT payload (this would need to be implemented)
    // For now, we'll use a placeholder approach
    const sessionToken = authReq.user?.id.toString(); // This is a simplified approach

    await authService.logout(sessionToken || '');

    res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    logger.error('Logout route error:', error);
    
    res.status(500).json({
      error: error.message || 'Logout failed',
      code: error.code || 'LOGOUT_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: الحصول على معلومات المستخدم الحالي
 *     description: جلب معلومات المستخدم المصادق عليه
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: معلومات المستخدم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: غير مصرح بالوصول
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    res.status(200).json(authReq.user);
  } catch (error: any) {
    logger.error('Get current user route error:', error);
    
    res.status(500).json({
      error: 'Failed to get user information',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: تغيير كلمة المرور
 *     description: تغيير كلمة مرور المستخدم الحالي
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: تم تغيير كلمة المرور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: كلمة المرور الحالية خاطئة أو كلمة المرور الجديدة ضعيفة
 *       401:
 *         description: غير مصرح بالوصول
 */
router.put('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const changePasswordData: ChangePasswordRequest = req.body as ChangePasswordRequest;
    const userId = authReq.user!.id;

    await authService.changePassword(userId, changePasswordData);

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    logger.error('Change password route error:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Password change failed',
      code: error.code || 'CHANGE_PASSWORD_ERROR',
      errors: error.errors
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/verify-token:
 *   post:
 *     summary: التحقق من صحة الرمز المميز
 *     description: التحقق من صحة رمز الوصول
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: الرمز صحيح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: الرمز غير صحيح أو منتهي الصلاحية
 */
router.post('/verify-token', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    res.status(200).json({
      valid: true,
      user: authReq.user
    });
  } catch (error: any) {
    logger.error('Verify token route error:', error);
    
    res.status(500).json({
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_ERROR'
    });
  }
});

export default router;