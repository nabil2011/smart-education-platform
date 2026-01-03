import { Router, Request, Response } from 'express';
import { ContentService } from '../services/content.service';
import DatabaseService from '../services/database.service';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import {
  CreateContentDto,
  UpdateContentDto,
  ContentFilterDto,
  CreateSubjectDto,
  UpdateSubjectDto,
} from '../types/content.types';

/**
 * @swagger
 * components:
 *   schemas:
 *     ContentType:
 *       type: string
 *       enum: [lesson, video, audio, document, interactive, quiz, story]
 *       description: نوع المحتوى التعليمي
 *     
 *     Difficulty:
 *       type: string
 *       enum: [easy, medium, hard]
 *       description: مستوى صعوبة المحتوى
 *     
 *     CreateContentRequest:
 *       type: object
 *       required:
 *         - title
 *         - contentType
 *         - subjectId
 *         - gradeLevel
 *       properties:
 *         title:
 *           type: string
 *           description: عنوان المحتوى
 *           example: "درس القراءة الأول"
 *         description:
 *           type: string
 *           description: وصف المحتوى
 *           example: "درس تعليمي في القراءة للصف الرابع"
 *         contentType:
 *           $ref: '#/components/schemas/ContentType'
 *         subjectId:
 *           type: integer
 *           description: معرف المادة
 *           example: 1
 *         gradeLevel:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: الصف الدراسي
 *           example: 4
 *         difficulty:
 *           $ref: '#/components/schemas/Difficulty'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: العلامات المرتبطة بالمحتوى
 *           example: ["قراءة", "نحو", "مفردات"]
 *         fileUrl:
 *           type: string
 *           format: uri
 *           description: رابط الملف
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *           description: رابط الصورة المصغرة
 *         duration:
 *           type: integer
 *           description: مدة المحتوى بالدقائق
 *           example: 30
 *     
 *     ContentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: معرف المحتوى
 *         uuid:
 *           type: string
 *           description: المعرف الفريد للمحتوى
 *         title:
 *           type: string
 *           description: عنوان المحتوى
 *         description:
 *           type: string
 *           description: وصف المحتوى
 *         contentType:
 *           $ref: '#/components/schemas/ContentType'
 *         subjectId:
 *           type: integer
 *           description: معرف المادة
 *         subjectName:
 *           type: string
 *           description: اسم المادة
 *         gradeLevel:
 *           type: integer
 *           description: الصف الدراسي
 *         difficulty:
 *           $ref: '#/components/schemas/Difficulty'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: العلامات
 *         fileUrl:
 *           type: string
 *           description: رابط الملف
 *         thumbnailUrl:
 *           type: string
 *           description: رابط الصورة المصغرة
 *         duration:
 *           type: integer
 *           description: مدة المحتوى بالدقائق
 *         viewCount:
 *           type: integer
 *           description: عدد المشاهدات
 *         likeCount:
 *           type: integer
 *           description: عدد الإعجابات
 *         isPublished:
 *           type: boolean
 *           description: حالة النشر
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ النشر
 *         createdBy:
 *           type: integer
 *           description: معرف المنشئ
 *         creatorName:
 *           type: string
 *           description: اسم المنشئ
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *     
 *     CreateSubjectRequest:
 *       type: object
 *       required:
 *         - name
 *         - nameAr
 *         - gradeLevels
 *       properties:
 *         name:
 *           type: string
 *           description: اسم المادة بالإنجليزية
 *           example: "Arabic Language"
 *         nameAr:
 *           type: string
 *           description: اسم المادة بالعربية
 *           example: "اللغة العربية"
 *         description:
 *           type: string
 *           description: وصف المادة
 *         icon:
 *           type: string
 *           description: أيقونة المادة
 *         color:
 *           type: string
 *           description: لون المادة
 *           example: "#FF5722"
 *         gradeLevels:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *             maximum: 12
 *           description: الصفوف الدراسية المدعومة
 *           example: [4, 5, 6]
 *     
 *     SubjectResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: معرف المادة
 *         name:
 *           type: string
 *           description: اسم المادة بالإنجليزية
 *         nameAr:
 *           type: string
 *           description: اسم المادة بالعربية
 *         description:
 *           type: string
 *           description: وصف المادة
 *         icon:
 *           type: string
 *           description: أيقونة المادة
 *         color:
 *           type: string
 *           description: لون المادة
 *         gradeLevels:
 *           type: array
 *           items:
 *             type: integer
 *           description: الصفوف الدراسية المدعومة
 *         isActive:
 *           type: boolean
 *           description: حالة تفعيل المادة
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         contentCount:
 *           type: integer
 *           description: عدد المحتويات في هذه المادة
 *     
 *     ContentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             content:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContentResponse'
 *             total:
 *               type: integer
 *               description: إجمالي عدد المحتويات
 *             page:
 *               type: integer
 *               description: رقم الصفحة الحالية
 *             limit:
 *               type: integer
 *               description: عدد العناصر في الصفحة
 *             totalPages:
 *               type: integer
 *               description: إجمالي عدد الصفحات
 *     
 *     ContentStats:
 *       type: object
 *       properties:
 *         totalContent:
 *           type: integer
 *           description: إجمالي المحتوى
 *         publishedContent:
 *           type: integer
 *           description: المحتوى المنشور
 *         draftContent:
 *           type: integer
 *           description: المحتوى المسودة
 *         totalViews:
 *           type: integer
 *           description: إجمالي المشاهدات
 *         totalLikes:
 *           type: integer
 *           description: إجمالي الإعجابات
 *         contentByType:
 *           type: object
 *           description: المحتوى حسب النوع
 *         contentByGrade:
 *           type: object
 *           description: المحتوى حسب الصف
 *         contentBySubject:
 *           type: object
 *           description: المحتوى حسب المادة
 *     
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: حالة نجاح العملية
 *         message:
 *           type: string
 *           description: رسالة الاستجابة
 *         data:
 *           type: object
 *           description: بيانات الاستجابة
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: رسالة الخطأ
 *           example: "فشل في تنفيذ العملية"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * tags:
 *   - name: Content Management
 *     description: إدارة المحتوى التعليمي
 *   - name: Subject Management
 *     description: إدارة المواد الدراسية
 */

