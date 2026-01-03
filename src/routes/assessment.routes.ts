import { Router, Request, Response } from 'express';
import { AssessmentService } from '../services/assessment.service';
import DatabaseService from '../services/database.service';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  SubmitAnswerDto,
  AssessmentFilterDto,
  BulkCreateQuestionsDto,
} from '../types/assessment.types';

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestionType:
 *       type: string
 *       enum: [multiple_choice, true_false, fill_blank, essay]
 *       description: نوع السؤال
 *     
 *     AttemptStatus:
 *       type: string
 *       enum: [in_progress, completed, submitted, auto_submitted, cancelled]
 *       description: حالة محاولة الاختبار
 *     
 *     CreateAssessmentRequest:
 *       type: object
 *       required:
 *         - title
 *         - subjectId
 *         - gradeLevel
 *         - difficultyLevel
 *         - durationMinutes
 *         - passingScore
 *       properties:
 *         title:
 *           type: string
 *           description: عنوان الاختبار
 *           example: "اختبار القراءة الأول"
 *         description:
 *           type: string
 *           description: وصف الاختبار
 *           example: "اختبار شامل في مهارات القراءة للصف الرابع"
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
 *         difficultyLevel:
 *           $ref: '#/components/schemas/Difficulty'
 *         durationMinutes:
 *           type: integer
 *           minimum: 1
 *           description: مدة الاختبار بالدقائق
 *           example: 60
 *         passingScore:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: الدرجة المطلوبة للنجاح (نسبة مئوية)
 *           example: 60
 *         maxAttempts:
 *           type: integer
 *           minimum: 1
 *           default: 3
 *           description: العدد الأقصى للمحاولات
 *           example: 3
 *         isPublished:
 *           type: boolean
 *           default: false
 *           description: حالة النشر
 *     
 *     CreateQuestionRequest:
 *       type: object
 *       required:
 *         - questionText
 *         - questionType
 *         - correctAnswer
 *         - orderIndex
 *       properties:
 *         questionText:
 *           type: string
 *           description: نص السؤال
 *           example: "ما هو عكس كلمة 'كبير'؟"
 *         questionType:
 *           $ref: '#/components/schemas/QuestionType'
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: خيارات الإجابة (للأسئلة متعددة الخيارات)
 *           example: ["صغير", "عظيم", "ضخم", "كثير"]
 *         correctAnswer:
 *           type: string
 *           description: الإجابة الصحيحة
 *           example: "صغير"
 *         explanation:
 *           type: string
 *           description: شرح الإجابة
 *           example: "كلمة 'صغير' هي عكس كلمة 'كبير'"
 *         points:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: نقاط السؤال
 *           example: 2
 *         orderIndex:
 *           type: integer
 *           minimum: 1
 *           description: ترتيب السؤال في الاختبار
 *           example: 1
 *     
 *     AssessmentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: معرف الاختبار
 *         uuid:
 *           type: string
 *           description: المعرف الفريد للاختبار
 *         title:
 *           type: string
 *           description: عنوان الاختبار
 *         description:
 *           type: string
 *           description: وصف الاختبار
 *         subjectId:
 *           type: integer
 *           description: معرف المادة
 *         subjectName:
 *           type: string
 *           description: اسم المادة
 *         gradeLevel:
 *           type: integer
 *           description: الصف الدراسي
 *         difficultyLevel:
 *           $ref: '#/components/schemas/Difficulty'
 *         durationMinutes:
 *           type: integer
 *           description: مدة الاختبار بالدقائق
 *         totalQuestions:
 *           type: integer
 *           description: إجمالي عدد الأسئلة
 *         passingScore:
 *           type: integer
 *           description: الدرجة المطلوبة للنجاح
 *         maxAttempts:
 *           type: integer
 *           description: العدد الأقصى للمحاولات
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
 *     QuestionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: معرف السؤال
 *         assessmentId:
 *           type: integer
 *           description: معرف الاختبار
 *         questionText:
 *           type: string
 *           description: نص السؤال
 *         questionType:
 *           $ref: '#/components/schemas/QuestionType'
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: خيارات الإجابة
 *         correctAnswer:
 *           type: string
 *           description: الإجابة الصحيحة (للمعلمين والمديرين فقط)
 *         explanation:
 *           type: string
 *           description: شرح الإجابة
 *         points:
 *           type: integer
 *           description: نقاط السؤال
 *         orderIndex:
 *           type: integer
 *           description: ترتيب السؤال
 *     
 *     AssessmentAttemptResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: معرف المحاولة
 *         uuid:
 *           type: string
 *           description: المعرف الفريد للمحاولة
 *         assessmentId:
 *           type: integer
 *           description: معرف الاختبار
 *         assessmentTitle:
 *           type: string
 *           description: عنوان الاختبار
 *         studentId:
 *           type: integer
 *           description: معرف الطالب
 *         studentName:
 *           type: string
 *           description: اسم الطالب
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: وقت بداية الاختبار
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: وقت انتهاء الاختبار
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: وقت تسليم الاختبار
 *         status:
 *           $ref: '#/components/schemas/AttemptStatus'
 *         totalScore:
 *           type: integer
 *           description: الدرجة الإجمالية
 *         maxScore:
 *           type: integer
 *           description: الدرجة العظمى
 *         percentageScore:
 *           type: number
 *           format: float
 *           description: النسبة المئوية للدرجة
 *         timeSpent:
 *           type: integer
 *           description: الوقت المستغرق بالثواني
 *         passed:
 *           type: boolean
 *           description: حالة النجاح
 *     
 *     AssessmentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             assessments:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AssessmentResponse'
 *             total:
 *               type: integer
 *               description: إجمالي عدد الاختبارات
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
 *     SubmitAnswerRequest:
 *       type: object
 *       required:
 *         - questionId
 *         - answer
 *       properties:
 *         questionId:
 *           type: integer
 *           description: معرف السؤال
 *           example: 1
 *         answer:
 *           type: string
 *           description: إجابة الطالب
 *           example: "صغير"
 *     
 *     AssessmentStats:
 *       type: object
 *       properties:
 *         totalAssessments:
 *           type: integer
 *           description: إجمالي الاختبارات
 *         publishedAssessments:
 *           type: integer
 *           description: الاختبارات المنشورة
 *         draftAssessments:
 *           type: integer
 *           description: الاختبارات المسودة
 *         totalAttempts:
 *           type: integer
 *           description: إجمالي المحاولات
 *         completedAttempts:
 *           type: integer
 *           description: المحاولات المكتملة
 *         averageScore:
 *           type: number
 *           format: float
 *           description: متوسط الدرجات
 *         passRate:
 *           type: number
 *           format: float
 *           description: معدل النجاح
 *         assessmentsBySubject:
 *           type: object
 *           description: الاختبارات حسب المادة
 *         assessmentsByGrade:
 *           type: object
 *           description: الاختبارات حسب الصف
 *         assessmentsByDifficulty:
 *           type: object
 *           description: الاختبارات حسب الصعوبة
 * 
 * tags:
 *   - name: Assessment Management
 *     description: إدارة الاختبارات والتقييم
 *   - name: Question Management
 *     description: إدارة أسئلة الاختبارات
 *   - name: Assessment Taking
 *     description: أداء الاختبارات
 */

