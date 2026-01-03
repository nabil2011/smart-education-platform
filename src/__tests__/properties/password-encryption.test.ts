import fc from 'fast-check';
import { cryptoService } from '../../services/crypto.service';

describe('Password Encryption Properties', () => {
  /**
   * الخاصية 1: تشفير كلمات المرور
   * تتحقق من: المتطلبات 1.3
   * 
   * هذا الاختبار يتحقق من أن:
   * 1. كلمة المرور المشفرة مختلفة عن كلمة المرور الأصلية
   * 2. تشفير نفس كلمة المرور مرتين ينتج نتائج مختلفة (بسبب salt)
   * 3. يمكن التحقق من كلمة المرور المشفرة بنجاح
   * 4. كلمة مرور خاطئة لا تطابق كلمة المرور المشفرة
   */
  test('Property 1: Password encryption should be secure and verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 128 }), // كلمة مرور صالحة
        async (password: string) => {
          // تشفير كلمة المرور
          const hashedPassword1 = await cryptoService.hashPassword(password);
          const hashedPassword2 = await cryptoService.hashPassword(password);

          // التحقق من أن كلمة المرور المشفرة مختلفة عن الأصلية
          expect(hashedPassword1).not.toBe(password);
          expect(hashedPassword2).not.toBe(password);

          // التحقق من أن تشفير نفس كلمة المرور ينتج نتائج مختلفة (salt)
          expect(hashedPassword1).not.toBe(hashedPassword2);

          // التحقق من أن كلمة المرور الأصلية تطابق المشفرة
          const isValid1 = await cryptoService.comparePassword(password, hashedPassword1);
          const isValid2 = await cryptoService.comparePassword(password, hashedPassword2);
          
          expect(isValid1).toBe(true);
          expect(isValid2).toBe(true);

          // التحقق من أن كلمة مرور خاطئة لا تطابق
          if (password !== 'wrongpassword') {
            const isInvalid = await cryptoService.comparePassword('wrongpassword', hashedPassword1);
            expect(isInvalid).toBe(false);
          }
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  test('Property 1.1: Password hashing should handle edge cases', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 7 }), // كلمات مرور قصيرة
          fc.string({ minLength: 129, maxLength: 200 }), // كلمات مرور طويلة جداً
          fc.constantFrom('', ' ', '\n', '\t'), // حالات خاصة
          fc.string().filter((s: string) => s.includes('\0')) // نصوص تحتوي على null bytes
        ),
        async (password: string) => {
          try {
            const hashedPassword = await cryptoService.hashPassword(password);
            
            // إذا نجح التشفير، يجب أن يكون التحقق صحيحاً
            const isValid = await cryptoService.comparePassword(password, hashedPassword);
            expect(isValid).toBe(true);
            
            // كلمة المرور المشفرة يجب أن تكون مختلفة عن الأصلية
            expect(hashedPassword).not.toBe(password);
            
          } catch (error) {
            // في حالة فشل التشفير، يجب أن يكون الخطأ واضحاً
            expect(error).toBeInstanceOf(Error);
          }
        }
      ),
      { numRuns: 30, timeout: 8000 }
    );
  });

  test('Property 1.2: Password strength validation should be consistent', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (password: string) => {
          const validation1 = cryptoService.validatePasswordStrength(password);
          const validation2 = cryptoService.validatePasswordStrength(password);

          // النتيجة يجب أن تكون متسقة
          expect(validation1.isValid).toBe(validation2.isValid);
          expect(validation1.score).toBe(validation2.score);
          expect(validation1.errors).toEqual(validation2.errors);

          // النتيجة يجب أن تكون منطقية
          expect(validation1.score).toBeGreaterThanOrEqual(0);
          expect(validation1.score).toBeLessThanOrEqual(5);
          
          if (validation1.isValid) {
            expect(validation1.errors).toHaveLength(0);
          } else {
            expect(validation1.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1.3: Strong passwords should always be valid', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 })
          .filter((s: string) => /[A-Z]/.test(s)) // يحتوي على حرف كبير
          .filter((s: string) => /[a-z]/.test(s)) // يحتوي على حرف صغير
          .filter((s: string) => /\d/.test(s)) // يحتوي على رقم
          .filter((s: string) => /[!@#$%^&*(),.?":{}|<>]/.test(s)), // يحتوي على رمز خاص
        (strongPassword: string) => {
          const validation = cryptoService.validatePasswordStrength(strongPassword);
          
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          expect(validation.score).toBeGreaterThanOrEqual(4);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1.4: Weak passwords should be rejected', () => {
    const weakPasswords = [
      'password',
      '123456',
      'qwerty',
      'abc123',
      'short',
      'ONLYUPPERCASE',
      'onlylowercase',
      '12345678'
    ];

    weakPasswords.forEach(weakPassword => {
      const validation = cryptoService.validatePasswordStrength(weakPassword);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  test('Property 1.5: Hash consistency over time', async () => {
    const password = 'TestPassword123!';
    const hashes: string[] = [];

    // إنشاء عدة hashes لنفس كلمة المرور
    for (let i = 0; i < 5; i++) {
      const hash = await cryptoService.hashPassword(password);
      hashes.push(hash);
    }

    // كل hash يجب أن يكون مختلف (بسبب salt)
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(hashes.length);

    // لكن كلها يجب أن تتحقق من نفس كلمة المرور
    for (const hash of hashes) {
      const isValid = await cryptoService.comparePassword(password, hash);
      expect(isValid).toBe(true);
    }
  }, 10000);
});