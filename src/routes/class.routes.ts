import { Router, Request, Response } from 'express';
import { ClassService } from '../services/class.service';
import { db } from '../services/database.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  CreateClassDto, 
  UpdateClassDto, 
  ClassFilters, 
  EnrollStudentDto, 
  TransferStudentDto,
  EnrollmentFilters 
} from '../types/school.types';

const router = Router();
const classService = new ClassService(db.getClient());

// جميع المسارات تتطلب مصادقة
router.use(authenticate);

/**
 * @swagger
 * /api/v1/classes:
 *   get:
 *     summary: الحصول على قائمة الصفوف
 *     description: استرجاع قائمة الصفوف مع إمكانية الفلترة والترقيم
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: integer
 *         description: معرف المدرسة للفلترة
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: integer
 *         description: معرف المعلم للفلترة
 *       - in: query
 *         name: gradeLevel
 *         schema:
 *           type: integer
 *         description: المستوى الدراسي للفلترة
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للفلترة
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: حالة النشاط للفلترة
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في اسم الصف أو الشعبة أو الوصف
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
 *         description: عدد الصفوف في الصفحة
 *     responses:
 *       200:
 *         description: قائمة الصفوف
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
 *                     classes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
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
    const currentUser = (req as any).user;
    
    const filters: ClassFilters = {
      schoolId: req.query.schoolId ? parseInt(req.query.schoolId as string) : undefined,
      teacherId: req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined,
      gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
      academicYear: req.query.academicYear as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await classService.getClasses(filters, currentUser.id, currentUser.role);

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
 * /api/v1/classes/{id}:
 *   get:
 *     summary: الحصول على صف بالمعرف
 *     description: استرجاع تفاصيل صف محدد
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الصف
 *     responses:
 *       200:
 *         description: تفاصيل الصف
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: الصف غير موجود
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = parseInt(req.params.id);

    if (isNaN(classId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
      return;
    }

    const classData = await classService.getClassById(classId);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Class not found'
      });
      return;
    }

    res.json({
      success: true,
      data: classData
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
 * /api/v1/classes:
 *   post:
 *     summary: إنشاء صف جديد
 *     description: إنشاء صف جديد (للإداريين والمعلمين)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - gradeLevel
 *               - academicYear
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم الصف
 *               gradeLevel:
 *                 type: integer
 *                 description: المستوى الدراسي
 *               section:
 *                 type: string
 *                 description: الشعبة
 *               schoolId:
 *                 type: integer
 *                 description: معرف المدرسة
 *               teacherId:
 *                 type: integer
 *                 description: معرف المعلم
 *               academicYear:
 *                 type: string
 *                 description: العام الدراسي
 *               capacity:
 *                 type: integer
 *                 description: سعة الصف
 *               description:
 *                 type: string
 *                 description: وصف الصف
 *     responses:
 *       201:
 *         description: تم إنشاء الصف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين والمعلمين
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authorize(['admin', 'teacher']), async (req: Request, res: Response): Promise<void> => {
  try {
    const classData: CreateClassDto = {
      name: req.body.name,
      gradeLevel: req.body.gradeLevel,
      section: req.body.section,
      schoolId: req.body.schoolId,
      teacherId: req.body.teacherId,
      academicYear: req.body.academicYear,
      capacity: req.body.capacity,
      description: req.body.description
    };

    // التحقق من صحة البيانات
    if (!classData.name || !classData.gradeLevel || !classData.academicYear) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, gradeLevel, academicYear'
      });
      return;
    }

    const newClass = await classService.createClass(classData);

    res.status(201).json({
      success: true,
      data: newClass
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
 * /api/v1/classes/{id}:
 *   put:
 *     summary: تحديث بيانات الصف
 *     description: تحديث بيانات صف موجود (للإداريين والمعلمين)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الصف
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               gradeLevel:
 *                 type: integer
 *               section:
 *                 type: string
 *               schoolId:
 *                 type: integer
 *               teacherId:
 *                 type: integer
 *               academicYear:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم تحديث الصف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: معرف صف غير صحيح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين والمعلمين
 *       404:
 *         description: الصف غير موجود
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authorize(['admin', 'teacher']), async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = parseInt(req.params.id);

    if (isNaN(classId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
      return;
    }

    const updateData: UpdateClassDto = req.body;
    const updatedClass = await classService.updateClass(classId, updateData);

    res.json({
      success: true,
      data: updatedClass
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
 * /api/v1/classes/{id}:
 *   delete:
 *     summary: حذف صف
 *     description: حذف صف (إلغاء تفعيل) - للإداريين فقط
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الصف
 *     responses:
 *       200:
 *         description: تم حذف الصف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: معرف صف غير صحيح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين
 *       404:
 *         description: الصف غير موجود
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = parseInt(req.params.id);

    if (isNaN(classId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
      return;
    }

    const deletedClass = await classService.deleteClass(classId);

    res.json({
      success: true,
      data: deletedClass
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
 * /api/v1/classes/{id}/enroll:
 *   post:
 *     summary: تسجيل طالب في صف
 *     description: تسجيل طالب في صف محدد (للإداريين والمعلمين)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الصف
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - academicYear
 *             properties:
 *               studentId:
 *                 type: integer
 *                 description: معرف الطالب
 *               academicYear:
 *                 type: string
 *                 description: العام الدراسي
 *     responses:
 *       201:
 *         description: تم تسجيل الطالب بنجاح
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
 *       400:
 *         description: بيانات غير صحيحة أو الصف ممتلئ
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين والمعلمين
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/enroll', authorize(['admin', 'teacher']), async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = parseInt(req.params.id);

    if (isNaN(classId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
      return;
    }

    const enrollmentData: EnrollStudentDto = {
      studentId: req.body.studentId,
      classId,
      academicYear: req.body.academicYear
    };

    // التحقق من صحة البيانات
    if (!enrollmentData.studentId || !enrollmentData.academicYear) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, academicYear'
      });
      return;
    }

    const enrollment = await classService.enrollStudent(enrollmentData);

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error: any) {
    if (error.message.includes('already enrolled') || error.message.includes('full capacity')) {
      res.status(400).json({
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
 * /api/v1/classes/{id}/students:
 *   get:
 *     summary: الحصول على طلاب الصف
 *     description: استرجاع قائمة طلاب الصف
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الصف
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للفلترة
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: حالة النشاط للفلترة
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
 *           default: 50
 *         description: عدد الطلاب في الصفحة
 *     responses:
 *       200:
 *         description: قائمة طلاب الصف
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
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         description: الصف غير موجود
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/students', async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = parseInt(req.params.id);

    if (isNaN(classId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
      return;
    }

    const filters: EnrollmentFilters = {
      academicYear: req.query.academicYear as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const result = await classService.getClassStudents(classId, filters);

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
 * /api/v1/classes/{id}/statistics:
 *   get:
 *     summary: الحصول على إحصائيات الصف
 *     description: استرجاع إحصائيات شاملة للصف
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الصف
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للإحصائيات
 *     responses:
 *       200:
 *         description: إحصائيات الصف
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
 *                     enrolledStudents:
 *                       type: integer
 *                     capacity:
 *                       type: integer
 *                     utilizationRate:
 *                       type: number
 *       404:
 *         description: الصف غير موجود
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/statistics', async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = parseInt(req.params.id);
    const academicYear = req.query.academicYear as string;

    if (isNaN(classId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
      return;
    }

    const statistics = await classService.getClassStatistics(classId, academicYear);

    res.json({
      success: true,
      data: statistics
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
 * /api/v1/students/{studentId}/transfer:
 *   post:
 *     summary: نقل طالب بين الصفوف
 *     description: نقل طالب من صف إلى آخر (للإداريين فقط)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف الطالب
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromClassId
 *               - toClassId
 *               - academicYear
 *             properties:
 *               fromClassId:
 *                 type: integer
 *                 description: معرف الصف الحالي
 *               toClassId:
 *                 type: integer
 *                 description: معرف الصف الجديد
 *               academicYear:
 *                 type: string
 *                 description: العام الدراسي
 *               reason:
 *                 type: string
 *                 description: سبب النقل
 *     responses:
 *       200:
 *         description: تم نقل الطالب بنجاح
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
 *                     oldEnrollment:
 *                       type: object
 *                     newEnrollment:
 *                       type: object
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/students/:studentId/transfer', authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
      return;
    }

    const transferData: TransferStudentDto = {
      studentId,
      fromClassId: req.body.fromClassId,
      toClassId: req.body.toClassId,
      academicYear: req.body.academicYear,
      reason: req.body.reason
    };

    // التحقق من صحة البيانات
    if (!transferData.fromClassId || !transferData.toClassId || !transferData.academicYear) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: fromClassId, toClassId, academicYear'
      });
      return;
    }

    const result = await classService.transferStudent(transferData);

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
 * /api/v1/students/{studentId}/enrollment-history:
 *   get:
 *     summary: الحصول على سجل انتماء الطالب للصفوف
 *     description: استرجاع سجل تاريخي لانتماء الطالب للصفوف
 *     tags: [Classes]
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
 *         description: سجل انتماء الطالب
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
 *                     type: object
 *       400:
 *         description: معرف طالب غير صحيح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/students/:studentId/enrollment-history', async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
      return;
    }

    const history = await classService.getStudentEnrollmentHistory(studentId);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;