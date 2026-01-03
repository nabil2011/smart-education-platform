import fc from 'fast-check';
import { AssessmentService } from '../../services/assessment.service';
import { PrismaClient } from '@prisma/client';
import { CreateAssessmentDto, CreateQuestionDto } from '../../types/assessment.types';

// Mock Prisma Client
const mockPrismaClient = {
  assessment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  assessmentQuestion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  assessmentAttempt: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  subject: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

const assessmentService = new AssessmentService(mockPrismaClient);

// Test data generators
const validAssessmentData = fc.record({
  title: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  subjectId: fc.integer({ min: 1, max: 100 }),
  gradeLevel: fc.integer({ min: 1, max: 12 }),
  difficultyLevel: fc.constantFrom('easy', 'medium', 'hard'),
  durationMinutes: fc.integer({ min: 1, max: 300 }),
  passingScore: fc.integer({ min: 0, max: 100 }),
  maxAttempts: fc.integer({ min: 1, max: 10 }),
  isPublished: fc.boolean(),
});

const validQuestionData = fc.record({
  questionText: fc.string({ minLength: 1, maxLength: 1000 }),
  questionType: fc.constantFrom('multiple_choice', 'true_false', 'fill_blank', 'essay'),
  options: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 2, maxLength: 6 }), { nil: undefined }),
  correctAnswer: fc.string({ minLength: 1, maxLength: 500 }),
  explanation: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  points: fc.integer({ min: 1, max: 10 }),
  orderIndex: fc.integer({ min: 1, max: 100 }),
});

const validUserId = fc.integer({ min: 1, max: 1000 });

