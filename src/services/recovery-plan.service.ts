import { PrismaClient } from '@prisma/client';
import {
  CreateRecoveryPlanDto,
  UpdateRecoveryPlanDto,
  RecoveryPlanFilters,
  PaginatedRecoveryPlans,
  RecoveryPlanWithDetails,
  AssignPlanDto,
  UpdateProgressDto,
  StudentRecoveryProgressWithDetails,
  ProgressFilters,
  PaginatedRecoveryProgress,
  PlanStatistics,
  StudentPlanSummary
} from '../types/recovery-enhancement.types';

export class RecoveryPlanService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * إنشاء خطة تعويض جديدة
   * Validates: Requirements 11.1
   */
  async createRecoveryPlan(planData: CreateRecoveryPlanDto, createdBy: number): Promise<RecoveryPlanWithDetails> {
    try {
      const newPlan = await this.prisma.recoveryPlan.create({
        data: {
          ...planData,
          objectives: planData.objectives || [],
          activities: planData.activities as any || [],
          resources: planData.resources as any || [],
          createdBy
        },
        include: {
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              studentProgress: true
            }
          }
        }
      });

      return newPlan as RecoveryPlanWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to create recovery plan: ${error.message}`);
    }
  }

  /**
   * تحديث خطة تعويض
   * Validates: Requirements 11.2
   */
  async updateRecoveryPlan(planId: number, updateData: UpdateRecoveryPlanDto): Promise<RecoveryPlanWithDetails> {
    try {
      const updatedPlan = await this.prisma.recoveryPlan.update({
        where: { id: planId },
        data: {
          ...updateData,
          activities: updateData.activities as any,
          resources: updateData.resources as any
        },
        include: {
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              studentProgress: true
            }
          }
        }
      });

      return updatedPlan as RecoveryPlanWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to update recovery plan: ${error.message}`);
    }
  }

  /**
   * حذف خطة تعويض (إلغاء تفعيل)
   * Validates: Requirements 11.2
   */
  async deleteRecoveryPlan(planId: number): Promise<RecoveryPlanWithDetails> {
    try {
      const deletedPlan = await this.prisma.recoveryPlan.update({
        where: { id: planId },
        data: { isActive: false },
        include: {
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              studentProgress: true
            }
          }
        }
      });

      return deletedPlan as RecoveryPlanWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to delete recovery plan: ${error.message}`);
    }
  }

  /**
   * الحصول على قائمة خطط التعويض مع الفلترة والترقيم
   * Validates: Requirements 11.1, 11.3
   */
  async getRecoveryPlans(filters: RecoveryPlanFilters): Promise<PaginatedRecoveryPlans> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }

      if (filters.gradeLevel) {
        where.gradeLevel = filters.gradeLevel;
      }

      if (filters.weekNumber) {
        where.weekNumber = filters.weekNumber;
      }

      if (filters.difficulty) {
        where.difficulty = filters.difficulty;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search } },
          { description: { contains: filters.search } }
        ];
      }

      const [plans, total] = await Promise.all([
        this.prisma.recoveryPlan.findMany({
          where,
          include: {
            subject: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            _count: {
              select: {
                studentProgress: true
              }
            }
          },
          orderBy: [
            { gradeLevel: 'asc' },
            { weekNumber: 'asc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        this.prisma.recoveryPlan.count({ where })
      ]);

      return {
        plans: plans as RecoveryPlanWithDetails[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get recovery plans: ${error.message}`);
    }
  }

  /**
   * الحصول على خطة تعويض بالمعرف
   * Validates: Requirements 11.1
   */
  async getRecoveryPlanById(planId: number): Promise<RecoveryPlanWithDetails | null> {
    try {
      const plan = await this.prisma.recoveryPlan.findUnique({
        where: { id: planId },
        include: {
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              studentProgress: true
            }
          }
        }
      });

      return plan as RecoveryPlanWithDetails | null;
    } catch (error: any) {
      throw new Error(`Failed to get recovery plan: ${error.message}`);
    }
  }

  /**
   * تعيين خطة تعويض لطالب
   * Validates: Requirements 11.4
   */
  async assignRecoveryPlan(assignmentData: AssignPlanDto, assignedBy: number): Promise<StudentRecoveryProgressWithDetails> {
    try {
      // التحقق من عدم وجود تعيين سابق نشط
      const existingAssignment = await this.prisma.studentRecoveryProgress.findFirst({
        where: {
          studentId: assignmentData.studentId,
          recoveryPlanId: assignmentData.planId,
          academicYear: assignmentData.academicYear,
          status: {
            in: ['assigned', 'in_progress', 'paused']
          }
        }
      });

      if (existingAssignment) {
        throw new Error('Student already has an active assignment for this recovery plan');
      }

      const assignment = await this.prisma.studentRecoveryProgress.create({
        data: {
          studentId: assignmentData.studentId,
          recoveryPlanId: assignmentData.planId,
          academicYear: assignmentData.academicYear,
          notes: assignmentData.notes,
          assignedBy
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentProfile: {
                select: {
                  studentId: true,
                  gradeLevel: true
                }
              }
            }
          },
          recoveryPlan: {
            select: {
              id: true,
              title: true,
              description: true,
              subjectId: true,
              gradeLevel: true,
              weekNumber: true,
              estimatedHours: true,
              subject: {
                select: {
                  name: true,
                  nameAr: true
                }
              }
            }
          },
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return assignment as StudentRecoveryProgressWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to assign recovery plan: ${error.message}`);
    }
  }

  /**
   * تحديث تقدم الطالب في خطة التعويض
   * Validates: Requirements 11.5
   */
  async updateStudentProgress(progressId: number, updateData: UpdateProgressDto): Promise<StudentRecoveryProgressWithDetails> {
    try {
      // حساب معدل الإنجاز إذا تم تحديث بيانات التقدم
      let completionRate = updateData.completionRate;
      if (updateData.progressData && !completionRate) {
        const totalActivities = updateData.progressData.length;
        const completedActivities = updateData.progressData.filter(activity => activity.completed).length;
        completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
      }

      // تحديد حالة الإنجاز التلقائي
      let status = updateData.status;
      if (completionRate === 100 && !status) {
        status = 'completed';
      }

      const updatedProgress = await this.prisma.studentRecoveryProgress.update({
        where: { id: progressId },
        data: {
          ...updateData,
          progressData: updateData.progressData as any,
          completionRate,
          status,
          startedAt: updateData.status === 'in_progress' && !updateData.status ? new Date() : undefined,
          completedAt: status === 'completed' ? new Date() : undefined
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentProfile: {
                select: {
                  studentId: true,
                  gradeLevel: true
                }
              }
            }
          },
          recoveryPlan: {
            select: {
              id: true,
              title: true,
              description: true,
              subjectId: true,
              gradeLevel: true,
              weekNumber: true,
              estimatedHours: true,
              subject: {
                select: {
                  name: true,
                  nameAr: true
                }
              }
            }
          },
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return updatedProgress as StudentRecoveryProgressWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to update student progress: ${error.message}`);
    }
  }

  /**
   * الحصول على تقدم الطلاب في خطط التعويض
   * Validates: Requirements 11.5
   */
  async getStudentProgress(filters: ProgressFilters): Promise<PaginatedRecoveryProgress> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters.planId) {
        where.recoveryPlanId = filters.planId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.academicYear) {
        where.academicYear = filters.academicYear;
      }

      if (filters.assignedBy) {
        where.assignedBy = filters.assignedBy;
      }

      const [progress, total] = await Promise.all([
        this.prisma.studentRecoveryProgress.findMany({
          where,
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentProfile: {
                  select: {
                    studentId: true,
                    gradeLevel: true
                  }
                }
              }
            },
            recoveryPlan: {
              select: {
                id: true,
                title: true,
                description: true,
                subjectId: true,
                gradeLevel: true,
                weekNumber: true,
                estimatedHours: true,
                subject: {
                  select: {
                    name: true,
                    nameAr: true
                  }
                }
              }
            },
            assignedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.studentRecoveryProgress.count({ where })
      ]);

      return {
        progress: progress as StudentRecoveryProgressWithDetails[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get student progress: ${error.message}`);
    }
  }

  /**
   * الحصول على إحصائيات خطط التعويض
   * Validates: Requirements 11.3
   */
  async getRecoveryPlanStatistics(academicYear?: string): Promise<PlanStatistics> {
    try {
      const where: any = {};
      const progressWhere: any = {};

      if (academicYear) {
        progressWhere.academicYear = academicYear;
      }

      const [
        totalPlans,
        activePlans,
        totalAssignments,
        completedAssignments,
        avgCompletionData,
        avgTimeData,
        subjectStats,
        gradeStats
      ] = await Promise.all([
        this.prisma.recoveryPlan.count(where),
        this.prisma.recoveryPlan.count({ ...where, isActive: true }),
        this.prisma.studentRecoveryProgress.count(progressWhere),
        this.prisma.studentRecoveryProgress.count({ ...progressWhere, status: 'completed' }),
        this.prisma.studentRecoveryProgress.aggregate({
          where: progressWhere,
          _avg: { completionRate: true }
        }),
        this.prisma.studentRecoveryProgress.aggregate({
          where: progressWhere,
          _avg: { timeSpent: true }
        }),
        // Simplified subject stats without include
        [],
        this.prisma.recoveryPlan.groupBy({
          by: ['gradeLevel'],
          where,
          _count: { id: true }
        })
      ]);

      return {
        totalPlans,
        activePlans,
        totalAssignments,
        completedAssignments,
        averageCompletionRate: avgCompletionData._avg.completionRate || 0,
        averageTimeSpent: avgTimeData._avg.timeSpent || 0,
        subjectDistribution: [], // Will be populated with proper data
        gradeDistribution: gradeStats.map(stat => ({
          gradeLevel: stat.gradeLevel,
          planCount: stat._count.id,
          assignmentCount: 0 // Will be calculated separately
        }))
      };
    } catch (error: any) {
      throw new Error(`Failed to get recovery plan statistics: ${error.message}`);
    }
  }

  /**
   * الحصول على ملخص خطط الطالب
   * Validates: Requirements 11.5
   */
  async getStudentPlanSummary(studentId: number, academicYear?: string): Promise<StudentPlanSummary> {
    try {
      const where: any = { studentId };
      if (academicYear) {
        where.academicYear = academicYear;
      }

      const [
        totalRecoveryPlans,
        completedRecoveryPlans,
        avgCompletionData,
        avgTimeData,
        currentPlans
      ] = await Promise.all([
        this.prisma.studentRecoveryProgress.count(where),
        this.prisma.studentRecoveryProgress.count({ ...where, status: 'completed' }),
        this.prisma.studentRecoveryProgress.aggregate({
          where,
          _avg: { completionRate: true }
        }),
        this.prisma.studentRecoveryProgress.aggregate({
          where,
          _sum: { timeSpent: true }
        }),
        this.prisma.studentRecoveryProgress.findMany({
          where: {
            ...where,
            status: { in: ['assigned', 'in_progress', 'paused'] }
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentProfile: {
                  select: {
                    studentId: true,
                    gradeLevel: true
                  }
                }
              }
            },
            recoveryPlan: {
              select: {
                id: true,
                title: true,
                description: true,
                subjectId: true,
                gradeLevel: true,
                weekNumber: true,
                estimatedHours: true,
                subject: {
                  select: {
                    name: true,
                    nameAr: true
                  }
                }
              }
            },
            assignedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        })
      ]);

      return {
        studentId,
        totalRecoveryPlans,
        completedRecoveryPlans,
        totalEnhancementPlans: 0, // Will be filled by enhancement service
        completedEnhancementPlans: 0, // Will be filled by enhancement service
        averageCompletionRate: avgCompletionData._avg.completionRate || 0,
        totalTimeSpent: avgTimeData._sum.timeSpent || 0,
        currentPlans: {
          recovery: currentPlans as StudentRecoveryProgressWithDetails[],
          enhancement: [] // Will be filled by enhancement service
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get student plan summary: ${error.message}`);
    }
  }
}