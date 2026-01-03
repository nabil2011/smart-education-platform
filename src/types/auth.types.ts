import { UserRole, Gender } from '@prisma/client';
import { Request } from 'express';

// Login DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Register DTOs
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  
  // Student specific fields
  gradeLevel?: number;
  classSection?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  
  // Teacher specific fields
  employeeId?: string;
  schoolId?: number;
  specialization?: string;
  yearsExperience?: number;
  qualification?: string;
  academicYear?: string;
  bio?: string;
}

export interface RegisterResponse {
  user: UserProfile;
  message: string;
}

// User Profile DTOs
export interface UserProfile {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Profile data based on role
  studentProfile?: StudentProfileData;
  teacherProfile?: TeacherProfileData;
}

export interface StudentProfileData {
  id: number;
  studentId?: string;
  gradeLevel: number;
  classSection?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  totalPoints: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
}

export interface TeacherProfileData {
  id: number;
  employeeId?: string;
  schoolId?: number;
  specialization?: string;
  yearsExperience?: number;
  qualification?: string;
  academicYear: string;
  bio?: string;
  school?: {
    id: number;
    name: string;
  };
}

// Token DTOs
export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Password DTOs
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

// Session DTOs
export interface UserSession {
  id: number;
  sessionToken: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
}

// Validation DTOs
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AuthError {
  message: string;
  code: string;
  statusCode: number;
  errors?: ValidationError[];
}

// JWT Configuration
export interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

// Auth Middleware Types
export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  session?: UserSession;
}

export interface RolePermissions {
  [key: string]: string[];
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  student: [
    'profile:read',
    'profile:update',
    'content:read',
    'assessment:take',
    'assignment:submit',
    'notification:read',
    'gamification:view',
    'progress:view'
  ],
  teacher: [
    'profile:read',
    'profile:update',
    'content:create',
    'content:read',
    'content:update',
    'content:delete',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete',
    'assignment:create',
    'assignment:read',
    'assignment:update',
    'assignment:grade',
    'student:read',
    'student:track',
    'notification:send',
    'notification:read',
    'gamification:manage',
    'analytics:view',
    'class:manage'
  ],
  admin: [
    '*' // All permissions
  ]
};