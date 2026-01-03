import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('🗄️ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('🗄️ Database disconnected successfully');
    } catch (error) {
      logger.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as result`;
      return true;
    } catch (error) {
      logger.error('❌ Database health check failed:', error);
      return false;
    }
  }

  public async runMigrations(): Promise<void> {
    try {
      // This would typically be done via Prisma CLI in production
      // But we can check if tables exist
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `;
      
      logger.info(`📊 Database tables found: ${Array.isArray(tables) ? tables.length : 0}`);
    } catch (error) {
      logger.error('❌ Migration check failed:', error);
      throw error;
    }
  }

  // Transaction helper
  public async transaction<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  // Cleanup expired sessions
  public async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      
      if (result.count > 0) {
        logger.info(`🧹 Cleaned up ${result.count} expired sessions`);
      }
      
      return result.count;
    } catch (error) {
      logger.error('❌ Session cleanup failed:', error);
      return 0;
    }
  }

  // Get database statistics
  public async getStats(): Promise<{
    users: number;
    students: number;
    teachers: number;
    activeSessions: number;
  }> {
    try {
      const [users, students, teachers, activeSessions] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.studentProfile.count(),
        this.prisma.teacherProfile.count(),
        this.prisma.userSession.count({
          where: {
            expiresAt: {
              gt: new Date()
            }
          }
        })
      ]);

      return {
        users,
        students,
        teachers,
        activeSessions
      };
    } catch (error) {
      logger.error('❌ Failed to get database stats:', error);
      return {
        users: 0,
        students: 0,
        teachers: 0,
        activeSessions: 0
      };
    }
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
export default DatabaseService;