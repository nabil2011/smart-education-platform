import { cryptoService } from '../../services/crypto.service';

describe('Crypto Service Unit Tests', () => {
  test('should hash password correctly', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await cryptoService.hashPassword(password);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(50);
  });

  test('should compare password correctly', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await cryptoService.hashPassword(password);
    
    const isValid = await cryptoService.comparePassword(password, hashedPassword);
    expect(isValid).toBe(true);
    
    const isInvalid = await cryptoService.comparePassword('wrongpassword', hashedPassword);
    expect(isInvalid).toBe(false);
  });

  test('should validate password strength', () => {
    const strongPassword = 'MySecure123!@#';
    const validation = cryptoService.validatePasswordStrength(strongPassword);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.score).toBeGreaterThanOrEqual(4);
  });

  test('should reject weak passwords', () => {
    const weakPassword = 'weak';
    const validation = cryptoService.validatePasswordStrength(weakPassword);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.score).toBeLessThan(4);
  });

  test('should generate JWT tokens', () => {
    const payload = {
      userId: 1,
      email: 'test@example.com',
      role: 'student' as any,
      sessionId: 'test-session'
    };

    const accessToken = cryptoService.generateAccessToken(payload);
    const refreshToken = cryptoService.generateRefreshToken(payload);

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(accessToken).not.toBe(refreshToken);
    expect(accessToken.split('.').length).toBe(3); // JWT has 3 parts
    expect(refreshToken.split('.').length).toBe(3);
  });

  test('should verify JWT tokens', () => {
    const payload = {
      userId: 1,
      email: 'test@example.com',
      role: 'student' as any,
      sessionId: 'test-session'
    };

    const accessToken = cryptoService.generateAccessToken(payload);
    const decoded = cryptoService.verifyAccessToken(accessToken);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.sessionId).toBe(payload.sessionId);
  });

  test('should generate random strings', () => {
    const randomString1 = cryptoService.generateRandomString(32);
    const randomString2 = cryptoService.generateRandomString(32);

    expect(randomString1).toBeDefined();
    expect(randomString2).toBeDefined();
    expect(randomString1.length).toBe(64); // hex string is 2x length
    expect(randomString2.length).toBe(64);
    expect(randomString1).not.toBe(randomString2);
  });
});