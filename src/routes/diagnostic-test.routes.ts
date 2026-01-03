/**
 * مسارات API للاختبارات التشخيصية
 * Diagnostic Test API Routes
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { diagnosticTestService } from '../services/diagnostic-test.service';
import {
  CreateDiagnosticTestDto,
  UpdateDiagnosticTestDto,
  CreateTestResultDto,
  DiagnosticTestFilters,
  TestResultFilters,
  DiagnosticTestType,
  TestDifficulty,
  TestResultStatus
} from '../types/diagnostic-test.types';

const router = Router();

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

/**
 * @swagger
 * /api/diagnostic-tests:
 *   post:
 *     summary: إنشاء اختبار تشخيصي جديد
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDiagnosticTestDto'
 *     responses:
 *       201:
 *         description: تم إنشاء الاختبار التشخيصي بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiagnosticTest'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مصرح - يتطلب صلاحية معلم أو إداري
 */
router.post(
  '/',
  requireRole(['teacher', 'admin']),
  [
    body('title')
      .notEmpty()
      .withMessage('عنوان الاختبار مطلوب')
      .isLength({ max: 255 })
      .withMessage('عنوان الاختبار يجب أن يكون أقل من 255 حرف'),
    body('subjectId')
      .isInt({ min: 1 })
      .withMessage('معرف المادة يجب أن يكون رقم صحيح موجب'),
    body('gradeLevel')
      .isInt({ min: 1, max: 12 })
      .withMessage('المستوى الدراسي يجب أن يكون بين 1 و 12'),
    body('testType')
      .isIn(Object.values(DiagnosticTestType))
      .withMessage('نوع الاختبار غير صحيح'),
    body('difficulty')
      .isIn(Object.values(TestDifficulty))
      .withMessage('مستوى الصعوبة غير صحيح'),
    body('totalMarks')
      .isInt({ min: 1 })
      .withMessage('إجمالي الدرجات يجب أن يكون رقم صحيح موجب'),
    body('passingMarks')
      .isInt({ min: 1 })
      .withMessage('درجة النجاح يجب أن تكون رقم صحيح موجب')
      .custom((value, { req }) => {
        if (value > req.body.totalMarks) {
          throw new Error('درجة النجاح يجب أن تكون أقل من أو تساوي إجمالي الدرجات');
        }
        return true;
      })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const testData: CreateDiagnosticTestDto = req.body;
      const createdBy = req.user!.id;

      const test = await diagnosticTestService.createDiagnosticTest(testData, createdBy);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الاختبار التشخيصي بنجاح',
        data: test
      });
    } catch (error) {
      console.error('Error creating diagnostic test:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء الاختبار التشخيصي'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests:
 *   get:
 *     summary: الحصول على قائمة الاختبارات التشخيصية مع الفلترة
 *     tags: [Diagnostic Tests]
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
 *           minimum: 1
 *           maximum: 12
 *         description: المستوى الدراسي
 *       - in: query
 *         name: testType
 *         schema:
 *           type: string
 *           enum: [written, oral, practical]
 *         description: نوع الاختبار
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: مستوى الصعوبة
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: حالة النشاط
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في العنوان والوصف
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
 *     responses:
 *       200:
 *         description: قائمة الاختبارات التشخيصية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedDiagnosticTests'
 */
router.get(
  '/',
  [
    query('subjectId').optional().isInt({ min: 1 }),
    query('gradeLevel').optional().isInt({ min: 1, max: 12 }),
    query('testType').optional().isIn(Object.values(DiagnosticTestType)),
    query('difficulty').optional().isIn(Object.values(TestDifficulty)),
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'معاملات غير صحيحة',
          errors: errors.array()
        });
      }

      const filters: DiagnosticTestFilters = {
        subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
        gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
        testType: req.query.testType as DiagnosticTestType,
        difficulty: req.query.difficulty as TestDifficulty,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc'
      };

      // إضافة فلتر للمعلمين لرؤية اختباراتهم فقط
      if (req.user!.role === 'teacher') {
        filters.createdBy = req.user!.id;
      }

      const result = await diagnosticTestService.getDiagnosticTests(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching diagnostic tests:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الاختبارات التشخيصية'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests/{id}:
 *   get:
 *     summary: الحصول على اختبار تشخيصي بالمعرف
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار التشخيصي
 *     responses:
 *       200:
 *         description: تفاصيل الاختبار التشخيصي
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiagnosticTest'
 *       404:
 *         description: الاختبار التشخيصي غير موجود
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('معرف الاختبار يجب أن يكون رقم صحيح موجب')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'معرف غير صحيح',
          errors: errors.array()
        });
      }

      const id = parseInt(req.params.id);
      const test = await diagnosticTestService.getDiagnosticTestById(id);

      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'الاختبار التشخيصي غير موجود'
        });
      }

      // التحقق من الصلاحيات - المعلمون يمكنهم رؤية اختباراتهم فقط
      if (req.user!.role === 'teacher' && test.createdBy !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول لهذا الاختبار'
        });
      }

      res.json({
        success: true,
        data: test
      });
    } catch (error) {
      console.error('Error fetching diagnostic test:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الاختبار التشخيصي'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests/{id}:
 *   put:
 *     summary: تحديث اختبار تشخيصي
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار التشخيصي
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDiagnosticTestDto'
 *     responses:
 *       200:
 *         description: تم تحديث الاختبار التشخيصي بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiagnosticTest'
 *       404:
 *         description: الاختبار التشخيصي غير موجود
 */
router.put(
  '/:id',
  requireRole(['teacher', 'admin']),
  [
    param('id').isInt({ min: 1 }),
    body('title').optional().isLength({ max: 255 }),
    body('subjectId').optional().isInt({ min: 1 }),
    body('gradeLevel').optional().isInt({ min: 1, max: 12 }),
    body('testType').optional().isIn(Object.values(DiagnosticTestType)),
    body('difficulty').optional().isIn(Object.values(TestDifficulty)),
    body('totalMarks').optional().isInt({ min: 1 }),
    body('passingMarks').optional().isInt({ min: 1 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const id = parseInt(req.params.id);
      
      // التحقق من وجود الاختبار والصلاحيات
      const existingTest = await diagnosticTestService.getDiagnosticTestById(id);
      if (!existingTest) {
        return res.status(404).json({
          success: false,
          message: 'الاختبار التشخيصي غير موجود'
        });
      }

      if (req.user!.role === 'teacher' && existingTest.createdBy !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بتعديل هذا الاختبار'
        });
      }

      const updates: UpdateDiagnosticTestDto = req.body;
      const updatedTest = await diagnosticTestService.updateDiagnosticTest(id, updates);

      res.json({
        success: true,
        message: 'تم تحديث الاختبار التشخيصي بنجاح',
        data: updatedTest
      });
    } catch (error) {
      console.error('Error updating diagnostic test:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث الاختبار التشخيصي'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests/{id}:
 *   delete:
 *     summary: حذف اختبار تشخيصي (إلغاء تفعيل)
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار التشخيصي
 *     responses:
 *       200:
 *         description: تم حذف الاختبار التشخيصي بنجاح
 *       404:
 *         description: الاختبار التشخيصي غير موجود
 */
router.delete(
  '/:id',
  requireRole(['teacher', 'admin']),
  [param('id').isInt({ min: 1 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'معرف غير صحيح',
          errors: errors.array()
        });
      }

      const id = parseInt(req.params.id);
      
      // التحقق من وجود الاختبار والصلاحيات
      const existingTest = await diagnosticTestService.getDiagnosticTestById(id);
      if (!existingTest) {
        return res.status(404).json({
          success: false,
          message: 'الاختبار التشخيصي غير موجود'
        });
      }

      if (req.user!.role === 'teacher' && existingTest.createdBy !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بحذف هذا الاختبار'
        });
      }

      await diagnosticTestService.deleteDiagnosticTest(id);

      res.json({
        success: true,
        message: 'تم حذف الاختبار التشخيصي بنجاح'
      });
    } catch (error) {
      console.error('Error deleting diagnostic test:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف الاختبار التشخيصي'
      });
    }
  }
);