const router = Router();
const databaseService = DatabaseService.getInstance();
const assessmentService = new AssessmentService(databaseService.getClient());

/**
 * @swagger
 * /api/v1/assessments:
 *   post:
 *     summary: إنشاء اختبار جديد
 *     description: إنشاء اختبار تقييمي جديد (للمعلمين والمديرين فقط)
 *     tags: [Assessment Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssessmentRequest'
 *     responses:
 *       201:
 *         description: تم إنشاء الاختبار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssessmentResponse'
 *                 message:
 *                   type: string
 *                   example: "Assessment created successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 */
// Assessment Management Routes
router.post('/assessments', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const data: CreateAssessmentDto = req.body;
    const userId = (req as any).user.id;

    const assessment = await assessmentService.createAssessment(data, userId);
    res.status(201).json({
      success: true,
      data: assessment,
      message: 'Assessment created successfully',
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create assessment',
    });
  }
});

/**
 * @swagger
 * /api/v1/assessments:
 *   get:
 *     summary: الحصول على قائمة الاختبارات
 *     description: استرجاع قائمة الاختبارات مع إمكانية الفلترة والبحث والترتيب
 *     tags: [Assessment Management]
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
 *         name: difficultyLevel
 *         schema:
 *           $ref: '#/components/schemas/Difficulty'
 *         description: مستوى الصعوبة للفلترة
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: حالة النشر للفلترة
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: معرف المنشئ للفلترة
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
 *           enum: [createdAt, updatedAt, title, totalQuestions, durationMinutes]
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
 *         description: تم استرجاع قائمة الاختبارات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssessmentListResponse'
 *       401:
 *         description: غير مصرح بالوصول
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/assessments', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: AssessmentFilterDto = {
      subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
      gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
      difficultyLevel: req.query.difficultyLevel as any,
      isPublished: req.query.isPublished ? req.query.isPublished === 'true' : undefined,
      createdBy: req.query.createdBy ? parseInt(req.query.createdBy as string) : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any || 'createdAt',
      sortOrder: req.query.sortOrder as any || 'desc',
    };

    const result = await assessmentService.getAssessmentList(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get assessment list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessments',
    });
  }
});

/**
 * @swagger
 * /api/v1/assessments/{id}:
 *   get:
 *     summary: الحصول على اختبار محدد
 *     description: استرجاع تفاصيل اختبار محدد بواسطة المعرف
 *     tags: [Assessment Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار
 *       - in: query
 *         name: includeQuestions
 *         schema:
 *           type: boolean
 *           default: false
 *         description: تضمين الأسئلة في الاستجابة
 *     responses:
 *       200:
 *         description: تم استرجاع الاختبار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssessmentResponse'
 *       404:
 *         description: الاختبار غير موجود
 *       401:
 *         description: غير مصرح بالوصول
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/assessments/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const includeQuestions = req.query.includeQuestions === 'true';
    const assessment = await assessmentService.getAssessment(id, includeQuestions);

    if (!assessment) {
      res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment',
    });
  }
});

/**
 * @swagger
 * /api/v1/assessments/{id}:
 *   put:
 *     summary: تحديث اختبار
 *     description: تحديث اختبار موجود (للمعلمين والمديرين فقط، أو منشئ الاختبار)
 *     tags: [Assessment Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان الاختبار
 *               description:
 *                 type: string
 *                 description: وصف الاختبار
 *               subjectId:
 *                 type: integer
 *                 description: معرف المادة
 *               gradeLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: الصف الدراسي
 *               difficultyLevel:
 *                 $ref: '#/components/schemas/Difficulty'
 *               durationMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 description: مدة الاختبار بالدقائق
 *               passingScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: الدرجة المطلوبة للنجاح
 *               maxAttempts:
 *                 type: integer
 *                 minimum: 1
 *                 description: العدد الأقصى للمحاولات
 *               isPublished:
 *                 type: boolean
 *                 description: حالة النشر
 *     responses:
 *       200:
 *         description: تم تحديث الاختبار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssessmentResponse'
 *                 message:
 *                   type: string
 *                   example: "Assessment updated successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: الاختبار غير موجود
 */
