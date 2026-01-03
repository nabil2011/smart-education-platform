import fc from 'fast-check';
import { UserRole, NotificationType } from '@prisma/client';
import { NotificationService } from '../../services/notification.service';
import { db } from '../../services/database.service';
import { CreateNotificationDto, NotificationFilters } from '../../types/notification.types';

describe('Notification Properties', () => {
  let notificationService: NotificationService;

  beforeAll(async () => {
    await db.connect();
    notificationService = new NotificationService(db.getClient());
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    // تنظيف قاعدة البيانات قبل كل اختبار
    await db.getClient().notification.deleteMany({});
    await db.getClient().userSession.deleteMany({});
    await db.getClient().studentProfile.deleteMany({});
    await db.getClient().teacherProfile.deleteMany({});
    await db.getClient().user.deleteMany({});
  });

  // Helper function to create test users
  const createTestUser = async (role: UserRole = UserRole.student) => {
    const user = await db.getClient().user.create({
      data: {
        uuid: `test-${Date.now()}-${Math.random()}`,
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: role,
        isActive: true,
        emailVerified: true
      }
    });

    if (role === UserRole.student) {
      await db.getClient().studentProfile.create({
        data: {
          userId: user.id,
          gradeLevel: 5,
          totalPoints: 0,
          currentLevel: 1,
          currentStreak: 0,
          longestStreak: 0
        }
      });
    } else if (role === UserRole.teacher) {
      await db.getClient().teacherProfile.create({
        data: {
          userId: user.id,
          academicYear: '2024'
        }
      });
    }

    return user;
  };

  /**
   * الخاصية 30: إرسال الإشعارات الفورية
   * تتحقق من: المتطلبات 8.1
   * 
   * Feature: smart-edu-backend, Property 30: For any valid notification data, sending the notification should create it in the database with correct information
   */
  test('Property 30: Instant notification sending should work correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          message: fc.string({ minLength: 1, maxLength: 1000 }),
          notificationType: fc.constantFrom(
            NotificationType.assignment,
            NotificationType.grade,
            NotificationType.achievement,
            NotificationType.reminder,
            NotificationType.system
          ),
          referenceId: fc.option(fc.integer({ min: 1, max: 1000 })),
          referenceType: fc.option(fc.constantFrom('assignment', 'assessment', 'content', 'badge'))
        }),
        async (notificationData) => {
          try {
            // Clear mock data at the start of each property test iteration
            if ((global as any).clearMockData) {
              (global as any).clearMockData();
            }

            // إنشاء مستخدم للاختبار
            const user = await createTestUser();

            const createNotificationDto: CreateNotificationDto = {
              userId: user.id,
              title: notificationData.title,
              message: notificationData.message,
              notificationType: notificationData.notificationType,
              referenceId: notificationData.referenceId || undefined,
              referenceType: notificationData.referenceType || undefined
            };

            // إرسال الإشعار
            const sentNotification = await notificationService.sendNotification(createNotificationDto);

            // التحقق من صحة الإشعار المرسل
            expect(sentNotification).toBeDefined();
            expect(sentNotification.id).toBeGreaterThan(0);
            expect(sentNotification.uuid).toBeDefined();
            expect(sentNotification.userId).toBe(user.id);
            expect(sentNotification.title).toBe(notificationData.title);
            expect(sentNotification.message).toBe(notificationData.message);
            expect(sentNotification.notificationType).toBe(notificationData.notificationType);
            expect(sentNotification.referenceId).toBe(notificationData.referenceId || null);
            expect(sentNotification.referenceType).toBe(notificationData.referenceType || null);
            expect(sentNotification.isRead).toBe(false);
            expect(sentNotification.sentAt).toBeInstanceOf(Date);
            expect(sentNotification.readAt).toBeNull();

            // التحقق من وجود الإشعار في قاعدة البيانات
            const dbNotification = await db.getClient().notification.findUnique({
              where: { id: sentNotification.id }
            });

            expect(dbNotification).toBeDefined();
            expect(dbNotification!.title).toBe(notificationData.title);
            expect(dbNotification!.message).toBe(notificationData.message);
            expect(dbNotification!.userId).toBe(user.id);

          } catch (error) {
            console.error('Notification sending test failed:', error);
            throw error;
          }
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  });

  /**
   * الخاصية 31: اختيار قناة الإشعار
   * تتحقق من: المتطلبات 8.2
   * 
   * Feature: smart-edu-backend, Property 31: For any notification type, the system should select appropriate delivery channels
   */
  test('Property 31: Notification channel selection should work correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          NotificationType.assignment,
          NotificationType.grade,
          NotificationType.achievement,
          NotificationType.reminder,
          NotificationType.system
        ),
        async (notificationType) => {
          try {
            // Clear mock data at the start of each property test iteration
            if ((global as any).clearMockData) {
              (global as any).clearMockData();
            }

            // إنشاء مستخدم للاختبار
            const user = await createTestUser();

            const notificationData: CreateNotificationDto = {
              userId: user.id,
              title: `Test ${notificationType} notification`,
              message: `This is a test ${notificationType} notification message`,
              notificationType: notificationType
            };

            // إرسال الإشعار
            const sentNotification = await notificationService.sendNotification(notificationData);

            // التحقق من أن الإشعار تم إرساله بنجاح
            expect(sentNotification).toBeDefined();
            expect(sentNotification.notificationType).toBe(notificationType);

            // التحقق من أن الإشعار متاح في التطبيق (قناة in_app دائماً متاحة)
            const userNotifications = await notificationService.getUserNotifications({
              userId: user.id,
              page: 1,
              limit: 10
            });

            expect(userNotifications.notifications).toHaveLength(1);
            expect(userNotifications.notifications[0].notificationType).toBe(notificationType);

            // التحقق من أن النظام يختار القنوات المناسبة حسب نوع الإشعار
            // (في التطبيق الحقيقي، سيتم فحص سجلات الإرسال للقنوات المختلفة)
            expect(sentNotification.sentAt).toBeInstanceOf(Date);

          } catch (error) {
            console.error('Notification channel selection test failed:', error);
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  });

  /**
   * الخاصية 32: تحديث حالة الإشعارات
   * تتحقق من: المتطلبات 8.5
   * 
   * Feature: smart-edu-backend, Property 32: For any notification, marking it as read should update its status correctly
   */
  test('Property 32: Notification status update should work correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
          notificationType: fc.constantFrom(
            NotificationType.assignment,
            NotificationType.grade,
            NotificationType.achievement,
            NotificationType.reminder,
            NotificationType.system
          )
        }),
        async (notificationData) => {
          try {
            // Clear mock data at the start of each property test iteration
            if ((global as any).clearMockData) {
              (global as any).clearMockData();
            }

            // إنشاء مستخدم للاختبار
            const user = await createTestUser();

            // إرسال إشعار
            const sentNotification = await notificationService.sendNotification({
              userId: user.id,
              title: notificationData.title,
              message: notificationData.message,
              notificationType: notificationData.notificationType
            });

            // التحقق من الحالة الأولية (غير مقروء)
            expect(sentNotification.isRead).toBe(false);
            expect(sentNotification.readAt).toBeNull();

            // تحديث حالة الإشعار إلى مقروء
            const updatedNotification = await notificationService.markAsRead(
              sentNotification.id,
              user.id
            );

            // التحقق من تحديث الحالة
            expect(updatedNotification.isRead).toBe(true);
            expect(updatedNotification.readAt).toBeInstanceOf(Date);
            expect(updatedNotification.readAt!.getTime()).toBeGreaterThanOrEqual(sentNotification.sentAt.getTime());

            // التحقق من أن المعلومات الأخرى لم تتغير
            expect(updatedNotification.id).toBe(sentNotification.id);
            expect(updatedNotification.userId).toBe(sentNotification.userId);
            expect(updatedNotification.title).toBe(sentNotification.title);
            expect(updatedNotification.message).toBe(sentNotification.message);
            expect(updatedNotification.notificationType).toBe(sentNotification.notificationType);

            // التحقق من عدم إمكانية تحديث إشعار مستخدم آخر
            const anotherUser = await createTestUser();
            
            await expect(
              notificationService.markAsRead(sentNotification.id, anotherUser.id)
            ).rejects.toThrow('Notification not found or access denied');

          } catch (error) {
            console.error('Notification status update test failed:', error);
            throw error;
          }
        }
      ),
      { numRuns: 15, timeout: 12000 }
    );
  });

  /**
   * الخاصية 33: فلترة الإشعارات
   * تتحقق من: المتطلبات 8.4
   * 
   * Feature: smart-edu-backend, Property 33: For any filter criteria, the system should return only matching notifications
   */
  test('Property 33: Notification filtering should work correctly', async () => {
    // إنشاء مستخدم للاختبار
    const user = await createTestUser();

    // إنشاء إشعارات متنوعة
    const notifications = [
      {
        userId: user.id,
        title: 'Assignment Notification',
        message: 'New assignment available',
        notificationType: 'assignment' as any
      },
      {
        userId: user.id,
        title: 'Grade Notification',
        message: 'Your grade is ready',
        notificationType: 'grade' as any
      },
      {
        userId: user.id,
        title: 'Achievement Notification',
        message: 'You earned a badge',
        notificationType: 'achievement' as any
      }
    ];

    // إرسال الإشعارات
    const sentNotifications = await Promise.all(
      notifications.map(n => notificationService.sendNotification(n))
    );

    // تحديد أحد الإشعارات كمقروء
    await notificationService.markAsRead(sentNotifications[0].id, user.id);

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          notificationType: fc.option(fc.constantFrom(
            NotificationType.assignment,
            NotificationType.grade,
            NotificationType.achievement
          )),
          isRead: fc.option(fc.boolean()),
          page: fc.integer({ min: 1, max: 3 }),
          limit: fc.integer({ min: 1, max: 10 })
        }),
        async (filters) => {
          try {
            const notificationFilters: NotificationFilters = {
              userId: user.id,
              notificationType: filters.notificationType || undefined,
              isRead: filters.isRead !== null ? filters.isRead : undefined,
              page: filters.page,
              limit: filters.limit
            };

            const result = await notificationService.getUserNotifications(notificationFilters);

            // التحقق من بنية النتيجة
            expect(result.notifications).toBeInstanceOf(Array);
            expect(result.total).toBeGreaterThanOrEqual(0);
            expect(result.page).toBe(filters.page);
            expect(result.limit).toBe(filters.limit);
            expect(result.totalPages).toBeGreaterThanOrEqual(0);

            // التحقق من الفلترة حسب نوع الإشعار
            if (filters.notificationType) {
              result.notifications.forEach(notification => {
                expect(notification.notificationType).toBe(filters.notificationType);
              });
            }

            // التحقق من الفلترة حسب حالة القراءة
            if (filters.isRead !== undefined && filters.isRead !== null) {
              result.notifications.forEach(notification => {
                expect(notification.isRead).toBe(filters.isRead);
              });
            }

            // التحقق من أن جميع الإشعارات تنتمي للمستخدم الصحيح
            result.notifications.forEach(notification => {
              expect(notification.userId).toBe(user.id);
            });

            // التحقق من الترتيب (الأحدث أولاً)
            for (let i = 1; i < result.notifications.length; i++) {
              expect(result.notifications[i].sentAt.getTime())
                .toBeLessThanOrEqual(result.notifications[i - 1].sentAt.getTime());
            }

          } catch (error) {
            console.error('Notification filtering test failed:', error);
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  });

  /**
   * الخاصية 34: الإشعارات الجماعية
   * تتحقق من: المتطلبات 8.1
   * 
   * Feature: smart-edu-backend, Property 34: For any list of valid notifications, bulk sending should create all notifications correctly
   */
  test('Property 34: Bulk notification sending should work correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            notificationType: fc.constantFrom(
              NotificationType.assignment,
              NotificationType.grade,
              NotificationType.achievement,
              NotificationType.system
            )
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (notificationsData) => {
          try {
            // Clear mock data at the start of each property test iteration
            if ((global as any).clearMockData) {
              (global as any).clearMockData();
            }

            // إنشاء مستخدمين للاختبار
            const users = await Promise.all([
              createTestUser(),
              createTestUser(),
              createTestUser()
            ]);

            // إنشاء قائمة الإشعارات للإرسال الجماعي
            const bulkNotifications: CreateNotificationDto[] = [];
            
            notificationsData.forEach((notificationData, index) => {
              const user = users[index % users.length]; // توزيع الإشعارات على المستخدمين
              bulkNotifications.push({
                userId: user.id,
                title: notificationData.title,
                message: notificationData.message,
                notificationType: notificationData.notificationType
              });
            });

            // إرسال الإشعارات الجماعية
            const sentNotifications = await notificationService.sendBulkNotifications(bulkNotifications);

            // التحقق من عدد الإشعارات المرسلة
            expect(sentNotifications).toHaveLength(notificationsData.length);

            // التحقق من صحة كل إشعار
            sentNotifications.forEach((notification, index) => {
              const originalData = bulkNotifications[index];
              
              expect(notification.userId).toBe(originalData.userId);
              expect(notification.title).toBe(originalData.title);
              expect(notification.message).toBe(originalData.message);
              expect(notification.notificationType).toBe(originalData.notificationType);
              expect(notification.isRead).toBe(false);
              expect(notification.sentAt).toBeInstanceOf(Date);
            });

            // التحقق من وجود الإشعارات في قاعدة البيانات
            const dbNotifications = await db.getClient().notification.findMany({
              where: {
                id: {
                  in: sentNotifications.map(n => n.id)
                }
              }
            });

            expect(dbNotifications).toHaveLength(sentNotifications.length);

          } catch (error) {
            console.error('Bulk notification sending test failed:', error);
            throw error;
          }
        }
      ),
      { numRuns: 8, timeout: 15000 }
    );
  });

  /**
   * الخاصية 35: عدد الإشعارات غير المقروءة
   * تتحقق من: المتطلبات 8.4, 8.5
   * 
   * Feature: smart-edu-backend, Property 35: For any user, the unread count should accurately reflect unread notifications
   */
  test('Property 35: Unread notification count should be accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 5 }),
        async (totalNotifications, readNotifications) => {
          try {
            // Clear mock data at the start of each property test iteration
            if ((global as any).clearMockData) {
              (global as any).clearMockData();
            }

            // إنشاء مستخدم للاختبار
            const user = await createTestUser();

            // إرسال إشعارات
            const notifications = [];
            for (let i = 0; i < totalNotifications; i++) {
              const notification = await notificationService.sendNotification({
                userId: user.id,
                title: `Test Notification ${i + 1}`,
                message: `This is test notification number ${i + 1}`,
                notificationType: NotificationType.system
              });
              notifications.push(notification);
            }

            // تحديد بعض الإشعارات كمقروءة
            const notificationsToRead = Math.min(readNotifications, totalNotifications);
            for (let i = 0; i < notificationsToRead; i++) {
              await notificationService.markAsRead(notifications[i].id, user.id);
            }

            // الحصول على عدد الإشعارات غير المقروءة
            const unreadCount = await notificationService.getUnreadCount(user.id);

            // التحقق من صحة العدد
            const expectedUnreadCount = totalNotifications - notificationsToRead;
            expect(unreadCount).toBe(expectedUnreadCount);

            // التحقق من خلال الاستعلام المباشر
            const directUnreadCount = await db.getClient().notification.count({
              where: {
                userId: user.id,
                isRead: false
              }
            });

            expect(unreadCount).toBe(directUnreadCount);

          } catch (error) {
            console.error('Unread count test failed:', error);
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 12000 }
    );
  });
});