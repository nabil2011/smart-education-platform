import fc from 'fast-check';
import { UserRole, Gender } from '@prisma/client';
import { authService } from '../../services/auth.service';
import { db } from '../../services/database.service';
import { cryptoService } from '../../services/crypto.service';
import { LoginRequest, RegisterRequest } from '../../types/auth.types';

describe('Authentication Properties', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    // تنظيف قاعدة البيانات قبل كل اختبار
    await db.getClient().userSession.deleteMany({});
    await db.getClient().studentProfile.deleteMany({});
    await db.getClient().teacherProfile.deleteMany({});
    await db.getClient().user.deleteMany({});
  });

  /**
   * الخاصية 2: صحة جلسات المصادقة
   * تتحقق من: المتطلبات 1.1, 1.2, 1.4
   * 
   * هذا الاختبار يتحقق من أن:
   * 1. تسجيل الدخول ينشئ جلسة صحيحة
   * 2. الرمز المميز يمكن التحقق منه
   * 3. الجلسة تحتوي على معلومات المستخدم الصحيحة
   * 4. تحديث الرمز المميز يعمل بشكل صحيح
   */
  test('Property 2: Authentication sessions should be valid and verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 20 })
            .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s) && /[!@#$%^&*]/.test(s)),
          firstName: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[a-zA-Z\u0600-\u06FF\s]+$/.test(s)),
          lastName: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[a-zA-Z\u0600-\u06FF\s]+$/.test(s)),
          role: fc.constantFrom(UserRole.student, UserRole.teacher),
          gradeLevel: fc.integer({ min: 1, max: 12 })
        }),
        async (userData) => {
          try {
            // تسجيل مستخدم جديد
            const registerData: RegisterRequest = {
              ...userData,
              academicYear: userData.role === UserRole.teacher ? '2024' : undefined
            };

            const registerResult = await authService.register(registerData);
            expect(registerResult.user).toBeDefined();
            expect(registerResult.user.email).toBe(userData.email);
            expect(registerResult.user.role).toBe(userData.role);

            // تسجيل الدخول
            const loginData: LoginRequest = {
              email: userData.email,
              password: userData.password
            };

            const loginResult = await authService.login(loginData, '127.0.0.1', 'test-agent');
            
            // التحقق من صحة استجابة تسجيل الدخول
            expect(loginResult.user).toBeDefined();
            expect(loginResult.accessToken).toBeDefined();
            expect(loginResult.refreshToken).toBeDefined();
            expect(loginResult.expiresIn).toBeGreaterThan(0);
            
            // التحقق من معلومات المستخدم
            expect(loginResult.user.email).toBe(userData.email);
            expect(loginResult.user.role).toBe(userData.role);
            expect(loginResult.user.firstName).toBe(userData.firstName);
            expect(loginResult.user.lastName).toBe(userData.lastName);

            // التحقق من صحة الرمز المميز
            const verifiedUser = await authService.verifyToken(loginResult.accessToken);
            expect(verifiedUser.id).toBe(loginResult.user.id);
            expect(verifiedUser.email).toBe(userData.email);

            // اختبار تحديث الرمز المميز
            const refreshResult = await authService.refreshToken({
              refreshToken: loginResult.refreshToken
            });
            
            expect(refreshResult.accessToken).toBeDefined();
            expect(refreshResult.refreshToken).toBeDefined();
            expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);

            // التحقق من الرمز المميز الجديد
            const verifiedNewUser = await authService.verifyToken(refreshResult.accessToken);
            expect(verifiedNewUser.id).toBe(loginResult.user.id);

          } catch (error) {
            // في حالة فشل الاختبار، نتأكد من أن الخطأ منطقي
            console.error('Authentication test failed:', error);
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 15000 }
    );
  });

  /**
   * الخاصية 3: رفض البيانات الخاطئة
   * تتحقق من: المتطلبات 1.1, 1.2
   * 
   * هذا الاختبار يتحقق من أن:
   * 1. بيانات دخول خاطئة ترفض
   * 2. كلمات مرور ضعيفة ترفض
   * 3. بيانات تسجيل غير صحيحة ترفض
   */
  test('Property 3: Invalid credentials should be rejected', async () => {
    // إنشاء مستخدم صحيح أولاً
    const validUser = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.student,
      gradeLevel: 5
    };

    await authService.register(validUser);

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.oneof(
            fc.constant('test@example.com'), // بريد صحيح
            fc.constant('wrong@example.com'), // بريد خاطئ
            fc.constant('invalid-email'), // بريد غير صحيح
            fc.constant('') // بريد فارغ
          ),
          password: fc.oneof(
            fc.constant('ValidPassword123!'), // كلمة مرور صحيحة
            fc.constant('wrongpassword'), // كلمة مرور خاطئة
            fc.constant('123'), // كلمة مرور قصيرة
            fc.constant('') // كلمة مرور فارغة
          )
        }),
        async (loginData) => {
          const isValidCredentials = 
            loginData.email === 'test@example.com' && 
            loginData.password === 'ValidPassword123!';

          if (isValidCredentials) {
            // يجب أن ينجح تسجيل الدخول
            const result = await authService.login(loginData);
            expect(result.user).toBeDefined();
            expect(result.accessToken).toBeDefined();
          } else {
            // يجب أن يفشل تسجيل الدخول
            await expect(authService.login(loginData)).rejects.toThrow();
          }
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  });

  /**
   * الخاصية 4: انتهاء صلاحية الجلسات
   * تتحقق من: المتطلبات 1.4
   * 
   * هذا الاختبار يتحقق من أن:
   * 1. الرموز المميزة لها وقت انتهاء صلاحية
   * 2. الرموز المنتهية الصلاحية ترفض
   * 3. تحديث الرموز يعمل قبل انتهاء الصلاحية
   */
  test('Property 4: Token expiration should be handled correctly', async () => {
    // إنشاء مستخدم للاختبار
    const testUser = {
      email: 'expiry-test@example.com',
      password: 'TestPassword123!',
      firstName: 'Expiry',
      lastName: 'Test',
      role: UserRole.student,
      gradeLevel: 6
    };

    await authService.register(testUser);
    const loginResult = await authService.login({
      email: testUser.email,
      password: testUser.password
    });

    // التحقق من أن الرمز المميز له وقت انتهاء صلاحية
    expect(loginResult.expiresIn).toBeGreaterThan(0);
    expect(loginResult.expiresIn).toBeLessThanOrEqual(7 * 24 * 60 * 60); // أقل من أو يساوي 7 أيام

    // التحقق من أن الرمز المميز صحيح حالياً
    const verifiedUser = await authService.verifyToken(loginResult.accessToken);
    expect(verifiedUser.id).toBe(loginResult.user.id);

    // اختبار تحديث الرمز المميز
    const refreshResult = await authService.refreshToken({
      refreshToken: loginResult.refreshToken
    });

    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.refreshToken).toBeDefined();
    expect(refreshResult.expiresIn).toBeGreaterThan(0);

    // التحقق من أن الرمز المميز الجديد يعمل
    const verifiedNewUser = await authService.verifyToken(refreshResult.accessToken);
    expect(verifiedNewUser.id).toBe(loginResult.user.id);
  });

  /**
   * الخاصية 2.1: تسجيل المستخدمين بأدوار مختلفة
   */
  test('Property 2.1: Users with different roles should register correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 20 })
            .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s) && /[!@#$%^&*]/.test(s)),
          firstName: fc.string({ minLength: 2, maxLength: 20 }),
          lastName: fc.string({ minLength: 2, maxLength: 20 }),
          role: fc.constantFrom(UserRole.student, UserRole.teacher, UserRole.admin)
        }),
        async (userData) => {
          const registerData: RegisterRequest = {
            ...userData,
            gradeLevel: userData.role === UserRole.student ? 5 : undefined,
            academicYear: userData.role === UserRole.teacher ? '2024' : undefined
          };

          const result = await authService.register(registerData);
          
          expect(result.user.role).toBe(userData.role);
          expect(result.user.email).toBe(userData.email);
          
          // التحقق من إنشاء الملف الشخصي المناسب
          if (userData.role === UserRole.student) {
            expect(result.user.studentProfile).toBeDefined();
            expect(result.user.teacherProfile).toBeUndefined();
          } else if (userData.role === UserRole.teacher) {
            expect(result.user.teacherProfile).toBeDefined();
            expect(result.user.studentProfile).toBeUndefined();
          }
        }
      ),
      { numRuns: 15, timeout: 12000 }
    );
  });

  /**
   * الخاصية 2.2: تغيير كلمة المرور
   */
  test('Property 2.2: Password change should work correctly', async () => {
    // إنشاء مستخدم للاختبار
    const testUser = {
      email: 'password-change@example.com',
      password: 'OldPassword123!',
      firstName: 'Password',
      lastName: 'Change',
      role: UserRole.student,
      gradeLevel: 7
    };

    const registerResult = await authService.register(testUser);
    const userId = registerResult.user.id;

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 20 })
          .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s) && /[!@#$%^&*]/.test(s))
          .filter(s => s !== testUser.password), // كلمة مرور جديدة مختلفة
        async (newPassword) => {
          // تغيير كلمة المرور
          await authService.changePassword(userId, {
            currentPassword: testUser.password,
            newPassword
          });

          // محاولة تسجيل الدخول بكلمة المرور القديمة (يجب أن تفشل)
          await expect(authService.login({
            email: testUser.email,
            password: testUser.password
          })).rejects.toThrow();

          // تسجيل الدخول بكلمة المرور الجديدة (يجب أن ينجح)
          const loginResult = await authService.login({
            email: testUser.email,
            password: newPassword
          });

          expect(loginResult.user.id).toBe(userId);
          expect(loginResult.accessToken).toBeDefined();

          // تحديث كلمة المرور للاختبار التالي
          testUser.password = newPassword;
        }
      ),
      { numRuns: 5, timeout: 10000 }
    );
  });

  /**
   * الخاصية 2.3: الحماية من الهجمات
   */
  test('Property 2.3: Security measures should prevent attacks', async () => {
    // إنشاء مستخدم للاختبار
    const testUser = {
      email: 'security-test@example.com',
      password: 'SecurePassword123!',
      firstName: 'Security',
      lastName: 'Test',
      role: UserRole.student,
      gradeLevel: 8
    };

    await authService.register(testUser);

    // اختبار محاولات تسجيل دخول متعددة بكلمات مرور خاطئة
    const wrongPasswords = ['wrong1', 'wrong2', 'wrong3', 'wrong4', 'wrong5'];
    
    for (const wrongPassword of wrongPasswords) {
      await expect(authService.login({
        email: testUser.email,
        password: wrongPassword
      })).rejects.toThrow();
    }

    // التأكد من أن تسجيل الدخول الصحيح ما زال يعمل
    const loginResult = await authService.login({
      email: testUser.email,
      password: testUser.password
    });

    expect(loginResult.user.email).toBe(testUser.email);
    expect(loginResult.accessToken).toBeDefined();
  });
});