router.put('/assessments/:id', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateAssessmentDto = req.body;
    const userId = (req as any).user.id;

    const assessment = await assessmentService.updateAssessment(id, data, userId);
    res.json({
      success: true,
      data: assessment,
      message: 'Assessment updated successfully',
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update assessment',
    });
  }
});

/**
 * @swagger
 * /api/v1/assessments/{id}:
 *   delete:
 *     summary: حذف اختبار
 *     description: حذف اختبار موجود (للمعلمين والمديرين فقط، أو منشئ الاختبار)
 *     tags: [Assessment Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار
 *     responses:
 *       200:
 *         description: تم حذف الاختبار بنجاح
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
 *                   example: "Assessment deleted successfully"
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: الاختبار غير موجود
 *       400:
 *         description: فشل في حذف الاختبار
 */
router.delete('/assessments/:id', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = (req as any).user.id;

    await assessmentService.deleteAssessment(id, userId);
    res.json({
      success: true,
      message: 'Assessment deleted successfully',
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete assessment',
    });
  }
});

// Question Management Routes
/**
 * @swagger
 * /api/v1/assessments/{assessmentId}/questions:
 *   post:
 *     summary: إضافة سؤال إلى اختبار
 *     description: إضافة سؤال جديد إلى اختبار موجود (للمعلمين والمديرين فقط)
 *     tags: [Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestionRequest'
 *     responses:
 *       201:
 *         description: تم إضافة السؤال بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QuestionResponse'
 *                 message:
 *                   type: string
 *                   example: "Question added successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: الاختبار غير موجود
 */
