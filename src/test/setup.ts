import { PrismaClient } from '@prisma/client';

// Define enums that would normally come from Prisma
export const UserRole = {
  student: 'student',
  teacher: 'teacher',
  admin: 'admin'
} as const;

export const ContentType = {
  lesson: 'lesson',
  video: 'video',
  audio: 'audio',
  document: 'document',
  quiz: 'quiz',
  exercise: 'exercise'
} as const;

export const Difficulty = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard'
} as const;

export const BadgeRarity = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary'
} as const;

export const TransactionType = {
  earned: 'earned',
  spent: 'spent',
  bonus: 'bonus',
  penalty: 'penalty'
} as const;

export const NotificationType = {
  assignment: 'assignment',
  grade: 'grade',
  achievement: 'achievement',
  reminder: 'reminder',
  system: 'system'
} as const;

// Mock Prisma Client for testing
jest.mock('@prisma/client', () => {
  // Create a simple in-memory store for test data
  const mockData: any = {
    studentProfiles: new Map(),
    users: new Map(),
    badges: new Map(),
    transactions: new Map(),
    notifications: new Map(),
  };

  // Make mockData globally accessible for cleanup
  (global as any).mockData = mockData;

  const createModelMock = (modelName: string) => ({
    create: jest.fn().mockImplementation((args) => {
      // Generate unique ID to avoid conflicts
      const baseResult = { 
        id: Date.now() + Math.floor(Math.random() * 10000),
        uuid: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args?.data
      };
      
      // Add model-specific defaults
      if (modelName === 'notification') {
        baseResult.sentAt = baseResult.sentAt || new Date();
        baseResult.readAt = baseResult.readAt || null;
        baseResult.isRead = baseResult.isRead !== undefined ? baseResult.isRead : false;
        baseResult.referenceId = baseResult.referenceId || null;
        baseResult.referenceType = baseResult.referenceType || null;
      } else if (modelName === 'badge') {
        baseResult.isActive = baseResult.isActive !== undefined ? baseResult.isActive : true;
        baseResult.pointsReward = baseResult.pointsReward || 0;
      } else if (modelName === 'pointsTransaction') {
        baseResult.points = baseResult.points || 0;
      }
      
      // Store in mock data for retrieval
      if (modelName === 'studentProfile') {
        mockData.studentProfiles.set(baseResult.userId || baseResult.id, baseResult);
      } else if (modelName === 'user') {
        mockData.users.set(baseResult.id, baseResult);
      } else if (modelName === 'notification') {
        mockData.notifications = mockData.notifications || new Map();
        mockData.notifications.set(baseResult.id, baseResult);
      } else if (modelName === 'badge') {
        mockData.badges = mockData.badges || new Map();
        mockData.badges.set(baseResult.id, baseResult);
      } else if (modelName === 'pointsTransaction') {
        mockData.transactions = mockData.transactions || new Map();
        mockData.transactions.set(baseResult.id, baseResult);
      }
      
      return Promise.resolve(baseResult);
    }),
    findUnique: jest.fn().mockImplementation((args) => {
      if (modelName === 'studentProfile' && args?.where?.userId) {
        const profile = mockData.studentProfiles.get(args.where.userId);
        return Promise.resolve(profile || null);
      }
      if (modelName === 'notification' && args?.where?.id) {
        const notification = mockData.notifications?.get(args.where.id);
        return Promise.resolve(notification || null);
      }
      if (args?.where?.id) {
        return Promise.resolve({ 
          id: args.where.id,
          uuid: `uuid-${args.where.id}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockImplementation((args) => {
      if (modelName === 'notification') {
        const notifications = Array.from(mockData.notifications?.values() || []);
        let filtered = notifications;
        
        // Apply where filters
        if (args?.where) {
          filtered = notifications.filter((notification: any) => {
            if (args.where.userId && notification.userId !== args.where.userId) return false;
            if (args.where.isRead !== undefined && args.where.isRead !== null && notification.isRead !== args.where.isRead) return false;
            if (args.where.notificationType && notification.notificationType !== args.where.notificationType) return false;
            return true;
          });
        }
        
        // Apply ordering
        if (args?.orderBy?.sentAt === 'desc') {
          filtered.sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        }
        
        // Apply pagination
        if (args?.skip || args?.take) {
          const skip = args.skip || 0;
          const take = args.take || filtered.length;
          filtered = filtered.slice(skip, skip + take);
        }
        
        return Promise.resolve(filtered);
      } else if (modelName === 'badge') {
        const badges = Array.from(mockData.badges?.values() || []);
        let filtered = badges;
        
        // Apply where filters
        if (args?.where) {
          filtered = badges.filter((badge: any) => {
            if (args.where.isActive !== undefined && badge.isActive !== args.where.isActive) return false;
            return true;
          });
        }
        
        return Promise.resolve(filtered);
      } else if (modelName === 'pointsTransaction') {
        const transactions = Array.from(mockData.transactions?.values() || []);
        let filtered = transactions;
        
        // Apply where filters
        if (args?.where) {
          filtered = transactions.filter((transaction: any) => {
            if (args.where.studentId && transaction.studentId !== args.where.studentId) return false;
            return true;
          });
        }
        
        // Apply ordering
        if (args?.orderBy?.createdAt === 'desc') {
          filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        
        // Apply pagination
        if (args?.skip || args?.take) {
          const skip = args.skip || 0;
          const take = args.take || filtered.length;
          filtered = filtered.slice(skip, skip + take);
        }
        
        return Promise.resolve(filtered);
      }
      return Promise.resolve([]);
    }),
    findFirst: jest.fn().mockImplementation((args) => {
      if (modelName === 'notification' && args?.where) {
        const notifications = Array.from(mockData.notifications?.values() || []);
        const found = notifications.find((notification: any) => {
          if (args.where.id && notification.id !== args.where.id) return false;
          if (args.where.userId && notification.userId !== args.where.userId) return false;
          return true;
        });
        return Promise.resolve(found || null);
      }
      return Promise.resolve(null);
    }),
    update: jest.fn().mockImplementation((args) => {
      const result: any = { 
        id: args?.where?.id || args?.where?.userId || 1,
        updatedAt: new Date()
      };
      
      // Handle increment operations for totalPoints
      if (args?.data?.totalPoints?.increment) {
        result.totalPoints = args.data.totalPoints.increment;
        
        // Update the stored profile if it's a studentProfile
        if (modelName === 'studentProfile' && args?.where?.userId) {
          const existingProfile = mockData.studentProfiles.get(args.where.userId) || { totalPoints: 0 };
          existingProfile.totalPoints = (existingProfile.totalPoints || 0) + args.data.totalPoints.increment;
          existingProfile.updatedAt = new Date();
          mockData.studentProfiles.set(args.where.userId, existingProfile);
          result.totalPoints = existingProfile.totalPoints;
        }
      } else {
        // Copy other data
        Object.assign(result, args?.data);
      }
      
      // Handle notification updates
      if (modelName === 'notification' && args?.where?.id) {
        const existingNotification = mockData.notifications?.get(args.where.id);
        if (existingNotification) {
          Object.assign(existingNotification, args.data);
          existingNotification.updatedAt = new Date();
          if (args.data.isRead === true && !existingNotification.readAt) {
            existingNotification.readAt = new Date();
          }
          mockData.notifications.set(args.where.id, existingNotification);
          return Promise.resolve(existingNotification);
        }
      }
      
      return Promise.resolve(result);
    }),
    upsert: jest.fn().mockImplementation((args) => {
      return Promise.resolve({ 
        id: 1,
        ...args?.create || args?.update,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }),
    delete: jest.fn().mockImplementation((args) => {
      return Promise.resolve({ 
        id: args?.where?.id || 1,
        deletedAt: new Date()
      });
    }),
    deleteMany: jest.fn().mockImplementation((args) => {
      if (modelName === 'notification') {
        const notifications = Array.from(mockData.notifications?.values() || []);
        let toDelete = notifications;
        
        // Apply where filters
        if (args?.where) {
          toDelete = notifications.filter((notification: any) => {
            if (args.where.userId && notification.userId !== args.where.userId) return false;
            if (args.where.isRead !== undefined && notification.isRead !== args.where.isRead) return false;
            if (args.where.notificationType && notification.notificationType !== args.where.notificationType) return false;
            return true;
          });
        } else {
          // Delete all if no where clause
          mockData.notifications.clear();
          return Promise.resolve({ count: notifications.length });
        }
        
        // Remove the filtered notifications
        toDelete.forEach((notification: any) => {
          mockData.notifications.delete(notification.id);
        });
        
        return Promise.resolve({ count: toDelete.length });
      }
      return Promise.resolve({ count: 0 });
    }),
    count: jest.fn().mockImplementation((args) => {
      if (modelName === 'notification') {
        const notifications = Array.from(mockData.notifications?.values() || []);
        let filtered = notifications;
        
        // Apply where filters
        if (args?.where) {
          filtered = notifications.filter((notification: any) => {
            if (args.where.userId && notification.userId !== args.where.userId) return false;
            if (args.where.isRead !== undefined && args.where.isRead !== null && notification.isRead !== args.where.isRead) return false;
            if (args.where.notificationType && notification.notificationType !== args.where.notificationType) return false;
            return true;
          });
        }
        
        return Promise.resolve(filtered.length);
      }
      return Promise.resolve(0);
    }),
    aggregate: jest.fn().mockImplementation((args) => {
      if (modelName === 'pointsTransaction') {
        const transactions = Array.from(mockData.transactions?.values() || []);
        let filtered = transactions;
        
        // Apply where filters
        if (args?.where) {
          filtered = transactions.filter((transaction: any) => {
            if (args.where.studentId && transaction.studentId !== args.where.studentId) return false;
            return true;
          });
        }
        
        // Calculate sum
        if (args?._sum?.points) {
          const sum = filtered.reduce((total: number, transaction: any) => total + (transaction.points || 0), 0);
          return Promise.resolve({ _sum: { points: sum } });
        }
      }
      return Promise.resolve({ _count: { id: 0 }, _sum: { points: 0 } });
    }),
    groupBy: jest.fn().mockResolvedValue([]),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  });

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
      $executeRaw: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn().mockImplementation((callback) => {
        // Mock transaction by calling the callback with the mocked prisma instance
        const mockPrisma = {
          user: createModelMock('user'),
          studentProfile: createModelMock('studentProfile'),
          teacherProfile: createModelMock('teacherProfile'),
          userSession: createModelMock('userSession'),
          subject: createModelMock('subject'),
          content: createModelMock('content'),
          contentInteraction: createModelMock('contentInteraction'),
          assessment: createModelMock('assessment'),
          assessmentAttempt: createModelMock('assessmentAttempt'),
          assessmentQuestion: createModelMock('assessmentQuestion'),
          assessmentAnswer: createModelMock('assessmentAnswer'),
          assignment: createModelMock('assignment'),
          assignmentSubmission: createModelMock('assignmentSubmission'),
          pointsTransaction: createModelMock('pointsTransaction'),
          badge: createModelMock('badge'),
          studentBadge: createModelMock('studentBadge'),
          notification: createModelMock('notification'),
          notificationPreference: createModelMock('notificationPreference'),
          school: createModelMock('school'),
          class: createModelMock('class'),
          studentClassEnrollment: createModelMock('studentClassEnrollment'),
          grade: createModelMock('grade'),
          level: createModelMock('level'),
        };
        return callback(mockPrisma);
      }),
      
      // User management
      user: createModelMock('user'),
      studentProfile: createModelMock('studentProfile'),
      teacherProfile: createModelMock('teacherProfile'),
      userSession: createModelMock('userSession'),
      
      // Content management
      subject: createModelMock('subject'),
      content: createModelMock('content'),
      contentInteraction: createModelMock('contentInteraction'),
      
      // Assessment system
      assessment: createModelMock('assessment'),
      assessmentAttempt: createModelMock('assessmentAttempt'),
      assessmentQuestion: createModelMock('assessmentQuestion'),
      assessmentAnswer: createModelMock('assessmentAnswer'),
      
      // Assignment system
      assignment: createModelMock('assignment'),
      assignmentSubmission: createModelMock('assignmentSubmission'),
      
      // Gamification system
      pointsTransaction: createModelMock('pointsTransaction'),
      badge: createModelMock('badge'),
      studentBadge: createModelMock('studentBadge'),
      
      // Notification system
      notification: createModelMock('notification'),
      notificationPreference: createModelMock('notificationPreference'),
      
      // School management
      school: createModelMock('school'),
      class: createModelMock('class'),
      studentClassEnrollment: createModelMock('studentClassEnrollment'),
      
      // Additional models that might be referenced in tests
      grade: createModelMock('grade'),
      level: createModelMock('level'),
    })),
    
    // Export the enums
    UserRole,
    ContentType,
    Difficulty,
    BadgeRarity,
    TransactionType,
    NotificationType,
  };
});

// Global test setup
beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

beforeEach(() => {
  // Clear all mock data before each test
  const mockData: any = (global as any).mockData;
  if (mockData) {
    mockData.studentProfiles?.clear();
    mockData.users?.clear();
    mockData.badges?.clear();
    mockData.transactions?.clear();
    mockData.notifications?.clear();
  }
});

// Global cleanup function for property tests
(global as any).clearMockData = () => {
  const mockData: any = (global as any).mockData;
  if (mockData) {
    mockData.studentProfiles?.clear();
    mockData.users?.clear();
    mockData.badges?.clear();
    mockData.transactions?.clear();
    mockData.notifications?.clear();
  }
};

afterAll(async () => {
  // Cleanup after tests
});

// Increase timeout for integration tests
jest.setTimeout(30000);