import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { assignmentService } from '../../services/assignment.service';
import {
  CreateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  AssignmentType,
  SubmissionStatus
} from '../../types/assignment.types';

// Use real Prisma client for integration tests
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Override the mocked Prisma client for this test
jest.unmock('@prisma/client');

// Test data generators
const assignmentTypeArb = fc.constantFrom(
  AssignmentType.HOMEWORK,
  AssignmentType.PROJECT,
  AssignmentType.QUIZ,
  AssignmentType.ESSAY,
  AssignmentType.PRESENTATION,
  AssignmentType.LAB_WORK
);

const createAssignmentDtoArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  instructions: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  subjectId: fc.integer({ min: 1, max: 10 }),
  gradeLevel: fc.integer({ min: 1, max: 12 }),
  assignmentType: assignmentTypeArb,
  attachments: fc.option(fc.array(fc.webUrl(), { maxLength: 5 }), { nil: undefined }),
  dueDate: fc.date({ min: new Date(Date.now() + 60 * 60 * 1000), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }).filter(date => !isNaN(date.getTime())), // At least 1 hour in the future, valid dates only
  maxScore: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  allowLateSubmission: fc.boolean(), // Always provide a boolean value
  latePenalty: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined })
});

const submitAssignmentDtoArb = fc.record({
  submissionText: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
  attachments: fc.option(fc.array(fc.webUrl(), { maxLength: 3 }), { nil: undefined })
});

const gradeSubmissionDtoArb = fc.record({
  score: fc.integer({ min: 0, max: 100 }),
  feedback: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
});

