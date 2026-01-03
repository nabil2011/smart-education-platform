import fc from 'fast-check';
import { SchoolService } from '../../services/school.service';
import { ClassService } from '../../services/class.service';
import { CreateClassDto, EnrollStudentDto } from '../../types/school.types';

// Mock Prisma Client
const mockPrismaClient = {
  school: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  class: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  studentClassEnrollment: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  teacherProfile: {
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
} as any;

describe('School and Class Management Properties', () => {
  let schoolService: SchoolService;
  let classService: ClassService;

  beforeEach(() => {
    jest.clearAllMocks();
    schoolService = new SchoolService(mockPrismaClient);
    classService = new ClassService(mockPrismaClient);
  });

  /**
   * Property 39: حفظ بيانات الصف الكاملة
   * Feature: smart-edu-backend, Property 39: For any valid class data, creating a class should preserve all provided information
   * Validates: Requirements 10.1
   */
  test('Property 39: Complete class data preservation', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        gradeLevel: fc.integer({ min: 1, max: 12 }),
        section: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
        schoolId: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
        teacherId: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
        academicYear: fc.string({ minLength: 4, maxLength: 20 }),
        capacity: fc.option(fc.integer({ min: 10, max: 50 }), { nil: undefined }),
        description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
      }),
      async (classData: CreateClassDto) => {
        // Mock successful creation
        const mockCreatedClass = {
          id: 1,
          ...classData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          school: null,
          teacher: null,
          _count: { enrollments: 0 }
        };

        mockPrismaClient.class.create.mockResolvedValueOnce(mockCreatedClass);

        const result = await classService.createClass(classData);

        // Verify all provided data is preserved
        expect(result.name).toBe(classData.name);
        expect(result.gradeLevel).toBe(classData.gradeLevel);
        expect(result.section).toBe(classData.section);
        expect(result.schoolId).toBe(classData.schoolId);
        expect(result.teacherId).toBe(classData.teacherId);
        expect(result.academicYear).toBe(classData.academicYear);
        expect(result.capacity).toBe(classData.capacity);
        expect(result.description).toBe(classData.description);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 40: تسجيل الطلاب في الصفوف
   * Feature: smart-edu-backend, Property 40: For any valid student and class, enrollment should create a proper enrollment record
   * Validates: Requirements 10.2
   */
  test('Property 40: Student enrollment creates proper records', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        studentId: fc.integer({ min: 1, max: 1000 }),
        classId: fc.integer({ min: 1, max: 100 }),
        academicYear: fc.string({ minLength: 4, maxLength: 20 })
      }),
      async (enrollmentData: EnrollStudentDto) => {
        // Mock no existing enrollment
        mockPrismaClient.studentClassEnrollment.findFirst.mockResolvedValueOnce(null);

        // Mock class with capacity
        mockPrismaClient.class.findUnique.mockResolvedValueOnce({
          id: enrollmentData.classId,
          capacity: 30,
          _count: { enrollments: 15 }
        });

        // Mock successful enrollment
        const mockEnrollment = {
          id: 1,
          ...enrollmentData,
          enrolledAt: new Date(),
          withdrawnAt: null,
          isActive: true,
          student: {
            id: enrollmentData.studentId,
            firstName: 'Test',
            lastName: 'Student',
            email: 'test@example.com',
            studentProfile: {
              studentId: 'STU001',
              gradeLevel: 5
            }
          },
          class: {
            id: enrollmentData.classId,
            name: 'Test Class',
            gradeLevel: 5,
            section: 'A'
          }
        };

        mockPrismaClient.studentClassEnrollment.create.mockResolvedValueOnce(mockEnrollment);

        const result = await classService.enrollStudent(enrollmentData);

        // Verify enrollment record is properly created
        expect(result.studentId).toBe(enrollmentData.studentId);
        expect(result.classId).toBe(enrollmentData.classId);
        expect(result.academicYear).toBe(enrollmentData.academicYear);
        expect(result.isActive).toBe(true);
        expect(result.student).toBeDefined();
        expect(result.class).toBeDefined();
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 41: عرض صفوف المعلم فقط
   * Feature: smart-edu-backend, Property 41: For any teacher user, getClasses should only return classes assigned to that teacher
   * Validates: Requirements 10.3
   */
  test('Property 41: Teacher sees only their assigned classes', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        teacherId: fc.integer({ min: 1, max: 100 }),
        otherTeacherId: fc.integer({ min: 101, max: 200 })
      }),
      async ({ teacherId, otherTeacherId }) => {
        // Mock classes for different teachers
        const teacherClasses = [
          { id: 1, teacherId, name: 'Class 1', gradeLevel: 5 },
          { id: 2, teacherId, name: 'Class 2', gradeLevel: 6 }
        ];

        // Mock filtered results for teacher
        mockPrismaClient.class.findMany.mockResolvedValueOnce(
          teacherClasses.map(cls => ({
            ...cls,
            school: null,
            teacher: null,
            _count: { enrollments: 0 }
          }))
        );
        mockPrismaClient.class.count.mockResolvedValueOnce(teacherClasses.length);

        const result = await classService.getClasses(
          { page: 1, limit: 20 },
          teacherId,
          'teacher'
        );

        // Verify only teacher's classes are returned
        expect(result.classes).toHaveLength(teacherClasses.length);
        result.classes.forEach(cls => {
          expect(cls.teacherId).toBe(teacherId);
        });

        // Verify the where clause was properly set
        expect(mockPrismaClient.class.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              teacherId: teacherId
            })
          })
        );
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 42: نقل الطلاب بين الصفوف
   * Feature: smart-edu-backend, Property 42: For any valid transfer, student should be withdrawn from old class and enrolled in new class
   * Validates: Requirements 10.4
   */
  test('Property 42: Student transfer updates both enrollments', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        studentId: fc.integer({ min: 1, max: 1000 }),
        fromClassId: fc.integer({ min: 1, max: 100 }),
        toClassId: fc.integer({ min: 101, max: 200 }),
        academicYear: fc.string({ minLength: 4, maxLength: 20 })
      }),
      async (transferData) => {
        // Mock transaction result
        const mockTransferResult = {
          oldEnrollment: {
            id: 1,
            studentId: transferData.studentId,
            classId: transferData.fromClassId,
            isActive: false,
            withdrawnAt: new Date(),
            student: { id: transferData.studentId, firstName: 'Test', lastName: 'Student', email: 'test@example.com' },
            class: { id: transferData.fromClassId, name: 'Old Class', gradeLevel: 5, section: 'A' }
          },
          newEnrollment: {
            id: 2,
            studentId: transferData.studentId,
            classId: transferData.toClassId,
            isActive: true,
            withdrawnAt: null,
            student: { id: transferData.studentId, firstName: 'Test', lastName: 'Student', email: 'test@example.com' },
            class: { id: transferData.toClassId, name: 'New Class', gradeLevel: 6, section: 'B' }
          }
        };

        mockPrismaClient.$transaction.mockImplementationOnce(async (callback: any) => {
          return callback({
            studentClassEnrollment: {
              update: jest.fn()
                .mockResolvedValueOnce(mockTransferResult.oldEnrollment),
              create: jest.fn()
                .mockResolvedValueOnce(mockTransferResult.newEnrollment)
            }
          });
        });

        const result = await classService.transferStudent(transferData);

        // Verify old enrollment is deactivated
        expect(result.oldEnrollment.isActive).toBe(false);
        expect(result.oldEnrollment.withdrawnAt).toBeDefined();
        expect(result.oldEnrollment.classId).toBe(transferData.fromClassId);

        // Verify new enrollment is active
        expect(result.newEnrollment.isActive).toBe(true);
        expect(result.newEnrollment.withdrawnAt).toBeNull();
        expect(result.newEnrollment.classId).toBe(transferData.toClassId);

        // Verify same student in both records
        expect(result.oldEnrollment.studentId).toBe(transferData.studentId);
        expect(result.newEnrollment.studentId).toBe(transferData.studentId);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 43: حفظ السجل التاريخي للانتماء
   * Feature: smart-edu-backend, Property 43: For any student, enrollment history should preserve all past and current enrollments
   * Validates: Requirements 10.5
   */
  test('Property 43: Enrollment history preservation', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        studentId: fc.integer({ min: 1, max: 1000 }),
        enrollmentCount: fc.integer({ min: 1, max: 5 })
      }),
      async ({ studentId, enrollmentCount }) => {
        // Generate mock enrollment history
        const mockEnrollments = Array.from({ length: enrollmentCount }, (_, index) => ({
          id: index + 1,
          studentId,
          classId: index + 1,
          academicYear: `2023-${2024 + index}`,
          enrolledAt: new Date(2024 - index, 8, 1), // Most recent first: 2024, 2023, etc.
          withdrawnAt: index < enrollmentCount - 1 ? new Date(2024 - index, 5, 30) : null, // June 30th or null for current
          isActive: index === 0, // First one (most recent) is active
          student: {
            id: studentId,
            firstName: 'Test',
            lastName: 'Student',
            email: 'test@example.com',
            studentProfile: {
              studentId: `STU${studentId.toString().padStart(3, '0')}`,
              gradeLevel: 5 + index
            }
          },
          class: {
            id: index + 1,
            name: `Class ${index + 1}`,
            gradeLevel: 5 + index,
            section: String.fromCharCode(65 + index) // A, B, C, etc.
          }
        }));

        mockPrismaClient.studentClassEnrollment.findMany.mockResolvedValueOnce(mockEnrollments);

        const result = await classService.getStudentEnrollmentHistory(studentId);

        // Verify all enrollments are preserved
        expect(result).toHaveLength(enrollmentCount);
        
        // Verify chronological order (most recent first)
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].enrolledAt.getTime()).toBeGreaterThanOrEqual(
            result[i + 1].enrolledAt.getTime()
          );
        }

        // Verify all records belong to the same student
        result.forEach(enrollment => {
          expect(enrollment.studentId).toBe(studentId);
        });

        // Verify only the most recent enrollment is active (if any)
        const activeEnrollments = result.filter(e => e.isActive);
        expect(activeEnrollments.length).toBeLessThanOrEqual(1);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 71: حفظ بيانات المعلمين الكاملة
   * Feature: smart-edu-backend, Property 71: For any teacher assignment to school, all teacher data should be preserved
   * Validates: Requirements 17.1
   */
  test('Property 71: Complete teacher data preservation in school assignment', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        teacherId: fc.integer({ min: 1, max: 1000 }),
        schoolId: fc.integer({ min: 1, max: 100 }),
        academicYear: fc.string({ minLength: 4, maxLength: 20 })
      }),
      async ({ teacherId, schoolId, academicYear }) => {
        // Mock successful teacher assignment
        mockPrismaClient.teacherProfile.update.mockResolvedValueOnce({
          id: 1,
          userId: teacherId,
          schoolId,
          academicYear,
          employeeId: `EMP${teacherId}`,
          specialization: 'Mathematics',
          yearsExperience: 5,
          qualification: 'Bachelor',
          bio: 'Experienced teacher'
        });

        await schoolService.assignTeacherToSchool(teacherId, schoolId, academicYear);

        // Verify the update was called with correct data
        expect(mockPrismaClient.teacherProfile.update).toHaveBeenCalledWith({
          where: { userId: teacherId },
          data: {
            schoolId,
            academicYear
          }
        });
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 72: ربط المعلمين بالمدارس
   * Feature: smart-edu-backend, Property 72: For any teacher-school assignment, the relationship should be properly established
   * Validates: Requirements 17.2
   */
  test('Property 72: Teacher-school relationship establishment', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        schoolId: fc.integer({ min: 1, max: 100 }),
        teacherCount: fc.integer({ min: 1, max: 10 }),
        academicYear: fc.string({ minLength: 4, maxLength: 20 })
      }),
      async ({ schoolId, teacherCount, academicYear }) => {
        // Generate mock teachers for the school
        const mockTeachers = Array.from({ length: teacherCount }, (_, index) => ({
          id: index + 1,
          userId: index + 1,
          schoolId,
          academicYear,
          employeeId: `EMP${index + 1}`,
          user: {
            id: index + 1,
            firstName: `Teacher${index + 1}`,
            lastName: 'Test',
            email: `teacher${index + 1}@example.com`,
            phone: `123456789${index}`,
            isActive: true
          },
          _count: {
            classes: Math.floor(Math.random() * 5)
          }
        }));

        mockPrismaClient.teacherProfile.findMany.mockResolvedValueOnce(mockTeachers);

        const result = await schoolService.getSchoolTeachers(schoolId, academicYear);

        // Verify all teachers belong to the school
        expect(result).toHaveLength(teacherCount);
        result.forEach(teacher => {
          expect(teacher.schoolId).toBe(schoolId);
          expect(teacher.academicYear).toBe(academicYear);
          expect(teacher.user).toBeDefined();
        });
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 73: إحصائيات المدارس
   * Feature: smart-edu-backend, Property 73: For any school, statistics should accurately reflect current data
   * Validates: Requirements 17.3
   */
  test('Property 73: School statistics accuracy', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        schoolId: fc.integer({ min: 1, max: 100 }),
        classCount: fc.integer({ min: 1, max: 20 }),
        teacherCount: fc.integer({ min: 1, max: 50 })
      }),
      async ({ schoolId, classCount, teacherCount }) => {
        // Generate mock classes with enrollments
        const mockClasses = Array.from({ length: classCount }, (_, index) => ({
          id: index + 1,
          schoolId,
          gradeLevel: (index % 6) + 1, // Grades 1-6
          _count: {
            enrollments: Math.floor(Math.random() * 30) + 10 // 10-39 students
          }
        }));

        const totalStudents = mockClasses.reduce((sum, cls) => sum + cls._count.enrollments, 0);
        const averageClassSize = totalStudents / classCount;

        mockPrismaClient.class.findMany.mockResolvedValueOnce(mockClasses);
        mockPrismaClient.teacherProfile.count.mockResolvedValueOnce(teacherCount);

        const result = await schoolService.getSchoolStatistics(schoolId);

        // Verify statistics accuracy
        expect(result.totalStudents).toBe(totalStudents);
        expect(result.totalTeachers).toBe(teacherCount);
        expect(result.totalClasses).toBe(classCount);
        expect(result.averageClassSize).toBeCloseTo(averageClassSize, 2);
        expect(result.gradeDistribution).toBeDefined();
        expect(Array.isArray(result.gradeDistribution)).toBe(true);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 74: تعديل بيانات المعلمين والمدارس
   * Feature: smart-edu-backend, Property 74: For any school update, only specified fields should be modified
   * Validates: Requirements 17.4
   */
  test('Property 74: Selective school data modification', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        schoolId: fc.integer({ min: 1, max: 100 }),
        originalData: fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          address: fc.option(fc.string({ maxLength: 200 })),
          phone: fc.option(fc.string({ maxLength: 20 })),
          email: fc.option(fc.string({ maxLength: 100 })),
          principalName: fc.option(fc.string({ maxLength: 100 })),
          academicYear: fc.string({ minLength: 4, maxLength: 20 })
        }),
        updateData: fc.record({
          name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          phone: fc.option(fc.string({ maxLength: 20 }), { nil: undefined })
        })
      }),
      async ({ schoolId, originalData, updateData }) => {
        // Create the expected result by merging original data with updates
        // Only include defined fields from updateData
        const expectedResult = { ...originalData };
        if (updateData.name !== undefined) {
          expectedResult.name = updateData.name;
        }
        if (updateData.phone !== undefined) {
          expectedResult.phone = updateData.phone;
        }

        // Mock the updated school with selective changes
        const mockUpdatedSchool = {
          id: schoolId,
          ...expectedResult,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { teachers: 5, classes: 10 }
        };

        mockPrismaClient.school.update.mockResolvedValueOnce(mockUpdatedSchool);

        const result = await schoolService.updateSchool(schoolId, updateData);

        // Verify only specified fields were updated
        if (updateData.name !== undefined) {
          expect(result.name).toBe(updateData.name);
        } else {
          expect(result.name).toBe(originalData.name);
        }

        if (updateData.phone !== undefined) {
          expect(result.phone).toBe(updateData.phone);
        } else {
          expect(result.phone).toBe(originalData.phone);
        }

        // Verify unspecified fields remain unchanged
        expect(result.address).toBe(originalData.address);
        expect(result.email).toBe(originalData.email);
        expect(result.principalName).toBe(originalData.principalName);
        expect(result.academicYear).toBe(originalData.academicYear);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 75: التقارير الإدارية الشاملة
   * Feature: smart-edu-backend, Property 75: For any school, administrative reports should include all relevant data
   * Validates: Requirements 17.5
   */
  test('Property 75: Comprehensive administrative reports', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        schoolId: fc.integer({ min: 1, max: 100 }),
        academicYear: fc.string({ minLength: 4, maxLength: 20 })
      }),
      async ({ schoolId, academicYear }) => {
        // Mock comprehensive school data
        const mockSchool = {
          id: schoolId,
          name: 'Test School',
          address: '123 Test St',
          phone: '123-456-7890',
          email: 'school@test.com',
          principalName: 'Principal Test',
          academicYear,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { teachers: 15, classes: 8 }
        };

        const mockTeachers = Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          userId: i + 1,
          schoolId,
          academicYear,
          user: { firstName: `Teacher${i + 1}`, lastName: 'Test', email: `t${i + 1}@test.com` }
        }));

        const mockClasses = Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          schoolId,
          name: `Class ${i + 1}`,
          gradeLevel: (i % 6) + 1,
          academicYear,
          _count: { enrollments: 25 }
        }));

        const mockStatistics = {
          totalStudents: 200,
          totalTeachers: 15,
          totalClasses: 8,
          averageClassSize: 25,
          gradeDistribution: [
            { gradeLevel: 1, studentCount: 50, classCount: 2 },
            { gradeLevel: 2, studentCount: 50, classCount: 2 }
          ]
        };

        mockPrismaClient.school.findUnique.mockResolvedValueOnce(mockSchool);
        mockPrismaClient.teacherProfile.findMany.mockResolvedValueOnce(mockTeachers);
        mockPrismaClient.class.findMany.mockResolvedValueOnce(mockClasses);
        mockPrismaClient.class.findMany.mockResolvedValueOnce(mockClasses);
        mockPrismaClient.teacherProfile.count.mockResolvedValueOnce(15);

        // Get comprehensive school data
        const school = await schoolService.getSchoolById(schoolId);
        const teachers = await schoolService.getSchoolTeachers(schoolId, academicYear);
        const classes = await schoolService.getSchoolClasses(schoolId, academicYear);
        const statistics = await schoolService.getSchoolStatistics(schoolId, academicYear);

        // Verify comprehensive report data
        expect(school).toBeDefined();
        expect(school?.id).toBe(schoolId);
        expect(school?._count.teachers).toBe(15);
        expect(school?._count.classes).toBe(8);

        expect(teachers).toHaveLength(15);
        expect(classes).toHaveLength(8);
        
        expect(statistics.totalStudents).toBe(200);
        expect(statistics.totalTeachers).toBe(15);
        expect(statistics.totalClasses).toBe(8);
        expect(statistics.gradeDistribution).toBeDefined();
      }
    ), { numRuns: 100 });
  });
});