import { Router, Request, Response } from 'express';
import { EnhancementPlanService } from '../services/enhancement-plan.service';
import { db } from '../services/database.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  CreateEnhancementPlanDto, 
  UpdateEnhancementPlanDto, 
  EnhancementPlanFilters,
  AssignPlanDto,
  UpdateProgressDto,
  ProgressFilters
} from '../types/recovery-enhancement.types';

const router = Router();
const enhancementPlanService = new EnhancementPlanService(db.getClient());

// جميع المسارات تتطلب مصادقة
router.use(authenticate);

/**
 * @swagger
 * /api/v1/enhancement-plans:
 *   get:
 *     summary: الحصول على قائمة خطط التعزيز
 *     description: استرجاع قائمة خطط التعزيز مع إمكانية الفلترة والترقيم
 *     tags: [Enhancement Plans]
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
 *         description: المستوى الدراسي للفلترة
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [enrichment, acceleration, talent_development, advanced_skills, creative_thinking, leadership]
 *         description: نوع خطة التعزيز للفلترة
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: مستوى الصعوبة للفلترة
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: حالة النشاط للفلترة
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في العنوان أو الوصف
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
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: قائمة خطط التعزيز
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedEnhancementPlans'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: EnhancementPlanFilters = {
      subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
      gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
      planType: req.query.planType as any,
      difficulty: req.query.difficulty as any,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await enhancementPlanService.getEnhancementPlans(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans:
 *   post:
 *     summary: إنشاء خطة تعزيز جديدة
 *     description: إنشاء خطة تعزيز جديدة (معلمين وإداريين فقط)
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEnhancementPlanDto'
 *     responses:
 *       201:
 *         description: تم إنشاء خطة التعزيز بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnhancementPlan'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحيات معلم أو إداري
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authorize(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const planData: CreateEnhancementPlanDto = req.body;
    const createdBy = (req as any).user.id;

    const newPlan = await enhancementPlanService.createEnhancementPlan(planData, createdBy);
    res.status(201).json({ success: true, data: newPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/{id}:
 *   get:
 *     summary: الحصول على خطة تعزيز بالمعرف
 *     description: استرجاع تفاصيل خطة تعزيز محددة
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعزيز
 *     responses:
 *       200:
 *         description: تفاصيل خطة التعزيز
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnhancementPlan'
 *       404:
 *         description: خطة التعزيز غير موجودة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const plan = await enhancementPlanService.getEnhancementPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Enhancement plan not found' });
    }

    return res.json({ success: true, data: plan });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/{id}:
 *   put:
 *     summary: تحديث خطة تعزيز
 *     description: تحديث بيانات خطة تعزيز موجودة (معلمين وإداريين فقط)
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعزيز
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEnhancementPlanDto'
 *     responses:
 *       200:
 *         description: تم تحديث خطة التعزيز بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnhancementPlan'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحيات معلم أو إداري
 *       404:
 *         description: خطة التعزيز غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authorize(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const updateData: UpdateEnhancementPlanDto = req.body;

    const updatedPlan = await enhancementPlanService.updateEnhancementPlan(planId, updateData);
    res.json({ success: true, data: updatedPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/{id}:
 *   delete:
 *     summary: حذف خطة تعزيز
 *     description: حذف (إلغاء تفعيل) خطة تعزيز (إداريين فقط)
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعزيز
 *     responses:
 *       200:
 *         description: تم حذف خطة التعزيز بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnhancementPlan'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحيات إداري
 *       404:
 *         description: خطة التعزيز غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', authorize(['admin']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const deletedPlan = await enhancementPlanService.deleteEnhancementPlan(planId);
    res.json({ success: true, data: deletedPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/{id}/assign:
 *   post:
 *     summary: تعيين خطة تعزيز لطالب
 *     description: تعيين خطة تعزيز لطالب محدد (معلمين وإداريين فقط)
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعزيز
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, academicYear]
 *             properties:
 *               studentId:
 *                 type: integer
 *                 description: معرف الطالب
 *               academicYear:
 *                 type: string
 *                 description: العام الدراسي
 *               notes:
 *                 type: string
 *                 description: ملاحظات إضافية
 *     responses:
 *       201:
 *         description: تم تعيين خطة التعزيز بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentEnhancementProgress'
 *       400:
 *         description: بيانات غير صحيحة أو تعيين موجود مسبقاً
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحيات معلم أو إداري
 *       404:
 *         description: خطة التعزيز غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/assign', authorize(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const assignmentData: AssignPlanDto = {
      ...req.body,
      planId
    };
    const assignedBy = (req as any).user.id;

    const assignment = await enhancementPlanService.assignEnhancementPlan(assignmentData, assignedBy);
    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/progress:
 *   get:
 *     summary: الحصول على تقدم الطلاب في خطط التعزيز
 *     description: استرجاع قائمة تقدم الطلاب في خطط التعزيز مع إمكانية الفلترة
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         description: معرف الطالب للفلترة
 *       - in: query
 *         name: planId
 *         schema:
 *           type: integer
 *         description: معرف خطة التعزيز للفلترة
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [assigned, in_progress, completed, paused, cancelled]
 *         description: حالة التقدم للفلترة
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للفلترة
 *       - in: query
 *         name: assignedBy
 *         schema:
 *           type: integer
 *         description: معرف المعين للفلترة
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
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: قائمة تقدم الطلاب
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedEnhancementProgress'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const filters: ProgressFilters = {
      studentId: req.query.studentId ? parseInt(req.query.studentId as string) : undefined,
      planId: req.query.planId ? parseInt(req.query.planId as string) : undefined,
      status: req.query.status as any,
      academicYear: req.query.academicYear as string,
      assignedBy: req.query.assignedBy ? parseInt(req.query.assignedBy as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await enhancementPlanService.getStudentProgress(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/progress/{id}:
 *   put:
 *     summary: تحديث تقدم الطالب في خطة التعزيز
 *     description: تحديث حالة وتقدم الطالب في خطة التعزيز
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف تقدم الطالب
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProgressDto'
 *     responses:
 *       200:
 *         description: تم تحديث التقدم بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentEnhancementProgress'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: تقدم الطالب غير موجود
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/progress/:id', async (req: Request, res: Response) => {
  try {
    const progressId = parseInt(req.params.id);
    const updateData: UpdateProgressDto = req.body;

    const updatedProgress = await enhancementPlanService.updateStudentProgress(progressId, updateData);
    res.json({ success: true, data: updatedProgress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/statistics:
 *   get:
 *     summary: الحصول على إحصائيات خطط التعزيز
 *     description: استرجاع إحصائيات شاملة لخطط التعزيز والتقدم
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للفلترة
 *     responses:
 *       200:
 *         description: إحصائيات خطط التعزيز
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PlanStatistics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics', authorize(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const academicYear = req.query.academicYear as string;
    const statistics = await enhancementPlanService.getEnhancementPlanStatistics(academicYear);
    res.json({ success: true, data: statistics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/enhancement-plans/{id}/effectiveness:
 *   get:
 *     summary: الحصول على تقرير فعالية خطة التعزيز
 *     description: استرجاع تقرير مفصل عن فعالية خطة تعزيز محددة
 *     tags: [Enhancement Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعزيز
 *     responses:
 *       200:
 *         description: تقرير فعالية خطة التعزيز
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PlanEffectivenessReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: خطة التعزيز غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/effectiveness', authorize(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const report = await enhancementPlanService.getPlanEffectivenessReport(planId);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;