describe('Assignment Service Property Tests', () => {
  let testUserId: number;
  let testStudentId: number;
  let testSubjectId: number;

  beforeAll(async () => {
    try {
      // إنشاء بيانات اختبار
      const testUser = await prisma.user.create({
        data: {
          email: 'test-teacher@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'Teacher',
          role: 'teacher'
        }
      });
      testUserId = testUser.id;

      const testStudent = await prisma.user.create({
        data: {
          email: 'test-student@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'Student',
          role: 'student',
          studentProfile: {
            create: {
              gradeLevel: 5
            }
          }
        }
      });
      testStudentId = testStudent.id;

      const testSubject = await prisma.subject.create({
        data: {
          name: 'Test Subject',
          nameAr: 'مادة اختبار',
          gradeLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }
      });
      testSubjectId = testSubject.id;
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // تنظيف البيانات
      await prisma.assignmentSubmission.deleteMany({});
      await prisma.assignment.deleteMany({});
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['test-teacher@example.com', 'test-student@example.com']
          }
        }
      });
      await prisma.subject.deleteMany({
        where: { name: 'Test Subject' }
      });
    } catch (error) {
      console.error('Error in afterAll:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    // تنظيف البيانات قبل كل اختبار
    await prisma.assignmentSubmission.deleteMany({});
    await prisma.assignment.deleteMany({
      where: { createdBy: testUserId }
    });
  });

  /**
   * Feature: smart-edu-backend, Property 16: حفظ الواجبات الكامل
   * Validates: Requirements 4.1
   */
  test('Property 16: حفظ الواجبات الكامل', async () => {
    await fc.assert(
      fc.asyncProperty(createAssignmentDtoArb, async (assignmentData) => {
        // تعديل البيانات لتتوافق مع البيانات الموجودة
        const modifiedData = {
          ...assignmentData,
          subjectId: testSubjectId
        };

        const assignment = await assignmentService.createAssignment(modifiedData, testUserId);

        // التحقق من حفظ جميع البيانات المطلوبة
        expect(assignment.title).toBe(modifiedData.title);
        expect(assignment.subjectId).toBe(testSubjectId);
        expect(assignment.gradeLevel).toBe(modifiedData.gradeLevel);
        expect(assignment.assignmentType).toBe(modifiedData.assignmentType);
        expect(assignment.dueDate).toEqual(modifiedData.dueDate);
        expect(assignment.createdBy).toBe(testUserId);
        expect(assignment.uuid).toBeDefined();
        expect(assignment.createdAt).toBeDefined();
        expect(assignment.updatedAt).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: smart-edu-backend, Property 18: حفظ تسليم الواجبات
   * Validates: Requirements 4.3
   */
  test('Property 18: حفظ تسليم الواجبات', async () => {
    await fc.assert(
      fc.asyncProperty(
        createAssignmentDtoArb,
        submitAssignmentDtoArb,
        async (assignmentData, submissionData) => {
          // إنشاء واجب أولاً
          const modifiedAssignmentData = {
            ...assignmentData,
            subjectId: testSubjectId
          };

          const assignment = await assignmentService.createAssignment(modifiedAssignmentData, testUserId);
          
          // نشر الواجب
          await assignmentService.publishAssignment(assignment.id, testUserId);

          // تسليم الواجب
          const submission = await assignmentService.submitAssignment(
            assignment.id,
            testStudentId,
            submissionData
          );

          // التحقق من حفظ التسليم مع الطابع الزمني الصحيح
          expect(submission.assignmentId).toBe(assignment.id);
          expect(submission.studentId).toBe(testStudentId);
          expect(submission.submittedAt).toBeDefined();
          expect(submission.submittedAt).toBeInstanceOf(Date);
          expect(submission.status).toBe(SubmissionStatus.SUBMITTED);
          
          if (submissionData.submissionText) {
            expect(submission.submissionText).toBe(submissionData.submissionText);
          }
          
          if (submissionData.attachments) {
            expect(submission.attachments).toEqual(submissionData.attachments);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: smart-edu-backend, Property 19: معالجة التأخير
   * Validates: Requirements 4.4
   */
  test('Property 19: معالجة التأخير', async () => {
    await fc.assert(
      fc.asyncProperty(
        createAssignmentDtoArb,
        submitAssignmentDtoArb,
        async (assignmentData, submissionData) => {
          // إنشاء واجب بموعد نهائي في الماضي
          const pastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // أمس
          const modifiedAssignmentData = {
            ...assignmentData,
            subjectId: testSubjectId,
            dueDate: pastDueDate,
            allowLateSubmission: true
          };

          const assignment = await assignmentService.createAssignment(modifiedAssignmentData, testUserId);
          
          // نشر الواجب
          await assignmentService.publishAssignment(assignment.id, testUserId);

          // تسليم الواجب المتأخر
          const submission = await assignmentService.submitAssignment(
            assignment.id,
            testStudentId,
            submissionData
          );

          // التحقق من وضع علامة التأخير
          expect(submission.isLate).toBe(true);
          expect(submission.status).toBe(SubmissionStatus.LATE);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: smart-edu-backend, Property 20: منح النقاط الصحيح (للواجبات)
   * Validates: Requirements 5.1
   */
  test('Property 20: تقييم الواجبات الصحيح', async () => {
    await fc.assert(
      fc.asyncProperty(
        createAssignmentDtoArb,
        submitAssignmentDtoArb,
        gradeSubmissionDtoArb,
        async (assignmentData, submissionData, gradeData) => {
          // إنشاء واجب
          const modifiedAssignmentData = {
            ...assignmentData,
            subjectId: testSubjectId,
            maxScore: 100
          };

          const assignment = await assignmentService.createAssignment(modifiedAssignmentData, testUserId);
          
          // نشر الواجب
          await assignmentService.publishAssignment(assignment.id, testUserId);

          // تسليم الواجب
          const submission = await assignmentService.submitAssignment(
            assignment.id,
            testStudentId,
            submissionData
          );

          // تقييم الواجب
          const gradedSubmission = await assignmentService.gradeSubmission(
            submission.id,
            testUserId,
            gradeData
          );

          // التحقق من التقييم الصحيح
          expect(gradedSubmission.score).toBe(gradeData.score);
          expect(gradedSubmission.gradedBy).toBe(testUserId);
          expect(gradedSubmission.gradedAt).toBeDefined();
          expect(gradedSubmission.status).toBe(SubmissionStatus.GRADED);
          
          if (gradeData.feedback) {
            expect(gradedSubmission.feedback).toBe(gradeData.feedback);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: smart-edu-backend, Property 21: تطبيق عقوبة التأخير
   * Validates: Requirements 4.4
   */
  test('Property 21: تطبيق عقوبة التأخير', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 50 }), // نسبة العقوبة
        fc.integer({ min: 50, max: 100 }), // الدرجة الأصلية
        async (latePenalty, originalScore) => {
          // إنشاء واجب بموعد نهائي في الماضي وعقوبة تأخير
          const pastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // أمس
          const assignmentData: CreateAssignmentDto = {
            title: 'Test Assignment',
            subjectId: testSubjectId,
            gradeLevel: 5,
            assignmentType: AssignmentType.HOMEWORK,
            dueDate: pastDueDate,
            allowLateSubmission: true,
            latePenalty: latePenalty,
            maxScore: 100
          };

          const assignment = await assignmentService.createAssignment(assignmentData, testUserId);
          
          // نشر الواجب
          await assignmentService.publishAssignment(assignment.id, testUserId);

          // تسليم الواجب المتأخر
          const submission = await assignmentService.submitAssignment(
            assignment.id,
            testStudentId,
            { submissionText: 'Late submission' }
          );

          // تقييم الواجب
          const gradedSubmission = await assignmentService.gradeSubmission(
            submission.id,
            testUserId,
            { score: originalScore }
          );

          // حساب الدرجة المتوقعة بعد تطبيق العقوبة
          const daysLate = Math.ceil(
            (submission.submittedAt.getTime() - pastDueDate.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          const penalty = (latePenalty * daysLate) / 100;
          const expectedScore = Math.max(0, Math.round(originalScore * (1 - penalty)));

          // التحقق من تطبيق عقوبة التأخير
          expect(gradedSubmission.score).toBe(expectedScore);
          expect(gradedSubmission.score).toBeLessThanOrEqual(originalScore);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: smart-edu-backend, Property 22: منع التسليم المكرر
   * Validates: Requirements 4.3
   */
  test('Property 22: منع التسليم المكرر', async () => {
    await fc.assert(
      fc.asyncProperty(
        createAssignmentDtoArb,
        submitAssignmentDtoArb,
        async (assignmentData, submissionData) => {
          // إنشاء واجب
          const modifiedAssignmentData = {
            ...assignmentData,
            subjectId: testSubjectId
          };

          const assignment = await assignmentService.createAssignment(modifiedAssignmentData, testUserId);
          
          // نشر الواجب
          await assignmentService.publishAssignment(assignment.id, testUserId);

          // التسليم الأول
          await assignmentService.submitAssignment(
            assignment.id,
            testStudentId,
            submissionData
          );

          // محاولة التسليم الثاني يجب أن تفشل
          await expect(
            assignmentService.submitAssignment(
              assignment.id,
              testStudentId,
              submissionData
            )
          ).rejects.toThrow('Assignment already submitted');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Feature: smart-edu-backend, Property 23: التحقق من صلاحيات التقييم
   * Validates: Requirements 4.5
   */
  test('Property 23: التحقق من صلاحيات التقييم', async () => {
    await fc.assert(
      fc.asyncProperty(
        createAssignmentDtoArb,
        submitAssignmentDtoArb,
        gradeSubmissionDtoArb,
        async (assignmentData, submissionData, gradeData) => {
          // إنشاء معلم آخر
          const otherTeacher = await prisma.user.create({
            data: {
              email: `other-teacher-${Date.now()}@example.com`,
              passwordHash: 'hashed_password',
              firstName: 'Other',
              lastName: 'Teacher',
              role: 'teacher'
            }
          });

          try {
            // إنشاء واجب بواسطة المعلم الأول
            const modifiedAssignmentData = {
              ...assignmentData,
              subjectId: testSubjectId
            };

            const assignment = await assignmentService.createAssignment(modifiedAssignmentData, testUserId);
            
            // نشر الواجب
            await assignmentService.publishAssignment(assignment.id, testUserId);

            // تسليم الواجب
            const submission = await assignmentService.submitAssignment(
              assignment.id,
              testStudentId,
              submissionData
            );

            // محاولة تقييم الواجب بواسطة معلم آخر يجب أن تفشل
            await expect(
              assignmentService.gradeSubmission(
                submission.id,
                otherTeacher.id,
                gradeData
              )
            ).rejects.toThrow('Access denied');

          } finally {
            // تنظيف المعلم الآخر
            await prisma.user.delete({
              where: { id: otherTeacher.id }
            });
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});