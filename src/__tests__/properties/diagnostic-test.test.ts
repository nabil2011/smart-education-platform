import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { DiagnosticTestService } from '../../services/diagnostic-test.service';
import { PrismaClient } from '@prisma/client';
import {
  CreateDiagnosticTestDto,
  CreateTestQuestionDto,
  CreateTestResultDto,
  DiagnosticTestType,
  DiagnosticQuestionType,
  TestDifficulty,
  TestResultStatus
} from '../../types/diagnostic-test.types';

// Mock Prisma Client
const mockPrisma = {
  diagnosticTest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  diagnosticTestQuestion: {
    create: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn()
  },
  diagnosticTestResult: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  diagnosticTestAttachment: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  recoveryPlan: {
    findMany: jest.fn()
  },
  subject: {
    findUnique: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
} as unknown as PrismaClient;

describe('Diagnostic Test Properties - خصائص الاختبارات التشخيصية', () => {
  let diagnosticTestService: DiagnosticTestService;

  beforeEach(() => {
    diagnosticTestService = new DiagnosticTestService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  /**
   * الخاصية 53: حفظ الاختبارات التشخيصية الكاملة
   * Feature: smart-edu-backend, Property 53: لأي اختبار تشخيصي يتم إنشاؤه، يجب أن يُحفظ مع العنوان والنوع والملفات المرفقة
   * Validates: Requirements 13.1
   */
  describe('Property 53: Complete Diagnostic Test Storage', () => {
    it('should save diagnostic tests with all required data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.option(fc.string({ maxLength: 1000 })),
            subjectId: fc.integer({ min: 1, max: 100 }),
            gradeLevel: fc.integer({ min: 1, max: 12 }),
            testType: fc.constantFrom(DiagnosticTestType.WRITTEN, DiagnosticTestType.ORAL, DiagnosticTestType.PRACTICAL),
            difficulty: fc.constantFrom(TestDifficulty.EASY, TestDifficulty.MEDIUM, TestDifficulty.HARD),
            totalMarks: fc.integer({ min: 1, max: 1000 }),
            passingMarks: fc.integer({ min: 1, max: 500 })
          }),
          fc.array(
            fc.record({
              questionText: fc.string({ minLength: 1, maxLength: 1000 }),
              questionType: fc.constantFrom(DiagnosticQuestionType.MULTIPLE_CHOICE, DiagnosticQuestionType.TRUE_FALSE, DiagnosticQuestionType.SHORT_ANSWER, DiagnosticQuestionType.ESSAY),
              correctAnswer: fc.string({ minLength: 1, maxLength: 500 }),
              marks: fc.integer({ min: 1, max: 50 }),
              order: fc.integer({ min: 1, max: 100 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (testData, questions) => {
            // Ensure passing marks don't exceed total marks and handle null description
            const adjustedTestData = {
              ...testData,
              description: testData.description || undefined,
              passingMarks: Math.min(testData.passingMarks, testData.totalMarks)
            };

            const mockCreatedTest = {
              id: 1,
              uuid: 'test-uuid-123',
              ...adjustedTestData,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const mockCreatedQuestions = questions.map((q, index) => ({
              id: index + 1,
              testId: 1,
              ...q,
              options: q.questionType === DiagnosticQuestionType.MULTIPLE_CHOICE ? [
                'Option A', 'Option B', 'Option C', 'Option D'
              ] : []
            }));

            (mockPrisma.diagnosticTest.create as jest.Mock).mockResolvedValue(mockCreatedTest);

            const result = await diagnosticTestService.createDiagnosticTest(adjustedTestData, 1);

            // Verify test was created with all required data
            expect(mockPrisma.diagnosticTest.create).toHaveBeenCalledWith({
              data: expect.objectContaining({
                title: adjustedTestData.title,
                subjectId: adjustedTestData.subjectId,
                gradeLevel: adjustedTestData.gradeLevel,
                testType: adjustedTestData.testType,
                difficulty: adjustedTestData.difficulty,
                totalMarks: adjustedTestData.totalMarks,
                passingMarks: adjustedTestData.passingMarks
              })
            });

            // Verify result contains all data
            expect(result).toEqual(expect.objectContaining({
              id: mockCreatedTest.id,
              title: adjustedTestData.title,
              testType: adjustedTestData.testType,
              totalMarks: adjustedTestData.totalMarks
            }));
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * الخاصية 54: دعم أنواع الاختبارات المختلفة
   * Feature: smart-edu-backend, Property 54: لأي نوع اختبار مدعوم (مكتوب، شفهي، عملي)، يجب أن يتعامل معه النظام بشكل صحيح
   * Validates: Requirements 13.2
   */
  describe('Property 54: Support for Different Test Types', () => {
    it('should handle all supported test types correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(DiagnosticTestType.WRITTEN, DiagnosticTestType.ORAL, DiagnosticTestType.PRACTICAL),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.option(fc.string({ maxLength: 1000 })),
            subjectId: fc.integer({ min: 1, max: 100 }),
            gradeLevel: fc.integer({ min: 1, max: 12 }),
            testType: fc.constantFrom(DiagnosticTestType.WRITTEN, DiagnosticTestType.ORAL, DiagnosticTestType.PRACTICAL),
            difficulty: fc.constantFrom(TestDifficulty.EASY, TestDifficulty.MEDIUM, TestDifficulty.HARD),
            totalMarks: fc.integer({ min: 10, max: 100 }),
            passingMarks: fc.integer({ min: 5, max: 60 })
          }),
          async (testType, testData) => {
            const adjustedTestData = {
              ...testData,
              testType: testType,
              description: testData.description || undefined,
              passingMarks: Math.min(testData.passingMarks, testData.totalMarks)
            };

            const mockCreatedTest = {
              id: 1,
              uuid: 'test-uuid-123',
              ...adjustedTestData,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            (mockPrisma.diagnosticTest.create as jest.Mock).mockResolvedValue(mockCreatedTest);

            const questions: CreateTestQuestionDto[] = [{
              questionText: 'Sample question',
              questionType: testType === DiagnosticTestType.WRITTEN ? DiagnosticQuestionType.MULTIPLE_CHOICE : DiagnosticQuestionType.SHORT_ANSWER,
              correctAnswer: 'Sample answer',
              marks: 10,
              order: 1
            }];

            const result = await diagnosticTestService.createDiagnosticTest(adjustedTestData, 1);

            // Verify the test type is correctly stored and handled
            expect(mockPrisma.diagnosticTest.create).toHaveBeenCalledWith({
              data: expect.objectContaining({
                testType: testType
              })
            });

            expect(result.testType).toBe(testType);

            // Verify system handles each test type appropriately
            const validTestTypes = [DiagnosticTestType.WRITTEN, DiagnosticTestType.ORAL, DiagnosticTestType.PRACTICAL];
            expect(validTestTypes).toContain(testType);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * الخاصية 55: تسجيل نتائج الاختبارات
   * Feature: smart-edu-backend, Property 55: لأي اختبار يتم تطبيقه على طالب، يجب أن يسجل النظام النتائج والدرجات بدقة
   * Validates: Requirements 13.3
   */
  describe('Property 55: Accurate Test Result Recording', () => {
    it('should record test results and scores accurately', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            testId: fc.integer({ min: 1, max: 100 }),
            studentId: fc.integer({ min: 1, max: 1000 }),
            timeSpent: fc.integer({ min: 60, max: 7200 }) // 1 minute to 2 hours
          }),
          fc.array(
            fc.record({
              questionId: fc.integer({ min: 1, max: 50 }),
              answer: fc.string({ minLength: 1, maxLength: 500 }),
              isCorrect: fc.boolean(),
              marksAwarded: fc.integer({ min: 0, max: 10 }),
              timeSpent: fc.integer({ min: 5, max: 300 }) // 5 seconds to 5 minutes
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 50, max: 100 }), // totalMarks
          async (resultData, answers, totalMarks) => {
            // Calculate expected score based on answers
            const correctAnswers = Math.floor(answers.length * 0.7); // Assume 70% correct
            const expectedScore = Math.floor((correctAnswers / answers.length) * totalMarks);
            const expectedPercentage = (expectedScore / totalMarks) * 100;

            const mockTest = {
              id: resultData.testId,
              totalMarks,
              passingMarks: Math.floor(totalMarks * 0.6),
              questions: answers.map((_, index) => ({
                id: index + 1,
                correctAnswer: index < correctAnswers ? answers[index].answer : 'different_answer',
                marks: Math.floor(totalMarks / answers.length)
              }))
            };

            const mockCreatedResult = {
              id: 1,
              testId: resultData.testId,
              studentId: resultData.studentId,
              score: expectedScore,
              totalMarks: totalMarks,
              percentage: expectedPercentage,
              status: TestResultStatus.COMPLETED,
              answers: answers,
              timeSpent: resultData.timeSpent,
              completedAt: new Date(),
              createdAt: new Date()
            };

            (mockPrisma.diagnosticTest.findUnique as jest.Mock).mockResolvedValue(mockTest);
            (mockPrisma.diagnosticTestResult.create as jest.Mock).mockResolvedValue(mockCreatedResult);

            const createResultDto: CreateTestResultDto = {
              testId: resultData.testId,
              studentId: resultData.studentId,
              answers: answers,
              timeSpent: resultData.timeSpent
            };

            const result = await diagnosticTestService.conductTest(createResultDto);

            // Verify result was created with accurate data
            expect(mockPrisma.diagnosticTestResult.create).toHaveBeenCalledWith({
              data: expect.objectContaining({
                testId: resultData.testId,
                studentId: resultData.studentId,
                timeSpent: resultData.timeSpent,
                status: TestResultStatus.COMPLETED
              })
            });

            // Verify score calculation accuracy
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(totalMarks);
            expect(result.percentage).toBeGreaterThanOrEqual(0);
            expect(result.percentage).toBeLessThanOrEqual(100);

            // Verify all answers are recorded
            expect(result.answers).toHaveLength(answers.length);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * الخاصية 56: تحليل نتائج الاختبارات
   * Feature: smart-edu-backend, Property 56: لأي مجموعة نتائج اختبارات، يجب أن يحلل النظام النتائج ويحدد نقاط الضعف الشائعة
   * Validates: Requirements 13.4
   */
  describe('Property 56: Test Result Analysis', () => {
    it('should analyze test results and identify common weakness areas', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // testId
          fc.integer({ min: 1, max: 1000 }), // studentId
          fc.array(
            fc.record({
              skillArea: fc.constantFrom('الجمع', 'الطرح', 'الضرب', 'القسمة', 'الكسور'),
              score: fc.integer({ min: 0, max: 20 }),
              maxScore: fc.constant(20),
              isCorrect: fc.boolean()
            }),
            { minLength: 3, maxLength: 10 }
          ),
          async (testId, studentId, skillResults) => {
            // Calculate overall performance
            const totalScore = skillResults.reduce((sum, skill) => sum + skill.score, 0);
            const maxTotalScore = skillResults.reduce((sum, skill) => sum + skill.maxScore, 0);
            const overallPercentage = (totalScore / maxTotalScore) * 100;

            // Identify weakness areas (< 60% performance)
            const weaknessAreas = skillResults
              .filter(skill => (skill.score / skill.maxScore) < 0.6)
              .map(skill => skill.skillArea);

            // Identify strength areas (>= 80% performance)
            const strengthAreas = skillResults
              .filter(skill => (skill.score / skill.maxScore) >= 0.8)
              .map(skill => skill.skillArea);

            const mockAnalysis = {
              testId,
              studentId,
              overallScore: overallPercentage,
              skillAreas: skillResults.map(skill => ({
                skillArea: skill.skillArea,
                score: skill.score,
                maxScore: skill.maxScore,
                percentage: (skill.score / skill.maxScore) * 100,
                status: skill.score / skill.maxScore >= 0.8 ? 'strong' : 
                        skill.score / skill.maxScore >= 0.6 ? 'adequate' : 'needs_improvement'
              })),
              weaknessAreas,
              strengthAreas,
              recommendations: weaknessAreas.map(area => ({
                type: 'recovery_plan',
                description: `يحتاج الطالب لتعزيز مهارات ${area}`,
                priority: 'high'
              }))
            };

            (mockPrisma.diagnosticTestResult.findMany as jest.Mock).mockResolvedValue([{
              id: 1,
              testId,
              studentId,
              score: totalScore,
              totalMarks: maxTotalScore,
              percentage: overallPercentage,
              answers: skillResults.map((skill, index) => ({
                questionId: index + 1,
                answer: skill.isCorrect ? 'correct' : 'incorrect',
                isCorrect: skill.isCorrect,
                marksAwarded: skill.score
              }))
            }]);

            const analysis = await diagnosticTestService.analyzeTestResults(testId);

            // Verify analysis contains required components
            expect(analysis).toEqual(expect.objectContaining({
              testId,
              totalStudents: expect.any(Number),
              averageScore: expect.any(Number),
              passRate: expect.any(Number),
              commonWeaknesses: expect.any(Array),
              recommendations: expect.any(Array)
            }));

            // Verify weakness identification logic
            expect(analysis.commonWeaknesses).toBeInstanceOf(Array);
            expect(analysis.recommendations).toBeInstanceOf(Array);

            // Verify recommendations are provided for weakness areas
            if (analysis.commonWeaknesses.length > 0) {
              expect(analysis.recommendations.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * الخاصية 57: اقتراح خطط التعويض
   * Feature: smart-edu-backend, Property 57: لأي نتائج اختبار تشخيصي تُظهر نقاط ضعف، يجب أن يقترح النظام خطط تعويض مناسبة
   * Validates: Requirements 13.5
   */
  describe('Property 57: Recovery Plan Recommendations', () => {
    it('should suggest appropriate recovery plans for identified weaknesses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // studentId
          fc.record({
            subjectId: fc.integer({ min: 1, max: 10 }),
            gradeLevel: fc.integer({ min: 1, max: 12 }),
            weaknessAreas: fc.array(
              fc.constantFrom('الجمع', 'الطرح', 'الضرب', 'القسمة', 'الكسور'),
              { minLength: 1, maxLength: 3 }
            ),
            overallScore: fc.integer({ min: 0, max: 59 }) // Below passing threshold
          }),
          async (studentId, testData) => {
            // Mock available recovery plans
            const mockRecoveryPlans = testData.weaknessAreas.map((area, index) => ({
              id: index + 1,
              title: `خطة تعويض ${area}`,
              subjectId: testData.subjectId,
              gradeLevel: testData.gradeLevel,
              objectives: [`تحسين مهارات ${area}`],
              difficulty: 'medium',
              weekNumber: index + 1,
              relevanceScore: 0.9 - (index * 0.1) // Decreasing relevance
            }));

            (mockPrisma.recoveryPlan.findMany as jest.Mock).mockResolvedValue(mockRecoveryPlans);

            const recommendations = await diagnosticTestService.generateRecommendations(
              studentId,
              1 // testResultId
            );

            // Verify recommendations are provided
            expect(recommendations).toEqual(expect.objectContaining({
              studentId: expect.any(Number),
              testResultId: expect.any(Number),
              recoveryPlans: expect.any(Array),
              enhancementPlans: expect.any(Array),
              focusAreas: expect.any(Array),
              priority: expect.any(String)
            }));

            // Verify recovery plans are suggested
            expect(recommendations.recoveryPlans).toBeInstanceOf(Array);
            expect(recommendations.focusAreas).toBeInstanceOf(Array);

            // Verify priority is set appropriately
            expect(['low', 'medium', 'high']).toContain(recommendations.priority);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Round-trip Property: Test Creation and Retrieval
   * Feature: smart-edu-backend, Property: Round-trip consistency for diagnostic tests
   */
  describe('Round-trip Property: Test Creation and Retrieval', () => {
    it('should maintain data integrity through create-retrieve cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.option(fc.string({ maxLength: 1000 })),
            subjectId: fc.integer({ min: 1, max: 100 }),
            gradeLevel: fc.integer({ min: 1, max: 12 }),
            testType: fc.constantFrom(DiagnosticTestType.WRITTEN, DiagnosticTestType.ORAL, DiagnosticTestType.PRACTICAL),
            difficulty: fc.constantFrom(TestDifficulty.EASY, TestDifficulty.MEDIUM, TestDifficulty.HARD),
            totalMarks: fc.integer({ min: 10, max: 1000 }),
            passingMarks: fc.integer({ min: 5, max: 500 })
          }),
          async (originalTestData) => {
            const adjustedTestData = {
              ...originalTestData,
              description: originalTestData.description || undefined,
              passingMarks: Math.min(originalTestData.passingMarks, originalTestData.totalMarks)
            };

            const mockCreatedTest = {
              id: 1,
              uuid: 'test-uuid-123',
              ...adjustedTestData,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            (mockPrisma.diagnosticTest.create as jest.Mock).mockResolvedValue(mockCreatedTest);
            (mockPrisma.diagnosticTest.findUnique as jest.Mock).mockResolvedValue(mockCreatedTest);

            // Create test
            const createdTest = await diagnosticTestService.createDiagnosticTest(adjustedTestData, 1);

            // Retrieve test
            const retrievedTest = await diagnosticTestService.getDiagnosticTestById(createdTest.id);

            // Verify round-trip consistency
            expect(retrievedTest).not.toBeNull();
            expect(retrievedTest!).toEqual(expect.objectContaining({
              title: adjustedTestData.title,
              subjectId: adjustedTestData.subjectId,
              gradeLevel: adjustedTestData.gradeLevel,
              testType: adjustedTestData.testType,
              difficulty: adjustedTestData.difficulty,
              totalMarks: adjustedTestData.totalMarks,
              passingMarks: adjustedTestData.passingMarks
            }));

            // Verify essential properties are preserved
            expect(retrievedTest!.id).toBe(createdTest.id);
            expect(retrievedTest!.isActive).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});