router.post('/assessments/:assessmentId/questions', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId);
    const data: CreateQuestionDto = req.body;
    const userId = (req as any).user.id;

    const question = await assessmentService.addQuestion(assessmentId, data, userId);
    res.status(201).json({
      success: true,
      data: question,
      message: 'Question added successfully',
    });
  } catch (error) {
    console.error('Add question error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add question',
    });
  }
});

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   put:
 *     summary: تحديث سؤال
 *     description: تحديث سؤال موجود (للمعلمين والمديرين فقط)
 *     tags: [Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف السؤال
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *                 description: نص السؤال
 *               questionType:
 *                 $ref: '#/components/schemas/QuestionType'
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: خيارات الإجابة
 *               correctAnswer:
 *                 type: string
 *                 description: الإجابة الصحيحة
 *               explanation:
 *                 type: string
 *                 description: شرح الإجابة
 *               points:
 *                 type: integer
 *                 minimum: 1
 *                 description: نقاط السؤال
 *               orderIndex:
 *                 type: integer
 *                 minimum: 1
 *                 description: ترتيب السؤال
 *     responses:
 *       200:
 *         description: تم تحديث السؤال بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QuestionResponse'
 *                 message:
 *                   type: string
 *                   example: "Question updated successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: السؤال غير موجود
 */
router.put('/questions/:id', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateQuestionDto = req.body;
    const userId = (req as any).user.id;

    const question = await assessmentService.updateQuestion(id, data, userId);
    res.json({
      success: true,
      data: question,
      message: 'Question updated successfully',
    });
  } catch (error) {
    console.error('Update question error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update question',
    });
  }
});

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   delete:
 *     summary: حذف سؤال
 *     description: حذف سؤال من اختبار (للمعلمين والمديرين فقط)
 *     tags: [Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف السؤال
 *     responses:
 *       200:
 *         description: تم حذف السؤال بنجاح
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
 *                   example: "Question deleted successfully"
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: السؤال غير موجود
 *       400:
 *         description: فشل في حذف السؤال
 */
router.delete('/questions/:id', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = (req as any).user.id;

    await assessmentService.deleteQuestion(id, userId);
    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Delete question error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete question',
    });
  }
});

/**
 * @swagger
 * /api/v1/assessments/{assessmentId}/questions/bulk:
 *   post:
 *     summary: إضافة أسئلة متعددة
 *     description: إضافة عدة أسئلة إلى اختبار في عملية واحدة (للمعلمين والمديرين فقط)
 *     tags: [Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questions
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateQuestionRequest'
 *                 description: قائمة الأسئلة المراد إضافتها
 *     responses:
 *       201:
 *         description: تم إضافة الأسئلة بنجاح
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
 *                     $ref: '#/components/schemas/QuestionResponse'
 *                 message:
 *                   type: string
 *                   example: "Questions added successfully"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: الاختبار غير موجود
 */
router.post('/assessments/:assessmentId/questions/bulk', authenticate, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId);
    const data: BulkCreateQuestionsDto = {
      assessmentId,
      questions: req.body.questions,
    };
    const userId = (req as any).user.id;

    const questions = await assessmentService.bulkCreateQuestions(data, userId);
    res.status(201).json({
      success: true,
      data: questions,
      message: 'Questions added successfully',
    });
  } catch (error) {
    console.error('Bulk create questions error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add questions',
    });
  }
});

// Assessment Taking Routes
/**
 * @swagger
 * /api/v1/assessments/{id}/start:
 *   post:
 *     summary: بدء اختبار
 *     description: بدء محاولة جديدة لأداء اختبار (للطلاب فقط)
 *     tags: [Assessment Taking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار
 *     responses:
 *       201:
 *         description: تم بدء الاختبار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssessmentAttemptResponse'
 *                 message:
 *                   type: string
 *                   example: "Assessment started successfully"
 *       400:
 *         description: لا يمكن بدء الاختبار (تم تجاوز العدد الأقصى للمحاولات أو يوجد محاولة نشطة)
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية (طلاب فقط)
 *       404:
 *         description: الاختبار غير موجود أو غير منشور
 */
router.post('/assessments/:id/start', authenticate, requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);
    const studentId = (req as any).user.id;

    const attempt = await assessmentService.startAssessment(assessmentId, studentId);
    res.status(201).json({
      success: true,
      data: attempt,
      message: 'Assessment started successfully',
    });
  } catch (error) {
    console.error('Start assessment error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start assessment',
    });
  }
});