const router = Router();
const databaseService = DatabaseService.getInstance();
const contentService = new ContentService(databaseService.getClient());

/**
 * @swagger
 * /api/v1/content:
 *   post:
 *     summary: إنشاء محتوى تعليمي جديد
 *     description: إنشاء محتوى تعليمي جديد (للمعلمين والمديرين فقط)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContentRequest'
 *     responses:
 *       201:
 *         description: تم إنشاء المحتوى بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentResponse'
 *                 message:
 *                   type: string
 *                   example: "Content created successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 */
// Content routes
router.post('/content', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const data: CreateContentDto = req.body;
    const userId = (req as any).user.id;

    const content = await contentService.createContent(data, userId);
    res.status(201).json({
      success: true,
      data: content,
      message: 'Content created successfully',
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create content',
    });
  }
});

/**
 * @swagger
 * /api/v1/content:
 *   get:
 *     summary: الحصول على قائمة المحتوى التعليمي
 *     description: استرجاع قائمة المحتوى التعليمي مع إمكانية الفلترة والبحث والترتيب
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: معرف المادة للفلترة
 *       - in: query
 *         name: gradeLevel
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: الصف الدراسي للفلترة
 *       - in: query
 *         name: contentType
 *         schema:
 *           $ref: '#/components/schemas/ContentType'
 *         description: نوع المحتوى للفلترة
 *       - in: query
 *         name: difficulty
 *         schema:
 *           $ref: '#/components/schemas/Difficulty'
 *         description: مستوى الصعوبة للفلترة
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: العلامات للفلترة (مفصولة بفواصل)
 *         example: "قراءة,نحو,مفردات"
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: حالة النشر للفلترة
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: نص البحث في العنوان والوصف
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
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, viewCount, likeCount]
 *           default: createdAt
 *         description: حقل الترتيب
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: اتجاه الترتيب
 *     responses:
 *       200:
 *         description: تم استرجاع قائمة المحتوى بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentListResponse'
 *       401:
 *         description: غير مصرح بالوصول
 *       500:
 *         description: خطأ في الخادم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/content', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: ContentFilterDto = {
      subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
      gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
      contentType: req.query.contentType as any,
      difficulty: req.query.difficulty as any,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      isPublished: req.query.isPublished ? req.query.isPublished === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any || 'createdAt',
      sortOrder: req.query.sortOrder as any || 'desc',
    };

    const result = await contentService.getContentList(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get content list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
    });
  }
});

/**
 * @swagger
 * /api/v1/content/{id}:
 *   get:
 *     summary: الحصول على محتوى تعليمي محدد
 *     description: استرجاع تفاصيل محتوى تعليمي محدد بواسطة المعرف مع زيادة عداد المشاهدات
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المحتوى
 *     responses:
 *       200:
 *         description: تم استرجاع المحتوى بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentResponse'
 *       404:
 *         description: المحتوى غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: غير مصرح بالوصول
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/content/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const content = await contentService.getContent(id);

    if (!content) {
      res.status(404).json({
        success: false,
        message: 'Content not found',
      });
      return;
    }

    // Increment view count
    await contentService.incrementViewCount(id);

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
    });
  }
});

/**
 * @swagger
 * /api/v1/content/uuid/{uuid}:
 *   get:
 *     summary: الحصول على محتوى تعليمي بواسطة UUID
 *     description: استرجاع تفاصيل محتوى تعليمي محدد بواسطة المعرف الفريد مع زيادة عداد المشاهدات
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: المعرف الفريد للمحتوى
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: تم استرجاع المحتوى بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentResponse'
 *       404:
 *         description: المحتوى غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: غير مصرح بالوصول
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/content/uuid/:uuid', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const uuid = req.params.uuid;
    const content = await contentService.getContentByUuid(uuid);

    if (!content) {
      res.status(404).json({
        success: false,
        message: 'Content not found',
      });
      return;
    }

    // Increment view count
    await contentService.incrementViewCount(content.id);

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Get content by UUID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
    });
  }
});

/**
 * @swagger
 * /api/v1/content/{id}:
 *   put:
 *     summary: تحديث محتوى تعليمي
 *     description: تحديث محتوى تعليمي موجود (للمعلمين والمديرين فقط، أو منشئ المحتوى)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المحتوى
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان المحتوى
 *               description:
 *                 type: string
 *                 description: وصف المحتوى
 *               contentType:
 *                 $ref: '#/components/schemas/ContentType'
 *               subjectId:
 *                 type: integer
 *                 description: معرف المادة
 *               gradeLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: الصف الدراسي
 *               difficulty:
 *                 $ref: '#/components/schemas/Difficulty'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: العلامات المرتبطة بالمحتوى
 *               fileUrl:
 *                 type: string
 *                 format: uri
 *                 description: رابط الملف
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *                 description: رابط الصورة المصغرة
 *               duration:
 *                 type: integer
 *                 description: مدة المحتوى بالدقائق
 *               isPublished:
 *                 type: boolean
 *                 description: حالة النشر
 *     responses:
 *       200:
 *         description: تم تحديث المحتوى بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentResponse'
 *                 message:
 *                   type: string
 *                   example: "Content updated successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: المحتوى غير موجود
 */
