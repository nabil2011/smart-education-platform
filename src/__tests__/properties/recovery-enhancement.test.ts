import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { RecoveryPlanService } from '../../services/recovery-plan.service';
import { EnhancementPlanService } from '../../services/enhancement-plan.service';
import {
  CreateRecoveryPlanDto,
  CreateEnhancementPlanDto,
  AssignPlanDto,
  UpdateProgressDto,
  RecoveryPlanFilters,
  EnhancementPlanFilters,
  ProgressFilters
} from '../../types/recovery-enhancement.types';

// Mock Prisma Client
const mockPrismaClient = {
  recoveryPlan: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn()
  },
  enhancementPlan: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn()
  },
  studentRecoveryProgress: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  },
  studentEnhancementProgress: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  }
} as unknown as PrismaClient;

describe('Recovery and Enhancement Plans - Property-Based Tests', () => {
  let recoveryPlanService: RecoveryPlanService;
  let enhancementPlanService: EnhancementPlanService;

  beforeAll(() => {
    recoveryPlanService = new RecoveryPlanService(mockPrismaClient);
    enhancementPlanService = new EnhancementPlanService(mockPrismaClient);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Fast-check generators
  const activityItemGenerator = fc.record({
    id: fc.string(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    type: fc.constantFrom('reading', 'exercise', 'video', 'quiz', 'project', 'discussion'),
    duration: fc.option(fc.integer({ min: 1, max: 300 }), { nil: undefined }),
    difficulty: fc.option(fc.constantFrom('easy', 'medium', 'hard'), { nil: undefined }),
    resources: fc.option(fc.array(fc.string()), { nil: undefined }),
    isRequired: fc.boolean()
  });

  const resourceItemGenerator = fc.record({
    id: fc.string(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom('file', 'url', 'book', 'video', 'audio'),
    url: fc.option(fc.webUrl(), { nil: undefined }),
    filePath: fc.option(fc.string(), { nil: undefined }),
    description: fc.option(fc.string(), { nil: undefined }),
    isRequired: fc.boolean()
  });

  const activityProgressGenerator = fc.record({
    activityId: fc.string(),
    completed: fc.boolean(),
    completedAt: fc.option(fc.date(), { nil: undefined }),
    timeSpent: fc.option(fc.integer({ min: 0, max: 300 }), { nil: undefined }),
    score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined })
  });

  const recoveryPlanGenerator = fc.record({
    title: fc.string({ minLength: 1, maxLength: 255 }),
    description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
    subjectId: fc.integer({ min: 1, max: 100 }),
    gradeLevel: fc.integer({ min: 1, max: 12 }),
    weekNumber: fc.integer({ min: 1, max: 52 }),
    difficulty: fc.constantFrom('easy', 'medium', 'hard'),
    objectives: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 200 }), { maxLength: 10 }), { nil: undefined }),
    activities: fc.option(fc.array(activityItemGenerator, { maxLength: 20 }), { nil: undefined }),
    resources: fc.option(fc.array(resourceItemGenerator, { maxLength: 15 }), { nil: undefined }),
    estimatedHours: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined })
  });

  const enhancementPlanGenerator = fc.record({
    title: fc.string({ minLength: 1, maxLength: 255 }),
    description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
    subjectId: fc.integer({ min: 1, max: 100 }),
    gradeLevel: fc.integer({ min: 1, max: 12 }),
    planType: fc.constantFrom('enrichment', 'acceleration', 'talent_development', 'advanced_skills', 'creative_thinking', 'leadership'),
    difficulty: fc.constantFrom('easy', 'medium', 'hard'),
    objectives: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 200 }), { maxLength: 10 }), { nil: undefined }),
    activities: fc.option(fc.array(activityItemGenerator, { maxLength: 20 }), { nil: undefined }),
    resources: fc.option(fc.array(resourceItemGenerator, { maxLength: 15 }), { nil: undefined }),
    estimatedHours: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
    prerequisites: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 200 }), { maxLength: 10 }), { nil: undefined })
  });

  const assignPlanGenerator = fc.record({
    studentId: fc.integer({ min: 1, max: 1000 }),
    planId: fc.integer({ min: 1, max: 1000 }),
    academicYear: fc.string({ minLength: 9, maxLength: 9 }).map(s => `${s.slice(0, 4)}-${s.slice(4)}`),
    notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
  });

  const progressUpdateGenerator = fc.record({
    status: fc.option(fc.constantFrom('assigned', 'in_progress', 'completed', 'paused', 'cancelled'), { nil: undefined }),
    progressData: fc.option(fc.array(activityProgressGenerator, { maxLength: 20 }), { nil: undefined }),
    completionRate: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined }),
    timeSpent: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
    notes: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined })
  });

  describe('Recovery Plans Service', () => {
    /**
     * Property 44: حفظ خطط التعويض الكاملة
     * يجب أن تحفظ جميع بيانات خطة التعويض بشكل صحيح
     */
    test('Property 44: Should save complete recovery plan data correctly', async () => {
      await fc.assert(fc.asyncProperty(
        recoveryPlanGenerator,
        fc.integer({ min: 1, max: 1000 }),
        async (planData: CreateRecoveryPlanDto, createdBy: number) => {
          // Mock successful creation
          const mockPlan = {
            id: 1,
            uuid: 'test-uuid',
            ...planData,
            createdBy,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            subject: { name: 'Math', nameAr: 'الرياضيات' },
            creator: { id: createdBy, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
            _count: { studentProgress: 0 }
          };

          (mockPrismaClient.recoveryPlan.create as jest.Mock).mockResolvedValue(mockPlan);

          const result = await recoveryPlanService.createRecoveryPlan(planData, createdBy);

          // Verify all required fields are preserved
          expect(result.title).toBe(planData.title);
          expect(result.subjectId).toBe(planData.subjectId);
          expect(result.gradeLevel).toBe(planData.gradeLevel);
          expect(result.weekNumber).toBe(planData.weekNumber);
          expect(result.createdBy).toBe(createdBy);
          expect(result.isActive).toBe(true);

          // Verify optional fields
          if (planData.description) {
            expect(result.description).toBe(planData.description);
          }
          if (planData.objectives) {
            expect(result.objectives).toEqual(planData.objectives);
          }
          if (planData.activities) {
            expect(result.activities).toEqual(planData.activities);
          }
          if (planData.resources) {
            expect(result.resources).toEqual(planData.resources);
          }
        }
      ), { numRuns: 50 });
    });

    /**
     * Property 45: دعم أنواع الملفات المتعددة
     * يجب أن تدعم خطط التعويض أنواع مختلفة من الموارد والملفات
     */
    test('Property 45: Should support multiple file types in resources', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(resourceItemGenerator, { minLength: 1, maxLength: 10 }),
        async (resources) => {
          const planData: CreateRecoveryPlanDto = {
            title: 'Test Plan',
            subjectId: 1,
            gradeLevel: 5,
            weekNumber: 1,
            resources
          };

          const mockPlan = {
            id: 1,
            uuid: 'test-uuid',
            ...planData,
            createdBy: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            subject: { name: 'Math', nameAr: 'الرياضيات' },
            creator: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
            _count: { studentProgress: 0 }
          };

          (mockPrismaClient.recoveryPlan.create as jest.Mock).mockResolvedValue(mockPlan);

          const result = await recoveryPlanService.createRecoveryPlan(planData, 1);

          // Verify all resource types are supported
          expect(result.resources).toEqual(resources);
          
          // Verify each resource maintains its type and properties
          if (result.resources && Array.isArray(result.resources)) {
            result.resources.forEach((resource: any, index: number) => {
              expect(resource.type).toBe(resources[index].type);
              expect(resource.isRequired).toBe(resources[index].isRequired);
            });
          }
        }
      ), { numRuns: 30 });
    });

    /**
     * Property 46: ترتيب وفلترة الخطط
     * يجب أن تدعم فلترة وترتيب خطط التعويض حسب معايير مختلفة
     */
    test('Property 46: Should support filtering and sorting recovery plans', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          subjectId: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
          gradeLevel: fc.option(fc.integer({ min: 1, max: 12 }), { nil: undefined }),
          weekNumber: fc.option(fc.integer({ min: 1, max: 52 }), { nil: undefined }),
          difficulty: fc.option(fc.constantFrom('easy', 'medium', 'hard'), { nil: undefined }),
          isActive: fc.option(fc.boolean(), { nil: undefined }),
          search: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          page: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
          limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined })
        }),
        async (filters: RecoveryPlanFilters) => {
          const mockPlans = [
            {
              id: 1,
              title: 'Plan 1',
              gradeLevel: filters.gradeLevel || 5,
              weekNumber: filters.weekNumber || 1,
              difficulty: filters.difficulty || 'medium',
              isActive: filters.isActive !== undefined ? filters.isActive : true,
              subject: { name: 'Math', nameAr: 'الرياضيات' },
              creator: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
              _count: { studentProgress: 0 }
            }
          ];

          (mockPrismaClient.recoveryPlan.findMany as jest.Mock).mockResolvedValue(mockPlans);
          (mockPrismaClient.recoveryPlan.count as jest.Mock).mockResolvedValue(1);

          const result = await recoveryPlanService.getRecoveryPlans(filters);

          // Verify pagination
          expect(result.page).toBe(filters.page || 1);
          expect(result.limit).toBe(filters.limit || 20);
          expect(result.total).toBeGreaterThanOrEqual(0);
          expect(result.totalPages).toBeGreaterThanOrEqual(0);

          // Verify plans array
          expect(Array.isArray(result.plans)).toBe(true);
        }
      ), { numRuns: 30 });
    });

    /**
     * Property 47: تعديل وحذف الخطط
     * يجب أن تدعم تعديل وحذف (إلغاء تفعيل) خطط التعويض
     */
    test('Property 47: Should support updating and deleting recovery plans', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 255 }), { nil: undefined }),
          description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
          isActive: fc.option(fc.boolean(), { nil: undefined })
        }),
        async (planId: number, updateData) => {
          const mockUpdatedPlan = {
            id: planId,
            uuid: 'test-uuid',
            title: updateData.title || 'Original Title',
            description: updateData.description || 'Original Description',
            subjectId: 1,
            gradeLevel: 5,
            weekNumber: 1,
            isActive: updateData.isActive !== undefined ? updateData.isActive : true,
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            subject: { name: 'Math', nameAr: 'الرياضيات' },
            creator: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
            _count: { studentProgress: 0 }
          };

          (mockPrismaClient.recoveryPlan.update as jest.Mock).mockResolvedValue(mockUpdatedPlan);

          // Test update
          const updateResult = await recoveryPlanService.updateRecoveryPlan(planId, updateData);
          expect(updateResult.id).toBe(planId);
          if (updateData.title) {
            expect(updateResult.title).toBe(updateData.title);
          }
          if (updateData.isActive !== undefined) {
            expect(updateResult.isActive).toBe(updateData.isActive);
          }

          // Test delete (deactivate)
          const mockDeletedPlan = { ...mockUpdatedPlan, isActive: false };
          (mockPrismaClient.recoveryPlan.update as jest.Mock).mockResolvedValue(mockDeletedPlan);

          const deleteResult = await recoveryPlanService.deleteRecoveryPlan(planId);
          expect(deleteResult.id).toBe(planId);
          expect(deleteResult.isActive).toBe(false);
        }
      ), { numRuns: 30 });
    });

    /**
     * Property 48: تتبع تقدم الطلاب في الخطط
     * يجب أن تتبع تقدم الطلاب في خطط التعويض بدقة
     */
    test('Property 48: Should track student progress in recovery plans accurately', async () => {
      await fc.assert(fc.asyncProperty(
        assignPlanGenerator,
        fc.integer({ min: 1, max: 1000 }),
        progressUpdateGenerator,
        async (assignmentData: AssignPlanDto, assignedBy: number, progressUpdate: UpdateProgressDto) => {
          // Mock assignment creation
          const mockAssignment = {
            id: 1,
            studentId: assignmentData.studentId,
            recoveryPlanId: assignmentData.planId,
            assignedAt: new Date(),
            status: 'assigned',
            academicYear: assignmentData.academicYear,
            assignedBy,
            student: { id: assignmentData.studentId, firstName: 'Test', lastName: 'Student', email: 'student@test.com' },
            recoveryPlan: { id: assignmentData.planId, title: 'Test Plan', gradeLevel: 5, weekNumber: 1 },
            assignedByUser: { id: assignedBy, firstName: 'Test', lastName: 'Teacher', email: 'teacher@test.com' }
          };

          (mockPrismaClient.studentRecoveryProgress.findFirst as jest.Mock).mockResolvedValue(null);
          (mockPrismaClient.studentRecoveryProgress.create as jest.Mock).mockResolvedValue(mockAssignment);

          const assignment = await recoveryPlanService.assignRecoveryPlan(assignmentData, assignedBy);

          // Verify assignment
          expect(assignment.studentId).toBe(assignmentData.studentId);
          expect(assignment.recoveryPlanId).toBe(assignmentData.planId);
          expect(assignment.academicYear).toBe(assignmentData.academicYear);
          expect(assignment.assignedBy).toBe(assignedBy);

          // Mock progress update
          const mockUpdatedProgress = {
            ...mockAssignment,
            ...progressUpdate,
            completionRate: progressUpdate.completionRate || 0,
            status: progressUpdate.status || 'assigned'
          };

          (mockPrismaClient.studentRecoveryProgress.update as jest.Mock).mockResolvedValue(mockUpdatedProgress);

          const updatedProgress = await recoveryPlanService.updateStudentProgress(1, progressUpdate);

          // Verify progress tracking
          if (progressUpdate.status) {
            expect(updatedProgress.status).toBe(progressUpdate.status);
          }
          if (progressUpdate.completionRate !== undefined) {
            expect(updatedProgress.completionRate).toBe(progressUpdate.completionRate);
          }
          if (progressUpdate.timeSpent !== undefined) {
            expect(updatedProgress.timeSpent).toBe(progressUpdate.timeSpent);
          }
        }
      ), { numRuns: 30 });
    });
  });

  describe('Enhancement Plans Service', () => {
    /**
     * Property 49: تعيين خطط التعزيز للطلاب
     * يجب أن تدعم تعيين خطط التعزيز للطلاب المتفوقين
     */
    test('Property 49: Should assign enhancement plans to students correctly', async () => {
      await fc.assert(fc.asyncProperty(
        assignPlanGenerator,
        fc.integer({ min: 1, max: 1000 }),
        async (assignmentData: AssignPlanDto, assignedBy: number) => {
          const mockAssignment = {
            id: 1,
            studentId: assignmentData.studentId,
            enhancementPlanId: assignmentData.planId,
            assignedAt: new Date(),
            status: 'assigned',
            academicYear: assignmentData.academicYear,
            assignedBy,
            student: { 
              id: assignmentData.studentId, 
              firstName: 'Test', 
              lastName: 'Student', 
              email: 'student@test.com',
              studentProfile: { studentId: 'STU001', gradeLevel: 5 }
            },
            enhancementPlan: { 
              id: assignmentData.planId, 
              title: 'Advanced Math', 
              gradeLevel: 5, 
              planType: 'advanced_skills',
              subject: { name: 'Math', nameAr: 'الرياضيات' }
            },
            assignedByUser: { id: assignedBy, firstName: 'Test', lastName: 'Teacher', email: 'teacher@test.com' }
          };

          (mockPrismaClient.studentEnhancementProgress.findFirst as jest.Mock).mockResolvedValue(null);
          (mockPrismaClient.studentEnhancementProgress.create as jest.Mock).mockResolvedValue(mockAssignment);

          const assignment = await enhancementPlanService.assignEnhancementPlan(assignmentData, assignedBy);

          // Verify assignment properties
          expect(assignment.studentId).toBe(assignmentData.studentId);
          expect(assignment.enhancementPlanId).toBe(assignmentData.planId);
          expect(assignment.academicYear).toBe(assignmentData.academicYear);
          expect(assignment.assignedBy).toBe(assignedBy);
          expect(assignment.status).toBe('assigned');

          // Verify related data is included
          expect(assignment.student).toBeDefined();
          expect(assignment.enhancementPlan).toBeDefined();
          expect(assignment.assignedByUser).toBeDefined();
        }
      ), { numRuns: 30 });
    });

    /**
     * Property 50: تقارير فعالية الخطط
     * يجب أن تنتج تقارير دقيقة عن فعالية خطط التعزيز
     */
    test('Property 50: Should generate accurate plan effectiveness reports', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 50 }),
        fc.float({ min: 0, max: 100 }),
        fc.float({ min: 0, max: 1000 }).filter(n => !isNaN(n)),
        async (planId: number, totalAssignments: number, completedAssignments: number, avgCompletion: number, avgTime: number) => {
          // Ensure completed <= total
          const actualCompleted = Math.min(completedAssignments, totalAssignments);

          const mockPlan = { title: 'Test Enhancement Plan' };
          (mockPrismaClient.enhancementPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
          (mockPrismaClient.studentEnhancementProgress.count as jest.Mock)
            .mockResolvedValueOnce(totalAssignments)
            .mockResolvedValueOnce(actualCompleted);
          (mockPrismaClient.studentEnhancementProgress.aggregate as jest.Mock)
            .mockResolvedValueOnce({ _avg: { completionRate: avgCompletion } })
            .mockResolvedValueOnce({ _avg: { timeSpent: avgTime } });

          const report = await enhancementPlanService.getPlanEffectivenessReport(planId);

          // Verify report structure
          expect(report.planId).toBe(planId);
          expect(report.planTitle).toBe('Test Enhancement Plan');
          expect(report.planType).toBe('enhancement');
          expect(report.totalAssignments).toBe(totalAssignments);
          expect(report.completedAssignments).toBe(actualCompleted);
          expect(report.averageCompletionRate).toBe(avgCompletion);
          expect(report.averageTimeSpent).toBe(isNaN(avgTime) ? 0 : avgTime);

          // Verify effectiveness calculation
          expect(['high', 'medium', 'low']).toContain(report.effectiveness);
          
          // Verify recommendations array
          expect(Array.isArray(report.recommendations)).toBe(true);

          // Verify effectiveness logic
          if (avgCompletion >= 80) {
            expect(report.effectiveness).toBe('high');
          } else if (avgCompletion >= 60) {
            expect(report.effectiveness).toBe('medium');
          } else {
            expect(report.effectiveness).toBe('low');
          }
        }
      ), { numRuns: 30 });
    });

    /**
     * Property 51: حفظ خطط التعزيز الكاملة
     * يجب أن تحفظ جميع بيانات خطة التعزيز بما في ذلك المتطلبات المسبقة
     */
    test('Property 51: Should save complete enhancement plan data with prerequisites', async () => {
      await fc.assert(fc.asyncProperty(
        enhancementPlanGenerator,
        fc.integer({ min: 1, max: 1000 }),
        async (planData: CreateEnhancementPlanDto, createdBy: number) => {
          const mockPlan = {
            id: 1,
            uuid: 'test-uuid',
            ...planData,
            createdBy,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            subject: { name: 'Math', nameAr: 'الرياضيات' },
            creator: { id: createdBy, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
            _count: { studentProgress: 0 }
          };

          (mockPrismaClient.enhancementPlan.create as jest.Mock).mockResolvedValue(mockPlan);

          const result = await enhancementPlanService.createEnhancementPlan(planData, createdBy);

          // Verify all required fields
          expect(result.title).toBe(planData.title);
          expect(result.subjectId).toBe(planData.subjectId);
          expect(result.gradeLevel).toBe(planData.gradeLevel);
          expect(result.planType).toBe(planData.planType);
          expect(result.createdBy).toBe(createdBy);

          // Verify prerequisites are saved
          if (planData.prerequisites) {
            expect(result.prerequisites).toEqual(planData.prerequisites);
          }

          // Verify other optional fields
          if (planData.objectives) {
            expect(result.objectives).toEqual(planData.objectives);
          }
          if (planData.activities) {
            expect(result.activities).toEqual(planData.activities);
          }
          if (planData.resources) {
            expect(result.resources).toEqual(planData.resources);
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('Combined Recovery and Enhancement Plans', () => {
    /**
     * Property 52: ملخص شامل لخطط الطالب
     * يجب أن ينتج ملخصاً شاملاً يجمع خطط التعويض والتعزيز للطالب
     */
    test('Property 52: Should generate comprehensive student plan summary', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        fc.option(fc.string({ minLength: 9, maxLength: 9 }).map(s => `${s.slice(0, 4)}-${s.slice(4)}`)),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 15 }),
        async (studentId: number, academicYear: string | null, totalRecovery: number, totalEnhancement: number) => {
          // Mock recovery plan summary
          (mockPrismaClient.studentRecoveryProgress.count as jest.Mock)
            .mockResolvedValueOnce(totalRecovery)
            .mockResolvedValueOnce(Math.floor(totalRecovery * 0.7));
          (mockPrismaClient.studentRecoveryProgress.aggregate as jest.Mock)
            .mockResolvedValueOnce({ _avg: { completionRate: 75 } })
            .mockResolvedValueOnce({ _sum: { timeSpent: 300 } });
          (mockPrismaClient.studentRecoveryProgress.findMany as jest.Mock).mockResolvedValue([]);

          const recoverySummary = await recoveryPlanService.getStudentPlanSummary(studentId, academicYear || undefined);

          // Mock enhancement plan summary
          (mockPrismaClient.studentEnhancementProgress.count as jest.Mock)
            .mockResolvedValueOnce(totalEnhancement)
            .mockResolvedValueOnce(Math.floor(totalEnhancement * 0.8));
          (mockPrismaClient.studentEnhancementProgress.findMany as jest.Mock).mockResolvedValue([]);

          const enhancementSummary = await enhancementPlanService.getStudentEnhancementSummary(studentId, academicYear || undefined);

          // Verify recovery summary
          expect(recoverySummary.studentId).toBe(studentId);
          expect(recoverySummary.totalRecoveryPlans).toBe(totalRecovery);
          expect(recoverySummary.completedRecoveryPlans).toBeLessThanOrEqual(totalRecovery);
          expect(recoverySummary.averageCompletionRate).toBeGreaterThanOrEqual(0);
          expect(recoverySummary.totalTimeSpent).toBeGreaterThanOrEqual(0);

          // Verify enhancement summary
          if (enhancementSummary.totalEnhancementPlans !== undefined) {
            expect(enhancementSummary.totalEnhancementPlans).toBe(totalEnhancement);
            expect(enhancementSummary.completedEnhancementPlans).toBeLessThanOrEqual(totalEnhancement);
          }

          // Verify current plans structure
          expect(recoverySummary.currentPlans).toBeDefined();
          expect(Array.isArray(recoverySummary.currentPlans.recovery)).toBe(true);
          if (enhancementSummary.currentPlans) {
            expect(Array.isArray(enhancementSummary.currentPlans.enhancement)).toBe(true);
          }
        }
      ), { numRuns: 30 });
    });
  });
});