/**
 * @swagger
 * /api/v1/assessments/{id}/take:
 *   get:
 *     summary: الحصول على اختبار للطالب
 *     description: استرجاع تفاصيل الاختبار والأسئلة للطالب (بدون الإجابات الصحيحة)
 *     tags: [Assessment Taking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار
 *     responses:
 *       200:
 *         description: تم استرجاع الاختبار بنجاح
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
 *                     assessment:
 *                       $ref: '#/components/schemas/AssessmentResponse'
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           assessmentId:
 *                             type: integer
 *                           questionText:
 *                             type: string
 *                           questionType:
 *                             $ref: '#/components/schemas/QuestionType'
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                           points:
 *                             type: integer
 *                           orderIndex:
 *                             type: integer
 *                     attempt:
 *                       $ref: '#/components/schemas/AssessmentAttemptResponse'
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية (طلاب فقط)
 *       404:
 *         description: الاختبار غير موجود أو غير منشور
 */
router.get('/assessments/:id/take', authenticate, requireRole(['student']), async (req: Request, res: Response): Promise<void> => {
  try {
    const assessmentId = parseInt(req.params.id);
    const studentId = (req as any).user.id;

    const result = await assessmentService.getAssessmentForStudent(assessmentId, studentId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get assessment for student error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch assessment',
    });
  }
});

/**
 * @swagger
 * /api/v1/attempts/{attemptId}/answer:
 *   post:
 *     summary: تسجيل إجابة سؤال
 *     description: تسجيل إجابة الطالب على سؤال في محاولة نشطة
 *     tags: [Assessment Taking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المحاولة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAnswerRequest'
 *     responses:
 *       200:
 *         description: تم تسجيل الإجابة بنجاح
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
 *                   example: "Answer submitted successfully"
 *       400:
 *         description: بيانات غير صحيحة أو المحاولة غير نشطة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: المحاولة غير موجودة
 */
router.post('/attempts/:attemptId/answer', authenticate, requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId);
    const { questionId, answer }: SubmitAnswerDto = req.body;
    const studentId = (req as any).user.id;

    await assessmentService.submitAnswer(attemptId, questionId, answer, studentId);
    res.json({
      success: true,
      message: 'Answer submitted successfully',
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit answer',
    });
  }
});

/**
 * @swagger
 * /api/v1/attempts/{attemptId}/submit:
 *   post:
 *     summary: تسليم الاختبار
 *     description: تسليم الاختبار وحساب النتيجة النهائية
 *     tags: [Assessment Taking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المحاولة
 *     responses:
 *       200:
 *         description: تم تسليم الاختبار بنجاح
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
 *                     attemptId:
 *                       type: integer
 *                     assessmentTitle:
 *                       type: string
 *                     studentName:
 *                       type: string
 *                     totalScore:
 *                       type: integer
 *                     maxScore:
 *                       type: integer
 *                     percentageScore:
 *                       type: number
 *                       format: float
 *                     passed:
 *                       type: boolean
 *                     timeSpent:
 *                       type: integer
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     questionResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: integer
 *                           questionText:
 *                             type: string
 *                           studentAnswer:
 *                             type: string
 *                           correctAnswer:
 *                             type: string
 *                           isCorrect:
 *                             type: boolean
 *                           points:
 *                             type: integer
 *                           earnedPoints:
 *                             type: integer
 *                 message:
 *                   type: string
 *                   example: "Assessment submitted successfully"
 *       400:
 *         description: المحاولة غير نشطة أو بيانات غير صحيحة
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية
 *       404:
 *         description: المحاولة غير موجودة
 */
router.post('/attempts/:attemptId/submit', authenticate, requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId);
    const studentId = (req as any).user.id;

    const result = await assessmentService.submitAssessment(attemptId, studentId);
    res.json({
      success: true,
      data: result,
      message: 'Assessment submitted successfully',
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit assessment',
    });
  }
});

/**
 * @swagger
 * /api/v1/assessment-stats:
 *   get:
 *     summary: الحصول على إحصائيات الاختبارات
 *     description: استرجاع إحصائيات شاملة للاختبارات والمحاولات (للمديرين فقط)
 *     tags: [Assessment Management]
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
 *                   $ref: '#/components/schemas/AssessmentStats'
 *       401:
 *         description: غير مصرح بالوصول
 *       403:
 *         description: صلاحيات غير كافية (مديرين فقط)
 *       500:
 *         description: فشل في استرجاع الإحصائيات
 */
router.get('/assessment-stats', authenticate, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const stats = await assessmentService.getAssessmentStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get assessment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment statistics',
    });
  }
});

export default router;