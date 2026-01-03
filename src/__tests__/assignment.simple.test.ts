import { PrismaClient } from '@prisma/client';
import { assignmentService } from '../services/assignment.service';
import { AssignmentType } from '../types/assignment.types';

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

describe('Assignment Service Simple Tests', () => {
  let testUserId: number;
  let testStudentId: number;
  let testSubjectId: number;

  beforeAll(async () => {
    try {
      // تنظيف البيانات أولاً
      await prisma.assignmentSubmission.deleteMany({});
      await prisma.assignment.deleteMany({});
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['test-teacher-simple@example.com', 'test-student-simple@example.com']
          }
        }
      });
      await prisma.subject.deleteMany({
        where: { name: 'Test Subject Simple' }
      });

      // إنشاء بيانات اختبار
      const testUser = await prisma.user.create({
        data: {
          email: 'test-teacher-simple@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'Teacher',
          role: 'teacher'
        }
      });
      testUserId = testUser.id;
      console.log('Created test teacher:', testUserId);

      const testStudent = await prisma.user.create({
        data: {
          email: 'test-student-simple@example.com',
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
      console.log('Created test student:', testStudentId);

      const testSubject = await prisma.subject.create({
        data: {
          name: 'Test Subject Simple',
          nameAr: 'مادة اختبار بسيطة',
          gradeLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }
      });
      testSubjectId = testSubject.id;
      console.log('Created test subject:', testSubjectId);

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
            in: ['test-teacher-simple@example.com', 'test-student-simple@example.com']
          }
        }
      });
      await prisma.subject.deleteMany({
        where: { name: 'Test Subject Simple' }
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

  test('should create assignment successfully', async () => {
    const assignmentData = {
      title: 'Test Assignment',
      description: 'Test Description',
      subjectId: testSubjectId,
      gradeLevel: 5,
      assignmentType: AssignmentType.HOMEWORK,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // أسبوع من الآن
      maxScore: 100
    };

    const assignment = await assignmentService.createAssignment(assignmentData, testUserId);

    expect(assignment).toBeDefined();
    expect(assignment.title).toBe(assignmentData.title);
    expect(assignment.subjectId).toBe(testSubjectId);
    expect(assignment.gradeLevel).toBe(5);
    expect(assignment.assignmentType).toBe(AssignmentType.HOMEWORK);
    expect(assignment.createdBy).toBe(testUserId);
  });

  test('should submit assignment successfully', async () => {
    // إنشاء واجب أولاً
    const assignmentData = {
      title: 'Test Assignment for Submission',
      subjectId: testSubjectId,
      gradeLevel: 5,
      assignmentType: AssignmentType.HOMEWORK,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    const assignment = await assignmentService.createAssignment(assignmentData, testUserId);
    
    // نشر الواجب
    await assignmentService.publishAssignment(assignment.id, testUserId);

    // تسليم الواجب
    const submissionData = {
      submissionText: 'This is my submission'
    };

    const submission = await assignmentService.submitAssignment(
      assignment.id,
      testStudentId,
      submissionData
    );

    expect(submission).toBeDefined();
    expect(submission.assignmentId).toBe(assignment.id);
    expect(submission.studentId).toBe(testStudentId);
    expect(submission.submissionText).toBe(submissionData.submissionText);
    expect(submission.isLate).toBe(false);
  });

  test('should grade assignment successfully', async () => {
    // إنشاء واجب
    const assignmentData = {
      title: 'Test Assignment for Grading',
      subjectId: testSubjectId,
      gradeLevel: 5,
      assignmentType: AssignmentType.HOMEWORK,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    const assignment = await assignmentService.createAssignment(assignmentData, testUserId);
    
    // نشر الواجب
    await assignmentService.publishAssignment(assignment.id, testUserId);

    // تسليم الواجب
    const submission = await assignmentService.submitAssignment(
      assignment.id,
      testStudentId,
      { submissionText: 'My submission' }
    );

    // تقييم الواجب
    const gradeData = {
      score: 85,
      feedback: 'Good work!'
    };

    const gradedSubmission = await assignmentService.gradeSubmission(
      submission.id,
      testUserId,
      gradeData
    );

    expect(gradedSubmission).toBeDefined();
    expect(gradedSubmission.score).toBe(85);
    expect(gradedSubmission.feedback).toBe('Good work!');
    expect(gradedSubmission.gradedBy).toBe(testUserId);
    expect(gradedSubmission.status).toBe('graded');
  });
});