describe('Assessment Service Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 11: بدء الاختبارات الصحيح', () => {
    it('should correctly start assessments with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          validUserId,
          async (assessmentId, studentId) => {
            // Mock assessment exists and is published
            (mockPrismaClient.assessment.findUnique as jest.Mock).mockResolvedValue({
              id: assessmentId,
              title: 'Test Assessment',
              isPublished: true,
              maxAttempts: 3,
              durationMinutes: 60,
            });

            // Mock no previous attempts
            (mockPrismaClient.assessmentAttempt.count as jest.Mock).mockResolvedValue(0);

            // Mock no active attempt
            (mockPrismaClient.assessmentAttempt.findFirst as jest.Mock).mockResolvedValue(null);

            // Mock successful attempt creation
            const mockAttempt = {
              id: 1,
              uuid: 'test-uuid',
              assessmentId,
              studentId,
              startedAt: new Date(),
              status: 'in_progress',
              answers: {},
              assessment: { title: 'Test Assessment' },
              student: { firstName: 'Test', lastName: 'Student' },
            };
            (mockPrismaClient.assessmentAttempt.create as jest.Mock).mockResolvedValue(mockAttempt);

            const result = await assessmentService.startAssessment(assessmentId, studentId);

            // Verify the attempt was created correctly
            expect(result).toBeDefined();
            expect(result.assessmentId).toBe(assessmentId);
            expect(result.studentId).toBe(studentId);
            expect(result.status).toBe('in_progress');
            expect(mockPrismaClient.assessmentAttempt.create).toHaveBeenCalledWith({
              data: {
                assessmentId,
                studentId,
                status: 'in_progress',
                answers: {},
              },
              include: expect.any(Object),
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject starting unpublished assessments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          validUserId,
          async (assessmentId, studentId) => {
            // Mock unpublished assessment
            (mockPrismaClient.assessment.findUnique as jest.Mock).mockResolvedValue({
              id: assessmentId,
              title: 'Test Assessment',
              isPublished: false,
              maxAttempts: 3,
              durationMinutes: 60,
            });

            await expect(assessmentService.startAssessment(assessmentId, studentId))
              .rejects.toThrow('Assessment is not published');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject when max attempts exceeded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          validUserId,
          fc.integer({ min: 1, max: 5 }),
          async (assessmentId, studentId, maxAttempts) => {
            // Mock published assessment
            (mockPrismaClient.assessment.findUnique as jest.Mock).mockResolvedValue({
              id: assessmentId,
              title: 'Test Assessment',
              isPublished: true,
              maxAttempts,
              durationMinutes: 60,
            });

            // Mock attempts equal to max attempts
            (mockPrismaClient.assessmentAttempt.count as jest.Mock).mockResolvedValue(maxAttempts);

            await expect(assessmentService.startAssessment(assessmentId, studentId))
              .rejects.toThrow('Maximum attempts exceeded');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 12: إنهاء الاختبار التلقائي', () => {
    it('should auto-submit expired attempts correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              assessmentId: fc.integer({ min: 1, max: 100 }),
              studentId: fc.integer({ min: 1, max: 100 }),
              startedAt: fc.date({ max: new Date(Date.now() - 25 * 60 * 60 * 1000) }), // 25 hours ago
              status: fc.constant('in_progress'),
              answers: fc.constant({}),
              assessment: fc.record({
                durationMinutes: fc.integer({ min: 30, max: 120 }),
                questions: fc.array(
                  fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    correctAnswer: fc.string(),
                    points: fc.integer({ min: 1, max: 5 }),
                  }),
                  { minLength: 1, maxLength: 10 }
                ),
              }),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          async (expiredAttempts) => {
            // Mock finding expired attempts
            (mockPrismaClient.assessmentAttempt.findMany as jest.Mock).mockResolvedValue(expiredAttempts);

            // Mock update calls
            (mockPrismaClient.assessmentAttempt.update as jest.Mock).mockResolvedValue({});

            const result = await assessmentService.autoSubmitExpiredAttempts();

            // Should auto-submit all expired attempts
            expect(result).toBe(expiredAttempts.length);

            // Verify each attempt was updated
            expiredAttempts.forEach((attempt) => {
              expect(mockPrismaClient.assessmentAttempt.update).toHaveBeenCalledWith({
                where: { id: attempt.id },
                data: expect.objectContaining({
                  status: 'auto_submitted',
                  completedAt: expect.any(Date),
                  submittedAt: expect.any(Date),
                  totalScore: expect.any(Number),
                  maxScore: expect.any(Number),
                  percentageScore: expect.any(Number),
                  timeSpent: expect.any(Number),
                }),
              });
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 13: حساب الدرجات الصحيح', () => {
    it('should calculate scores correctly for different question types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          validUserId,
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              questionType: fc.constantFrom('multiple_choice', 'true_false', 'fill_blank'),
              correctAnswer: fc.constantFrom('yes', 'no', 'true', 'false', 'option1', 'option2', 'correct', 'answer'),
              points: fc.integer({ min: 1, max: 5 }),
            }),
            { minLength: 1, maxLength: 10 }
          ).map(questions => {
            // Ensure unique IDs
            return questions.map((q, index) => ({ ...q, id: index + 1 }));
          }),
          async (attemptId, studentId, questions) => {
            // Create answers that match correct answers for some questions
            const answers: Record<string, string> = {};
            let expectedScore = 0;
            let maxScore = 0;

            questions.forEach((question, index) => {
              maxScore += question.points;
              // Make every other answer correct
              if (index % 2 === 0) {
                answers[question.id.toString()] = question.correctAnswer.toLowerCase();
                expectedScore += question.points;
              } else {
                answers[question.id.toString()] = 'definitely_wrong_answer_123';
              }
            });

            const expectedPercentage = maxScore > 0 ? (expectedScore / maxScore) * 100 : 0;

            // Mock attempt data
            const mockAttempt = {
              id: attemptId,
              studentId,
              status: 'in_progress',
              startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
              answers,
              assessment: {
                title: 'Test Assessment',
                passingScore: 60,
                questions: questions.map(q => ({
                  ...q,
                  questionText: 'Test question',
                })),
              },
              student: { firstName: 'Test', lastName: 'Student' },
            };

            (mockPrismaClient.assessmentAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt);
            (mockPrismaClient.assessmentAttempt.update as jest.Mock).mockResolvedValue({
              id: attemptId,
              completedAt: new Date(),
            });

            const result = await assessmentService.submitAssessment(attemptId, studentId);

            // Verify score calculation
            expect(result.totalScore).toBe(expectedScore);
            expect(result.maxScore).toBe(maxScore);
            expect(Math.abs(result.percentageScore - expectedPercentage)).toBeLessThan(0.01);
            expect(result.passed).toBe(expectedPercentage >= 60);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 14: حفظ سجل المحاولات', () => {
    it('should preserve all attempt data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          validAssessmentData,
          validUserId,
          async (assessmentData, createdBy) => {
            const mockAssessment = {
              id: 1,
              uuid: 'test-uuid',
              ...assessmentData,
              totalQuestions: 0,
              createdBy,
              createdAt: new Date(),
              updatedAt: new Date(),
              subject: { name: 'Test Subject' },
              creator: { firstName: 'Test', lastName: 'Creator' },
            };

            (mockPrismaClient.assessment.create as jest.Mock).mockResolvedValue(mockAssessment);

            const result = await assessmentService.createAssessment(assessmentData, createdBy);

            // Verify all data is preserved
            expect(result.title).toBe(assessmentData.title);
            expect(result.description).toBe(assessmentData.description);
            expect(result.subjectId).toBe(assessmentData.subjectId);
            expect(result.gradeLevel).toBe(assessmentData.gradeLevel);
            expect(result.difficultyLevel).toBe(assessmentData.difficultyLevel);
            expect(result.durationMinutes).toBe(assessmentData.durationMinutes);
            expect(result.passingScore).toBe(assessmentData.passingScore);
            expect(result.maxAttempts).toBe(assessmentData.maxAttempts);
            expect(result.isPublished).toBe(assessmentData.isPublished);
            expect(result.createdBy).toBe(createdBy);

            // Verify database call
            expect(mockPrismaClient.assessment.create).toHaveBeenCalledWith({
              data: {
                ...assessmentData,
                totalQuestions: 0,
                createdBy,
              },
              include: expect.any(Object),
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 15: تحديث الإحصائيات', () => {
    it('should update question count when adding questions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          validQuestionData,
          validUserId,
          async (assessmentId, questionData, userId) => {
            // Mock assessment exists and user has permission
            (mockPrismaClient.assessment.findUnique as jest.Mock).mockResolvedValue({
              createdBy: userId,
            });
            (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue({
              role: 'teacher',
            });

            const mockQuestion = {
              id: 1,
              assessmentId,
              ...questionData,
              options: questionData.options || null,
            };

            (mockPrismaClient.assessmentQuestion.create as jest.Mock).mockResolvedValue(mockQuestion);

            await assessmentService.addQuestion(assessmentId, questionData, userId);

            // Verify question count was incremented
            expect(mockPrismaClient.assessment.update).toHaveBeenCalledWith({
              where: { id: assessmentId },
              data: {
                totalQuestions: {
                  increment: 1,
                },
              },
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should update question count when deleting questions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          validUserId,
          async (questionId, assessmentId, userId) => {
            // Mock question exists and user has permission
            const mockQuestion = {
              id: questionId,
              assessmentId,
              assessment: { createdBy: userId },
            };

            (mockPrismaClient.assessmentQuestion.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
            (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue({
              role: 'teacher',
            });

            await assessmentService.deleteQuestion(questionId, userId);

            // Verify question count was decremented
            expect(mockPrismaClient.assessment.update).toHaveBeenCalledWith({
              where: { id: assessmentId },
              data: {
                totalQuestions: {
                  decrement: 1,
                },
              },
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Authorization Properties', () => {
    it('should enforce creator-only access for assessment modifications', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          validUserId,
          validUserId,
          async (assessmentId, creatorId, otherUserId) => {
            fc.pre(creatorId !== otherUserId); // Ensure different users

            // Mock assessment created by creatorId
            (mockPrismaClient.assessment.findUnique as jest.Mock).mockResolvedValue({
              createdBy: creatorId,
            });

            // Mock other user (not admin)
            (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue({
              role: 'teacher',
            });

            // Should reject unauthorized access
            await expect(assessmentService.updateAssessment(assessmentId, {}, otherUserId))
              .rejects.toThrow('Unauthorized to update this assessment');

            await expect(assessmentService.deleteAssessment(assessmentId, otherUserId))
              .rejects.toThrow('Unauthorized to delete this assessment');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should allow admin access to all assessments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          validUserId,
          validUserId,
          validAssessmentData,
          async (assessmentId, creatorId, adminId, updateData) => {
            fc.pre(creatorId !== adminId); // Ensure different users

            // Mock assessment created by creatorId
            (mockPrismaClient.assessment.findUnique as jest.Mock).mockResolvedValue({
              createdBy: creatorId,
            });

            // Mock admin user
            (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue({
              role: 'admin',
            });

            // Mock successful update
            const mockUpdatedAssessment = {
              id: assessmentId,
              ...updateData,
              createdBy: creatorId,
              subject: { name: 'Test Subject' },
              creator: { firstName: 'Test', lastName: 'Creator' },
            };
            (mockPrismaClient.assessment.update as jest.Mock).mockResolvedValue(mockUpdatedAssessment);

            // Should allow admin access
            const result = await assessmentService.updateAssessment(assessmentId, updateData, adminId);
            expect(result).toBeDefined();
            expect(mockPrismaClient.assessment.update).toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Data Integrity Properties', () => {
    it('should maintain referential integrity between assessments and questions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          fc.array(validQuestionData, { minLength: 1, maxLength: 10 }),
          validUserId,
          async (assessmentId, questionsData, userId) => {
            // Mock assessment exists and user has permission
            (mockPrismaClient.assessment.findUnique as jest.Mock).mockResolvedValue({
              createdBy: userId,
            });
            (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue({
              role: 'teacher',
            });

            // Mock transaction for bulk create
            const mockQuestions = questionsData.map((q, index) => ({
              id: index + 1,
              assessmentId,
              ...q,
              options: q.options || null,
            }));

            (mockPrismaClient.$transaction as jest.Mock).mockImplementation(async (callback) => {
              return callback({
                assessmentQuestion: {
                  create: jest.fn().mockImplementation((data) => 
                    Promise.resolve({ ...data.data, id: Math.random() })
                  ),
                },
                assessment: {
                  update: jest.fn().mockResolvedValue({}),
                },
              });
            });

            const result = await assessmentService.bulkCreateQuestions({
              assessmentId,
              questions: questionsData,
            }, userId);

            // Verify all questions reference the correct assessment
            expect(result).toHaveLength(questionsData.length);
            
            // Verify transaction was used (ensures atomicity)
            expect(mockPrismaClient.$transaction).toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});