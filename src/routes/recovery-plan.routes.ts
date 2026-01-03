import { Router, Request, Response } from 'express';
import { RecoveryPlanService } from '../services/recovery-plan.service';
import { db } from '../services/database.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  CreateRecoveryPlanDto, 
  UpdateRecoveryPlanDto, 
  RecoveryPlanFilters,
  AssignPlanDto,
  UpdateProgressDto,
  ProgressFilters
} from '../types/recovery-enhancement.types';

const router = Router();
const recoveryPlanService = new RecoveryPlanService(db.getClient());

// جميع المسارات تتطلب مصادقة
router.use(authenticate);

/**
 * @swagger
 * /api/v1/recovery-plans:
 *   get:
 *     summary: الحصول على قائمة خطط التعويض
 *     description: استرجاع قائمة خطط التعويض مع إمكانية الفلترة والترقيم
 *     tags: [Recovery Plans]
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
 *         name: weekNumber
 *         schema:
 *           type: integer
 *         description: رقم الأسبوع للفلترة
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
 *         description: قائمة خطط التعويض
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedRecoveryPlans'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: RecoveryPlanFilters = {
      subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
      gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
      weekNumber: req.query.weekNumber ? parseInt(req.query.weekNumber as string) : undefined,
      difficulty: req.query.difficulty as any,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await recoveryPlanService.getRecoveryPlans(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans:
 *   post:
 *     summary: إنشاء خطة تعويض جديدة
 *     description: إنشاء خطة تعويض جديدة (معلمين وإداريين فقط)
 *     tags: [Recovery Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecoveryPlanDto'
 *     responses:
 *       201:
 *         description: تم إنشاء خطة التعويض بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecoveryPlan'
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
    const planData: CreateRecoveryPlanDto = req.body;
    const createdBy = (req as any).user.id;

    const newPlan = await recoveryPlanService.createRecoveryPlan(planData, createdBy);
    res.status(201).json({ success: true, data: newPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/{id}:
 *   get:
 *     summary: الحصول على خطة تعويض بالمعرف
 *     description: استرجاع تفاصيل خطة تعويض محددة
 *     tags: [Recovery Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعويض
 *     responses:
 *       200:
 *         description: تفاصيل خطة التعويض
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecoveryPlan'
 *       404:
 *         description: خطة التعويض غير موجودة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const plan = await recoveryPlanService.getRecoveryPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Recovery plan not found' });
    }

    return res.json({ success: true, data: plan });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/{id}:
 *   put:
 *     summary: تحديث خطة تعويض
 *     description: تحديث بيانات خطة تعويض موجودة (معلمين وإداريين فقط)
 *     tags: [Recovery Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعويض
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRecoveryPlanDto'
 *     responses:
 *       200:
 *         description: تم تحديث خطة التعويض بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecoveryPlan'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحيات معلم أو إداري
 *       404:
 *         description: خطة التعويض غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authorize(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const updateData: UpdateRecoveryPlanDto = req.body;

    const updatedPlan = await recoveryPlanService.updateRecoveryPlan(planId, updateData);
    res.json({ success: true, data: updatedPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/{id}:
 *   delete:
 *     summary: حذف خطة تعويض
 *     description: حذف (إلغاء تفعيل) خطة تعويض (إداريين فقط)
 *     tags: [Recovery Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعويض
 *     responses:
 *       200:
 *         description: تم حذف خطة التعويض بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecoveryPlan'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحيات إداري
 *       404:
 *         description: خطة التعويض غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', authorize(['admin']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const deletedPlan = await recoveryPlanService.deleteRecoveryPlan(planId);
    res.json({ success: true, data: deletedPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/{id}/assign:
 *   post:
 *     summary: تعيين خطة تعويض لطالب
 *     description: تعيين خطة تعويض لطالب محدد (معلمين وإداريين فقط)
 *     tags: [Recovery Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف خطة التعويض
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
 *         description: تم تعيين خطة التعويض بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentRecoveryProgress'
 *       400:
 *         description: بيانات غير صحيحة أو تعيين موجود مسبقاً
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحيات معلم أو إداري
 *       404:
 *         description: خطة التعويض غير موجودة
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

    const assignment = await recoveryPlanService.assignRecoveryPlan(assignmentData, assignedBy);
    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/progress:
 *   get:
 *     summary: الحصول على تقدم الطلاب في خطط التعويض
 *     description: استرجاع قائمة تقدم الطلاب في خطط التعويض مع إمكانية الفلترة
 *     tags: [Recovery Plans]
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
 *         description: معرف خطة التعويض للفلترة
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
 *                   $ref: '#/components/schemas/PaginatedRecoveryProgress'
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

    const result = await recoveryPlanService.getStudentProgress(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/progress/{id}:
 *   put:
 *     summary: تحديث تقدم الطالب في خطة التعويض
 *     description: تحديث حالة وتقدم الطالب في خطة التعويض
 *     tags: [Recovery Plans]
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
 *                   $ref: '#/components/schemas/StudentRecoveryProgress'
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

    const updatedProgress = await recoveryPlanService.updateStudentProgress(progressId, updateData);
    res.json({ success: true, data: updatedProgress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/statistics:
 *   get:
 *     summary: الحصول على إحصائيات خطط التعويض
 *     description: استرجاع إحصائيات شاملة لخطط التعويض والتقدم
 *     tags: [Recovery Plans]
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
 *         description: إحصائيات خطط التعويض
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
    const statistics = await recoveryPlanService.getRecoveryPlanStatistics(academicYear);
    res.json({ success: true, data: statistics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/recovery-plans/students/{studentId}/summary:
 *   get:
 *     summary: الحصول على ملخص خطط الطالب
 *     description: استرجاع ملخص شامل لخطط التعويض الخاصة بطالب محدد
 *     tags: [Recovery Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الطالب
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للفلترة
 *     responses:
 *       200:
 *         description: ملخص خطط الطالب
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentPlanSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: الطالب غير موجود
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/students/:studentId/summary', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const academicYear = req.query.academicYear as string;
    
    const summary = await recoveryPlanService.getStudentPlanSummary(studentId, academicYear);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;