router.put('/content/:id', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateContentDto = req.body;
    const userId = (req as any).user.id;

    const content = await contentService.updateContent(id, data, userId);
    res.json({
      success: true,
      data: content,
      message: 'Content updated successfully',
    });
  } catch (error) {
    console.error('Update content error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update content',
    });
  }
});

/**
 * @swagger
 * /api/v1/content/{id}:
 *   delete:
 *     summary: حذف محتوى تعليمي
 *     description: حذف محتوى تعليمي موجود (للمعلمين والمديرين فقط، أو منشئ المحتوى)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المحتوى
 *     responses:
 *       200:
 *         description: تم حذف المحتوى بنجاح
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
 *                   example: "Content deleted successfully"
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: المحتوى غير موجود
 *       400:
 *         description: فشل في حذف المحتوى
 */
router.delete('/content/:id', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = (req as any).user.id;

    await contentService.deleteContent(id, userId);
    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Delete content error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete content',
    });
  }
});

/**
 * @swagger
 * /api/v1/content/{id}/like:
 *   post:
 *     summary: إعجاب بمحتوى تعليمي
 *     description: إضافة أو إزالة إعجاب من محتوى تعليمي محدد
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المحتوى
 *     responses:
 *       200:
 *         description: تم تسجيل الإعجاب بنجاح
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
 *                     liked:
 *                       type: boolean
 *                       description: حالة الإعجاب
 *                       example: true
 *                     likeCount:
 *                       type: integer
 *                       description: إجمالي عدد الإعجابات
 *                       example: 15
 *                 message:
 *                   type: string
 *                   example: "Content liked successfully"
 *       400:
 *         description: فشل في تسجيل الإعجاب
 *       401:
 *         description: غير مصرح بالوصول
 *       404:
 *         description: المحتوى غير موجود
 */
router.post('/content/:id/like', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const result = await contentService.toggleLike(id, userId);
    res.json({
      success: true,
      data: result,
      message: 'Content liked successfully',
    });
  } catch (error) {
    console.error('Like content error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to like content',
    });
  }
});

