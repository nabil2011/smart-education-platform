import { PrismaClient, NotificationType } from '@prisma/client';
import {
  Notification,
  CreateNotificationDto,
  NotificationFilters,
  UpdateNotificationDto,
  PaginatedNotifications,
  NotificationChannel,
  NotificationDeliveryResult
} from '../types/notification.types';

export class NotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * إرسال إشعار فوري للمستخدم
   * Validates: Requirements 8.1
   */
  async sendNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    try {
      // إنشاء الإشعار في قاعدة البيانات
      const notification = await this.prisma.notification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          notificationType: notificationData.notificationType,
          referenceId: notificationData.referenceId,
          referenceType: notificationData.referenceType,
          isRead: false,
          sentAt: new Date()
        }
      });

      // اختيار قناة الإشعار المناسبة وإرسال الإشعار
      await this.selectAndSendThroughChannel(notification);

      return notification;
    } catch (error: any) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * اختيار قناة الإشعار المناسبة
   * Validates: Requirements 8.2
   */
  private async selectAndSendThroughChannel(notification: Notification): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];
    
    // الحصول على تفضيلات المستخدم للإشعارات
    const userPreferences = await this.getUserNotificationPreferences(notification.userId);
    
    // إرسال داخل التطبيق (دائماً مفعل)
    results.push({
      success: true,
      channel: 'in_app'
    });

    // إرسال عبر البريد الإلكتروني إذا كان مفعلاً
    if (userPreferences.emailNotifications && this.shouldSendEmail(notification.notificationType, userPreferences)) {
      try {
        await this.sendEmailNotification(notification);
        results.push({
          success: true,
          channel: 'email'
        });
      } catch (error: any) {
        results.push({
          success: false,
          channel: 'email',
          error: error.message
        });
      }
    }

    // إرسال إشعار push إذا كان مفعلاً
    if (userPreferences.pushNotifications) {
      try {
        await this.sendPushNotification(notification);
        results.push({
          success: true,
          channel: 'push'
        });
      } catch (error: any) {
        results.push({
          success: false,
          channel: 'push',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * تحديث حالة الإشعار إلى مقروء
   * Validates: Requirements 8.5
   */
  async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    try {
      // التحقق من أن الإشعار ينتمي للمستخدم
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      if (!existingNotification) {
        throw new Error('Notification not found or access denied');
      }

      // تحديث حالة الإشعار
      const updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return updatedNotification;
    } catch (error: any) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * الحصول على إشعارات المستخدم مع الفلترة والترقيم
   * Validates: Requirements 8.4
   */
  async getUserNotifications(filters: NotificationFilters): Promise<PaginatedNotifications> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.notificationType) {
        where.notificationType = filters.notificationType;
      }

      if (filters.isRead !== undefined) {
        where.isRead = filters.isRead;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.sentAt = {};
        if (filters.dateFrom) {
          where.sentAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.sentAt.lte = filters.dateTo;
        }
      }

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { sentAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.notification.count({ where })
      ]);

      return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  /**
   * تخصيص تفضيلات الإشعارات للمستخدم
   * Validates: Requirements 8.3
   */
  async updateNotificationPreferences(userId: number, preferences: Partial<any>): Promise<void> {
    try {
      // في التطبيق الحقيقي، ستكون هناك جدول منفصل لتفضيلات الإشعارات
      // هنا نستخدم محاكاة بسيطة
      
      // يمكن حفظ التفضيلات في جدول user_preferences أو في metadata للمستخدم
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          // يمكن إضافة حقل metadata لحفظ التفضيلات
          // metadata: preferences
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  }

  /**
   * إرسال إشعارات جماعية للمستخدمين
   */
  async sendBulkNotifications(notifications: CreateNotificationDto[]): Promise<Notification[]> {
    try {
      const createdNotifications = await Promise.all(
        notifications.map(notification => this.sendNotification(notification))
      );

      return createdNotifications;
    } catch (error: any) {
      throw new Error(`Failed to send bulk notifications: ${error.message}`);
    }
  }

  /**
   * حذف الإشعارات القديمة (تنظيف دوري)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.notification.deleteMany({
        where: {
          sentAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      });

      return result.count;
    } catch (error: any) {
      throw new Error(`Failed to cleanup old notifications: ${error.message}`);
    }
  }

  /**
   * الحصول على عدد الإشعارات غير المقروءة
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error: any) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  // Helper methods

  private async getUserNotificationPreferences(userId: number): Promise<any> {
    // محاكاة تفضيلات المستخدم - في التطبيق الحقيقي ستأتي من قاعدة البيانات
    return {
      emailNotifications: true,
      pushNotifications: true,
      assignmentReminders: true,
      gradeNotifications: true,
      achievementNotifications: true,
      systemNotifications: true
    };
  }

  private shouldSendEmail(notificationType: NotificationType, preferences: any): boolean {
    switch (notificationType) {
      case 'assignment':
        return preferences.assignmentReminders;
      case 'grade':
        return preferences.gradeNotifications;
      case 'achievement':
        return preferences.achievementNotifications;
      case 'system':
        return preferences.systemNotifications;
      default:
        return true;
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // محاكاة إرسال البريد الإلكتروني
    // في التطبيق الحقيقي، ستستخدم خدمة بريد إلكتروني مثل SendGrid أو AWS SES
    console.log(`Sending email notification to user ${notification.userId}: ${notification.title}`);
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // محاكاة إرسال إشعار push
    // في التطبيق الحقيقي، ستستخدم خدمة مثل Firebase Cloud Messaging
    console.log(`Sending push notification to user ${notification.userId}: ${notification.title}`);
  }
}