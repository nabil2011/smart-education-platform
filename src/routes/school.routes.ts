import { Router, Request, Response } from 'express';
import { SchoolService } from '../services/school.service';
import { db } from '../services/database.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { CreateSchoolDto, UpdateSchoolDto, SchoolFilters } from '../types/school.types';

const router = Router();
const schoolService = new SchoolService(db.getClient());

// جميع المسارات تتطلب مصادقة
router.use(authenticate);

/**
 * @swagger
 * /api/v1/schools:
 *   get:
 *     summary: الحصول على قائمة المدارس
 *     description: استرجاع قائمة المدارس مع إمكانية الفلترة والترقيم
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: البحث في اسم المدرسة أو المدير أو العنوان
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
 *         description: عدد المدارس في الصفحة
 *     responses:
 *       200:
 *         description: قائمة المدارس
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
 *                     schools:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/School'
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
    const filters: SchoolFilters = {
      academicYear: req.query.academicYear as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await schoolService.getSchools(filters);

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
 * /api/v1/schools/{id}:
 *   get:
 *     summary: الحصول على مدرسة بالمعرف
 *     description: استرجاع تفاصيل مدرسة محددة
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المدرسة
 *     responses:
 *       200:
 *         description: تفاصيل المدرسة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       404:
 *         description: المدرسة غير موجودة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = parseInt(req.params.id);

    if (isNaN(schoolId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
      return;
    }

    const school = await schoolService.getSchoolById(schoolId);

    if (!school) {
      res.status(404).json({
        success: false,
        message: 'School not found'
      });
      return;
    }

    res.json({
      success: true,
      data: school
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
 * /api/v1/schools:
 *   post:
 *     summary: إنشاء مدرسة جديدة
 *     description: إنشاء مدرسة جديدة (للإداريين فقط)
 *     tags: [Schools]
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
 *               - academicYear
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم المدرسة
 *               address:
 *                 type: string
 *                 description: عنوان المدرسة
 *               phone:
 *                 type: string
 *                 description: رقم هاتف المدرسة
 *               email:
 *                 type: string
 *                 format: email
 *                 description: بريد المدرسة الإلكتروني
 *               principalName:
 *                 type: string
 *                 description: اسم مدير المدرسة
 *               academicYear:
 *                 type: string
 *                 description: العام الدراسي
 *     responses:
 *       201:
 *         description: تم إنشاء المدرسة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolData: CreateSchoolDto = {
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      email: req.body.email,
      principalName: req.body.principalName,
      academicYear: req.body.academicYear
    };

    // التحقق من صحة البيانات
    if (!schoolData.name || !schoolData.academicYear) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, academicYear'
      });
      return;
    }

    const school = await schoolService.createSchool(schoolData);

    res.status(201).json({
      success: true,
      data: school
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
 * /api/v1/schools/{id}:
 *   put:
 *     summary: تحديث بيانات المدرسة
 *     description: تحديث بيانات مدرسة موجودة (للإداريين فقط)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المدرسة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               principalName:
 *                 type: string
 *               academicYear:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم تحديث المدرسة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: معرف مدرسة غير صحيح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين
 *       404:
 *         description: المدرسة غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = parseInt(req.params.id);

    if (isNaN(schoolId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
      return;
    }

    const updateData: UpdateSchoolDto = req.body;
    const school = await schoolService.updateSchool(schoolId, updateData);

    res.json({
      success: true,
      data: school
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
 * /api/v1/schools/{id}:
 *   delete:
 *     summary: حذف مدرسة
 *     description: حذف مدرسة (إلغاء تفعيل) - للإداريين فقط
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المدرسة
 *     responses:
 *       200:
 *         description: تم حذف المدرسة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: معرف مدرسة غير صحيح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: غير مسموح - فقط الإداريين
 *       404:
 *         description: المدرسة غير موجودة
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = parseInt(req.params.id);

    if (isNaN(schoolId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
      return;
    }

    const school = await schoolService.deleteSchool(schoolId);

    res.json({
      success: true,
      data: school
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
 * /api/v1/schools/{id}/statistics:
 *   get:
 *     summary: الحصول على إحصائيات المدرسة
 *     description: استرجاع إحصائيات شاملة للمدرسة
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المدرسة
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للإحصائيات
 *     responses:
 *       200:
 *         description: إحصائيات المدرسة
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
 *                     totalStudents:
 *                       type: integer
 *                     totalTeachers:
 *                       type: integer
 *                     totalClasses:
 *                       type: integer
 *                     averageClassSize:
 *                       type: number
 *                     gradeDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           gradeLevel:
 *                             type: integer
 *                           studentCount:
 *                             type: integer
 *                           classCount:
 *                             type: integer
 *       404:
 *         description: المدرسة غير موجودة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/statistics', async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = parseInt(req.params.id);
    const academicYear = req.query.academicYear as string;

    if (isNaN(schoolId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
      return;
    }

    const statistics = await schoolService.getSchoolStatistics(schoolId, academicYear);

    res.json({
      success: true,
      data: statistics
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
 * /api/v1/schools/{id}/teachers:
 *   get:
 *     summary: الحصول على معلمي المدرسة
 *     description: استرجاع قائمة معلمي المدرسة
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المدرسة
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للفلترة
 *     responses:
 *       200:
 *         description: قائمة معلمي المدرسة
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
 *       404:
 *         description: المدرسة غير موجودة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/teachers', async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = parseInt(req.params.id);
    const academicYear = req.query.academicYear as string;

    if (isNaN(schoolId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
      return;
    }

    const teachers = await schoolService.getSchoolTeachers(schoolId, academicYear);

    res.json({
      success: true,
      data: teachers
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
 * /api/v1/schools/{id}/classes:
 *   get:
 *     summary: الحصول على صفوف المدرسة
 *     description: استرجاع قائمة صفوف المدرسة
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: معرف المدرسة
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: العام الدراسي للفلترة
 *     responses:
 *       200:
 *         description: قائمة صفوف المدرسة
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
 *       404:
 *         description: المدرسة غير موجودة
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/classes', async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = parseInt(req.params.id);
    const academicYear = req.query.academicYear as string;

    if (isNaN(schoolId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
      return;
    }

    const classes = await schoolService.getSchoolClasses(schoolId, academicYear);

    res.json({
      success: true,
      data: classes
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;