// ==================== مسارات النتائج ====================

/**
 * @swagger
 * /api/diagnostic-tests/{id}/conduct:
 *   post:
 *     summary: تسجيل نتيجة اختبار تشخيصي
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار التشخيصي
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTestResultDto'
 *     responses:
 *       201:
 *         description: تم تسجيل النتيجة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiagnosticTestResult'
 */
router.post(
  '/:id/conduct',
  [
    param('id').isInt({ min: 1 }),
    body('studentId').isInt({ min: 1 }).withMessage('معرف الطالب مطلوب'),
    body('answers').isArray().withMessage('الإجابات يجب أن تكون مصفوفة'),
    body('timeSpent').optional().isInt({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const testId = parseInt(req.params.id);
      const resultData: CreateTestResultDto = {
        testId,
        studentId: req.body.studentId,
        answers: req.body.answers,
        timeSpent: req.body.timeSpent
      };

      const result = await diagnosticTestService.conductTest(resultData);

      res.status(201).json({
        success: true,
        message: 'تم تسجيل النتيجة بنجاح',
        data: result
      });
    } catch (error) {
      console.error('Error conducting test:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تسجيل النتيجة'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests/{id}/analysis:
 *   get:
 *     summary: تحليل نتائج الاختبار التشخيصي
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الاختبار التشخيصي
 *     responses:
 *       200:
 *         description: تحليل نتائج الاختبار
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestAnalysis'
 */
router.get(
  '/:id/analysis',
  requireRole(['teacher', 'admin']),
  [param('id').isInt({ min: 1 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'معرف غير صحيح',
          errors: errors.array()
        });
      }

      const testId = parseInt(req.params.id);
      const analysis = await diagnosticTestService.analyzeTestResults(testId);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error analyzing test results:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحليل نتائج الاختبار'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests/students/{studentId}/results:
 *   get:
 *     summary: الحصول على نتائج الطالب في الاختبارات التشخيصية
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الطالب
 *     responses:
 *       200:
 *         description: نتائج الطالب
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedTestResults'
 */
router.get(
  '/students/:studentId/results',
  [param('studentId').isInt({ min: 1 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'معرف غير صحيح',
          errors: errors.array()
        });
      }

      const studentId = parseInt(req.params.studentId);
      
      // التحقق من الصلاحيات - الطلاب يمكنهم رؤية نتائجهم فقط
      if (req.user!.role === 'student' && req.user!.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول لهذه النتائج'
        });
      }

      const filters: TestResultFilters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const results = await diagnosticTestService.getStudentTestResults(studentId, filters);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error fetching student results:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب نتائج الطالب'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests/students/{studentId}/recommendations:
 *   get:
 *     summary: الحصول على توصيات التعلم للطالب
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الطالب
 *     responses:
 *       200:
 *         description: توصيات التعلم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeaknessAnalysis'
 */
router.get(
  '/students/:studentId/recommendations',
  [param('studentId').isInt({ min: 1 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'معرف غير صحيح',
          errors: errors.array()
        });
      }

      const studentId = parseInt(req.params.studentId);
      
      // التحقق من الصلاحيات
      if (req.user!.role === 'student' && req.user!.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول لهذه التوصيات'
        });
      }

      const weaknessAnalysis = await diagnosticTestService.identifyWeaknesses(studentId);

      res.json({
        success: true,
        data: weaknessAnalysis
      });
    } catch (error) {
      console.error('Error fetching student recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب توصيات الطالب'
      });
    }
  }
);

/**
 * @swagger
 * /api/diagnostic-tests/statistics:
 *   get:
 *     summary: الحصول على إحصائيات الاختبارات التشخيصية
 *     tags: [Diagnostic Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: إحصائيات الاختبارات التشخيصية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiagnosticTestStatistics'
 */
router.get(
  '/statistics',
  requireRole(['teacher', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const statistics = await diagnosticTestService.getDiagnosticTestStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching diagnostic test statistics:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب إحصائيات الاختبارات التشخيصية'
      });
    }
  }
);

export default router;