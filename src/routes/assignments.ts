import { Router } from 'express';
import { assignmentService } from '../services/assignment.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  AssignmentFilters,
  SubmissionFilters,
  AssignmentType
} from '../types/assignment.types';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();

// تطبيق middleware المصادقة على جميع المسارات
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         uuid:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         instructions:
 *           type: string
 *         subjectId:
 *           type: integer
 *         gradeLevel:
 *           type: integer
 *         assignmentType:
 *           type: string
 *           enum: [homework, project, quiz, essay, presentation, lab_work]
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         maxScore:
 *           type: integer
 *         allowLateSubmission:
 *           type: boolean
 *         latePenalty:
 *           type: integer
 *         isPublished:
 *           type: boolean
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     AssignmentSubmission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         assignmentId:
 *           type: integer
 *         studentId:
 *           type: integer
 *         submissionText:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         isLate:
 *           type: boolean
 *         score:
 *           type: integer
 *         feedback:
 *           type: string
 *         gradedBy:
 *           type: integer
 *         gradedAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [submitted, graded, returned, late, missing]
 *     
 *     CreateAssignmentDto:
 *       type: object
 *       required:
 *         - title
 *         - subjectId
 *         - gradeLevel
 *         - assignmentType
 *         - dueDate
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         instructions:
 *           type: string
 *         subjectId:
 *           type: integer
 *         gradeLevel:
 *           type: integer
 *         assignmentType:
 *           type: string
 *           enum: [homework, project, quiz, essay, presentation, lab_work]
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         maxScore:
 *           type: integer
 *           default: 100
 *         allowLateSubmission:
 *           type: boolean
 *           default: false
 *         latePenalty:
 *           type: integer
 *     
 *     SubmitAssignmentDto:
 *       type: object
 *       properties:
 *         submissionText:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *     
 *     GradeSubmissionDto:
 *       type: object
 *       required:
 *         - score
 *       properties:
 *         score:
 *           type: integer
 *           minimum: 0
 *         feedback:
 *           type: string
 */

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: الحصول على قائمة الواجبات مع الفلترة
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: معرف المادة
 *       - in: query
 *         name: gradeLevel
 *         schema:
 *           type: integer
 *         description: المستوى الدراسي
 *       - in: query
 *         name: assignmentType
 *         schema:
 *           type: string
 *           enum: [homework, project, quiz, essay, presentation, lab_work]
 *         description: نوع الواجب
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: حالة النشر
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في العنوان والوصف
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: قائمة الواجبات
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     assignments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Assignment'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const filters: AssignmentFilters = {
      subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
      gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
      assignmentType: req.query.assignmentType as AssignmentType,
      isPublished: req.query.isPublished ? req.query.isPublished === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    // إذا كان المستخدم معلم، عرض واجباته فقط
    if (req.user?.role === 'teacher') {
      filters.createdBy = req.user.id;
    }

    const result = await assignmentService.getAssignments(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: إنشاء واجب جديد
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssignmentDto'
 *     responses:
 *       201:
 *         description: تم إنشاء الواجب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 */
router.post('/', authorize(['teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const assignmentData: CreateAssignmentDto = req.body;
    
    // التحقق من صحة البيانات
    if (!assignmentData.title || !assignmentData.subjectId || !assignmentData.gradeLevel || 
        !assignmentData.assignmentType || !assignmentData.dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const assignment = await assignmentService.createAssignment(assignmentData, req.user!.id);

    return res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: الحصول على واجب بالمعرف
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الواجب
 *     responses:
 *       200:
 *         description: تفاصيل الواجب
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 */
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const assignment = await assignmentService.getAssignmentById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    return res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: تحديث واجب موجود
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الواجب
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssignmentDto'
 *     responses:
 *       200:
 *         description: تم تحديث الواجب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 */
router.put('/:id', authorize(['teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: UpdateAssignmentDto = req.body;

    const assignment = await assignmentService.updateAssignment(id, updates, req.user!.id);

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bad request'
    });
  }
});

/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     summary: حذف واجب
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الواجب
 *     responses:
 *       200:
 *         description: تم حذف الواجب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/:id', authorize(['teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await assignmentService.deleteAssignment(id, req.user!.id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bad request'
    });
  }
});

/**
 * @swagger
 * /api/assignments/{id}/publish:
 *   post:
 *     summary: نشر واجب
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الواجب
 *     responses:
 *       200:
 *         description: تم نشر الواجب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 */
router.post('/:id/publish', authorize(['teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const assignment = await assignmentService.publishAssignment(id, req.user!.id);

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bad request'
    });
  }
});

/**
 * @swagger
 * /api/assignments/{id}/submit:
 *   post:
 *     summary: تسليم واجب من قبل طالب
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الواجب
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAssignmentDto'
 *     responses:
 *       201:
 *         description: تم تسليم الواجب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssignmentSubmission'
 */
router.post('/:id/submit', authorize(['student']), async (req: AuthenticatedRequest, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const submissionData: SubmitAssignmentDto = req.body;

    const submission = await assignmentService.submitAssignment(
      assignmentId,
      req.user!.id,
      submissionData
    );

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bad request'
    });
  }
});

/**
 * @swagger
 * /api/assignments/{id}/submissions:
 *   get:
 *     summary: الحصول على تسليمات واجب معين
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الواجب
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, graded, returned, late, missing]
 *         description: حالة التسليم
 *       - in: query
 *         name: isLate
 *         schema:
 *           type: boolean
 *         description: التسليمات المتأخرة
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: قائمة التسليمات
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AssignmentSubmission'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/:id/submissions', authorize(['teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const filters: SubmissionFilters = {
      status: req.query.status as any,
      isLate: req.query.isLate ? req.query.isLate === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await assignmentService.getAssignmentSubmissions(assignmentId, filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/assignments/submissions/{submissionId}/grade:
 *   post:
 *     summary: تقييم تسليم واجب
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف التسليم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GradeSubmissionDto'
 *     responses:
 *       200:
 *         description: تم تقييم التسليم بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssignmentSubmission'
 */
router.post('/submissions/:submissionId/grade', authorize(['teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const submissionId = parseInt(req.params.submissionId);
    const gradeData: GradeSubmissionDto = req.body;

    if (typeof gradeData.score !== 'number' || gradeData.score < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid score value'
      });
    }

    const submission = await assignmentService.gradeSubmission(
      submissionId,
      req.user!.id,
      gradeData
    );

    return res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bad request'
    });
  }
});

/**
 * @swagger
 * /api/assignments/my-submissions:
 *   get:
 *     summary: الحصول على تسليمات الطالب
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, graded, returned, late, missing]
 *         description: حالة التسليم
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: قائمة تسليمات الطالب
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AssignmentSubmission'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/my-submissions', authorize(['student']), async (req: AuthenticatedRequest, res) => {
  try {
    const filters: SubmissionFilters = {
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await assignmentService.getStudentSubmissions(req.user!.id, filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/assignments/stats:
 *   get:
 *     summary: الحصول على إحصائيات الواجبات
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: إحصائيات الواجبات
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAssignments:
 *                       type: integer
 *                     publishedAssignments:
 *                       type: integer
 *                     draftAssignments:
 *                       type: integer
 *                     overdueAssignments:
 *                       type: integer
 *                     totalSubmissions:
 *                       type: integer
 *                     gradedSubmissions:
 *                       type: integer
 *                     pendingSubmissions:
 *                       type: integer
 *                     lateSubmissions:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 */
router.get('/stats', authorize(['teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const createdBy = req.user?.role === 'teacher' ? req.user.id : undefined;
    const stats = await assignmentService.getAssignmentStats(createdBy);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;