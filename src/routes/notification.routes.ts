import { Router, Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../services/notification.service';
import { db } from '../services/database.service';
import { authenticate } from '../middleware/auth.middleware';
import { CreateNotificationDto, NotificationFilters } from '../types/notification.types';

const router = Router();
const notificationService = new NotificationService(db.getClient());

// جميع المسارات تتطلب مصادقة
router.use(authenticate);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: الحصول على إشعارات المستخدم
 *     description: استرجاع إشعارات المستخدم الحالي مع إمكانية الفلترة والترقيم
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [assignment, grade, achievement, reminder, system]
 *         description: نوع الإشعار للفلترة
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: حالة القراءة للفلترة
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: عدد الإشعارات في الصفحة
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية للفلترة
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية للفلترة
 *     responses:
 *       200:
 *         description: قائمة الإشعارات
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const filters: NotificationFilters = {
      userId,
      notificationType: req.query.type as NotificationType,
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    if (req.query.dateFrom) {
      filters.dateFrom = new Date(req.query.dateFrom as string);
    }

    if (req.query.dateTo) {
      filters.dateTo = new Date(req.query.dateTo as string);
    }

    const result = await notificationService.getUserNotifications(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: الحصول على عدد الإشعارات غير المقروءة
 *     description: استرجاع عدد الإشعارات غير المقروءة للمستخدم الحالي
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: عدد الإشعارات غير المقروءة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/unread-count', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: تحديد الإشعار كمقروء
 *     description: تحديث حالة الإشعار إلى مقروء للمستخدم الحالي
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الإشعار
 *     responses:
 *       200:
 *         description: تم تحديث الإشعار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: معرف إشعار غير صحيح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: الإشعار غير موجود أو غير مسموح بالوصول إليه
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(notificationId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
      return;
    }

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: إرسال إشعار جديد
 *     description: إرسال إشعار جديد (للمعلمين والإداريين فقط)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *               - notificationType
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: معرف المستخدم المستلم
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: عنوان الإشعار
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: محتوى الإشعار
 *               notificationType:
 *                 type: string
 *                 enum: [assignment, grade, achievement, reminder, system]
 *                 description: نوع الإشعار
 *               referenceId:
 *                 type: integer
 *                 description: معرف المرجع (اختياري)
 *               referenceType:
 *                 type: string
 *                 description: نوع المرجع (اختياري)
 *     responses:
 *       201:
 *         description: تم إرسال الإشعار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط المعلمين والإداريين
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    
    // التحقق من الصلاحيات - فقط المعلمين والإداريين يمكنهم إرسال إشعارات
    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and admins can send notifications.'
      });
      return;
    }

    const notificationData: CreateNotificationDto = {
      userId: req.body.userId,
      title: req.body.title,
      message: req.body.message,
      notificationType: req.body.notificationType,
      referenceId: req.body.referenceId,
      referenceType: req.body.referenceType
    };

    // التحقق من صحة البيانات
    if (!notificationData.userId || !notificationData.title || !notificationData.message || !notificationData.notificationType) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, title, message, notificationType'
      });
      return;
    }

    const notification = await notificationService.sendNotification(notificationData);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/bulk:
 *   post:
 *     summary: إرسال إشعارات جماعية
 *     description: إرسال إشعارات جماعية لعدة مستخدمين (للإداريين فقط)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - userId
 *                     - title
 *                     - message
 *                     - notificationType
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     title:
 *                       type: string
 *                       maxLength: 255
 *                     message:
 *                       type: string
 *                       maxLength: 1000
 *                     notificationType:
 *                       type: string
 *                       enum: [assignment, grade, achievement, reminder, system]
 *                     referenceId:
 *                       type: integer
 *                     referenceType:
 *                       type: string
 *     responses:
 *       201:
 *         description: تم إرسال الإشعارات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/bulk', async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    
    // التحقق من الصلاحيات - فقط الإداريين يمكنهم إرسال إشعارات جماعية
    if (currentUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can send bulk notifications.'
      });
      return;
    }

    const notifications: CreateNotificationDto[] = req.body.notifications;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid notifications array'
      });
      return;
    }

    // التحقق من صحة كل إشعار
    for (const notification of notifications) {
      if (!notification.userId || !notification.title || !notification.message || !notification.notificationType) {
        res.status(400).json({
          success: false,
          message: 'Each notification must have userId, title, message, and notificationType'
        });
        return;
      }
    }

    const createdNotifications = await notificationService.sendBulkNotifications(notifications);

    res.status(201).json({
      success: true,
      data: createdNotifications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   put:
 *     summary: تحديث تفضيلات الإشعارات
 *     description: تحديث تفضيلات الإشعارات للمستخدم الحالي
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *                 description: تفعيل إشعارات البريد الإلكتروني
 *               pushNotifications:
 *                 type: boolean
 *                 description: تفعيل الإشعارات المنبثقة
 *               assignmentReminders:
 *                 type: boolean
 *                 description: تفعيل تذكيرات الواجبات
 *               gradeNotifications:
 *                 type: boolean
 *                 description: تفعيل إشعارات الدرجات
 *               achievementNotifications:
 *                 type: boolean
 *                 description: تفعيل إشعارات الإنجازات
 *               systemNotifications:
 *                 type: boolean
 *                 description: تفعيل إشعارات النظام
 *     responses:
 *       200:
 *         description: تم تحديث التفضيلات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification preferences updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const preferences = req.body;

    await notificationService.updateNotificationPreferences(userId, preferences);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/cleanup:
 *   delete:
 *     summary: تنظيف الإشعارات القديمة
 *     description: حذف الإشعارات القديمة المقروءة (للإداريين فقط)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysOld
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 30
 *         description: عدد الأيام لاعتبار الإشعار قديماً
 *     responses:
 *       200:
 *         description: تم تنظيف الإشعارات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 25
 *       400:
 *         description: معامل daysOld غير صحيح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/cleanup', async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    
    // التحقق من الصلاحيات - فقط الإداريين
    if (currentUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can cleanup notifications.'
      });
      return;
    }

    const daysOld = req.query.daysOld ? parseInt(req.query.daysOld as string) : 30;
    
    if (isNaN(daysOld) || daysOld < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid daysOld parameter'
      });
      return;
    }

    const deletedCount = await notificationService.cleanupOldNotifications(daysOld);

    res.json({
      success: true,
      data: { deletedCount }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;