import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TokenPayload, JWTConfig } from '../types/auth.types';
import { logger } from '../utils/logger';

class CryptoService {
  private jwtConfig: JWTConfig;
  private bcryptRounds: number;

  constructor() {
    this.jwtConfig = {
      accessTokenSecret: process.env.JWT_SECRET || 'fallback-secret-key',
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };
    
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');

    // Warn if using fallback secrets
    if (!process.env.JWT_SECRET) {
      logger.warn('⚠️ Using fallback JWT secret. Set JWT_SECRET in production!');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      logger.warn('⚠️ Using fallback refresh secret. Set JWT_REFRESH_SECRET in production!');
    }
  }

  // Password hashing
  public async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.bcryptRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      logger.error('❌ Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('❌ Password comparison failed:', error);
      throw new Error('Password comparison failed');
    }
  }

  // JWT Token generation
  public generateAccessToken(payload: TokenPayload): string {
    try {
      // @ts-ignore - JWT types issue
      return jwt.sign(
        payload, 
        this.jwtConfig.accessTokenSecret, 
        {
          expiresIn: this.jwtConfig.accessTokenExpiresIn,
          issuer: 'smart-edu-backend',
          audience: 'smart-edu-frontend'
        }
      );
    } catch (error) {
      logger.error('❌ Access token generation failed:', error);
      throw new Error('Token generation failed');
    }
  }

  public generateRefreshToken(payload: TokenPayload): string {
    try {
      // @ts-ignore - JWT types issue
      return jwt.sign(
        payload, 
        this.jwtConfig.refreshTokenSecret, 
        {
          expiresIn: this.jwtConfig.refreshTokenExpiresIn,
          issuer: 'smart-edu-backend',
          audience: 'smart-edu-frontend'
        }
      );
    } catch (error) {
      logger.error('❌ Refresh token generation failed:', error);
      throw new Error('Refresh token generation failed');
    }
  }

  // JWT Token verification
  public verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtConfig.accessTokenSecret, {
        issuer: 'smart-edu-backend',
        audience: 'smart-edu-frontend'
      }) as TokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        logger.error('❌ Access token verification failed:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  public verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtConfig.refreshTokenSecret, {
        issuer: 'smart-edu-backend',
        audience: 'smart-edu-frontend'
      }) as TokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('❌ Refresh token verification failed:', error);
        throw new Error('Refresh token verification failed');
      }
    }
  }

  // Session token generation
  public generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Random string generation
  public generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure random password
  public generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  // Email verification token
  public generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Password reset token
  public generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Get token expiration time in seconds
  public getAccessTokenExpirationTime(): number {
    const expiresIn = this.jwtConfig.accessTokenExpiresIn;
    
    // Parse time string (e.g., "15m", "1h", "7d")
    const timeValue = parseInt(expiresIn);
    const timeUnit = expiresIn.slice(-1);
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 24 * 60 * 60;
      default: return 15 * 60; // Default 15 minutes
    }
  }

  // Validate password strength
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password contains common patterns');
      score -= 1;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.max(0, score)
    };
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();
export default CryptoService;