/**
 * @swagger
 * /api/v1/content-stats:
 *   get:
 *     summary: الحصول على إحصائيات المحتوى
 *     description: استرجاع إحصائيات شاملة للمحتوى التعليمي (للمديرين فقط)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم استرجاع الإحصائيات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentStats'
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية (مديرين فقط)
 *       500:
 *         description: فشل في استرجاع الإحصائيات
 */
router.get('/content-stats', authenticate, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const stats = await contentService.getContentStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content statistics',
    });
  }
});

/**
 * @swagger
 * /api/v1/subjects:
 *   post:
 *     summary: إنشاء مادة دراسية جديدة
 *     description: إنشاء مادة دراسية جديدة (للمديرين فقط)
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubjectRequest'
 *     responses:
 *       201:
 *         description: تم إنشاء المادة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SubjectResponse'
 *                 message:
 *                   type: string
 *                   example: "Subject created successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية (مديرين فقط)
 */
// Subject routes
router.post('/subjects', authenticate, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const data: CreateSubjectDto = req.body;
    const subject = await contentService.createSubject(data);
    res.status(201).json({
      success: true,
      data: subject,
      message: 'Subject created successfully',
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create subject',
    });
  }
});

/**
 * @swagger
 * /api/v1/subjects:
 *   get:
 *     summary: الحصول على قائمة المواد الدراسية
 *     description: استرجاع قائمة المواد الدراسية مع إمكانية الفلترة حسب الصف
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gradeLevel
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: الصف الدراسي للفلترة
 *     responses:
 *       200:
 *         description: تم استرجاع قائمة المواد بنجاح
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
 *                     $ref: '#/components/schemas/SubjectResponse'
 *       401:
 *         description: غير مصرح بالوصول
 *       500:
 *         description: فشل في استرجاع المواد
 */
router.get('/subjects', authenticate, async (req: Request, res: Response) => {
  try {
    const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined;
    const subjects = await contentService.getSubjectList(gradeLevel);
    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
    });
  }
});

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   get:
 *     summary: الحصول على مادة دراسية محددة
 *     description: استرجاع تفاصيل مادة دراسية محددة بواسطة المعرف
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المادة
 *     responses:
 *       200:
 *         description: تم استرجاع المادة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SubjectResponse'
 *       404:
 *         description: المادة غير موجودة
 *       401:
 *         description: غير مصرح بالوصول
 *       500:
 *         description: فشل في استرجاع المادة
 */
router.get('/subjects/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const subject = await contentService.getSubject(id);

    if (!subject) {
      res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
      return;
    }

    res.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject',
    });
  }
});

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   put:
 *     summary: تحديث مادة دراسية
 *     description: تحديث مادة دراسية موجودة (للمديرين فقط)
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المادة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم المادة بالإنجليزية
 *               nameAr:
 *                 type: string
 *                 description: اسم المادة بالعربية
 *               description:
 *                 type: string
 *                 description: وصف المادة
 *               icon:
 *                 type: string
 *                 description: أيقونة المادة
 *               color:
 *                 type: string
 *                 description: لون المادة
 *               gradeLevels:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 12
 *                 description: الصفوف الدراسية المدعومة
 *               isActive:
 *                 type: boolean
 *                 description: حالة تفعيل المادة
 *     responses:
 *       200:
 *         description: تم تحديث المادة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SubjectResponse'
 *                 message:
 *                   type: string
 *                   example: "Subject updated successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: المادة غير موجودة
 */
router.put('/subjects/:id', authenticate, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateSubjectDto = req.body;
    const subject = await contentService.updateSubject(id, data);
    res.json({
      success: true,
      data: subject,
      message: 'Subject updated successfully',
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update subject',
    });
  }
});

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   delete:
 *     summary: حذف مادة دراسية
 *     description: حذف مادة دراسية موجودة (للمديرين فقط). لا يمكن حذف المادة إذا كانت تحتوي على محتوى
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المادة
 *     responses:
 *       200:
 *         description: تم حذف المادة بنجاح
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
 *                   example: "Subject deleted successfully"
 *       400:
 *         description: لا يمكن حذف المادة (تحتوي على محتوى)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cannot delete subject with existing content"
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: المادة غير موجودة
 */
router.delete('/subjects/:id', authenticate, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await contentService.deleteSubject(id);
    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete subject',
    });
  }
});

export default router;