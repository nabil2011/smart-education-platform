import { PrismaClient } from '@prisma/client';
import {
  CreateEnhancementPlanDto,
  UpdateEnhancementPlanDto,
  EnhancementPlanFilters,
  PaginatedEnhancementPlans,
  EnhancementPlanWithDetails,
  AssignPlanDto,
  UpdateProgressDto,
  StudentEnhancementProgressWithDetails,
  ProgressFilters,
  PaginatedEnhancementProgress,
  PlanStatistics,
  StudentPlanSummary,
  PlanEffectivenessReport
} from '../types/recovery-enhancement.types';

export class EnhancementPlanService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * إنشاء خطة تعزيز جديدة
   * Validates: Requirements 12.1
   */
  async createEnhancementPlan(planData: CreateEnhancementPlanDto, createdBy: number): Promise<EnhancementPlanWithDetails> {
    try {
      const newPlan = await this.prisma.enhancementPlan.create({
        data: {
          ...planData,
          objectives: planData.objectives || [],
          activities: planData.activities as any || [],
          resources: planData.resources as any || [],
          prerequisites: planData.prerequisites || [],
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

      return newPlan as EnhancementPlanWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to create enhancement plan: ${error.message}`);
    }
  }

  /**
   * تحديث خطة تعزيز
   * Validates: Requirements 12.2
   */
  async updateEnhancementPlan(planId: number, updateData: UpdateEnhancementPlanDto): Promise<EnhancementPlanWithDetails> {
    try {
      const updatedPlan = await this.prisma.enhancementPlan.update({
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

      return updatedPlan as EnhancementPlanWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to update enhancement plan: ${error.message}`);
    }
  }

  /**
   * حذف خطة تعزيز (إلغاء تفعيل)
   * Validates: Requirements 12.2
   */
  async deleteEnhancementPlan(planId: number): Promise<EnhancementPlanWithDetails> {
    try {
      const deletedPlan = await this.prisma.enhancementPlan.update({
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

      return deletedPlan as EnhancementPlanWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to delete enhancement plan: ${error.message}`);
    }
  }

  /**
   * الحصول على قائمة خطط التعزيز مع الفلترة والترقيم
   * Validates: Requirements 12.1, 12.3
   */
  async getEnhancementPlans(filters: EnhancementPlanFilters): Promise<PaginatedEnhancementPlans> {
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

      if (filters.planType) {
        where.planType = filters.planType;
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
        this.prisma.enhancementPlan.findMany({
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
            { planType: 'asc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        this.prisma.enhancementPlan.count({ where })
      ]);

      return {
        plans: plans as EnhancementPlanWithDetails[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get enhancement plans: ${error.message}`);
    }
  }

  /**
   * الحصول على خطة تعزيز بالمعرف
   * Validates: Requirements 12.1
   */
  async getEnhancementPlanById(planId: number): Promise<EnhancementPlanWithDetails | null> {
    try {
      const plan = await this.prisma.enhancementPlan.findUnique({
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

      return plan as EnhancementPlanWithDetails | null;
    } catch (error: any) {
      throw new Error(`Failed to get enhancement plan: ${error.message}`);
    }
  }

  /**
   * تعيين خطة تعزيز لطالب
   * Validates: Requirements 12.4
   */
  async assignEnhancementPlan(assignmentData: AssignPlanDto, assignedBy: number): Promise<StudentEnhancementProgressWithDetails> {
    try {
      // التحقق من عدم وجود تعيين سابق نشط
      const existingAssignment = await this.prisma.studentEnhancementProgress.findFirst({
        where: {
          studentId: assignmentData.studentId,
          enhancementPlanId: assignmentData.planId,
          academicYear: assignmentData.academicYear,
          status: {
            in: ['assigned', 'in_progress', 'paused']
          }
        }
      });

      if (existingAssignment) {
        throw new Error('Student already has an active assignment for this enhancement plan');
      }

      const assignment = await this.prisma.studentEnhancementProgress.create({
        data: {
          studentId: assignmentData.studentId,
          enhancementPlanId: assignmentData.planId,
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
          enhancementPlan: {
            select: {
              id: true,
              title: true,
              description: true,
              subjectId: true,
              gradeLevel: true,
              planType: true,
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

      return assignment as StudentEnhancementProgressWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to assign enhancement plan: ${error.message}`);
    }
  }

  /**
   * تحديث تقدم الطالب في خطة التعزيز
   * Validates: Requirements 12.5
   */
  async updateStudentProgress(progressId: number, updateData: UpdateProgressDto): Promise<StudentEnhancementProgressWithDetails> {
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

      const updatedProgress = await this.prisma.studentEnhancementProgress.update({
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
          enhancementPlan: {
            select: {
              id: true,
              title: true,
              description: true,
              subjectId: true,
              gradeLevel: true,
              planType: true,
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

      return updatedProgress as StudentEnhancementProgressWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to update student progress: ${error.message}`);
    }
  }

  /**
   * الحصول على تقدم الطلاب في خطط التعزيز
   * Validates: Requirements 12.5
   */
  async getStudentProgress(filters: ProgressFilters): Promise<PaginatedEnhancementProgress> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters.planId) {
        where.enhancementPlanId = filters.planId;
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
        this.prisma.studentEnhancementProgress.findMany({
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
            enhancementPlan: {
              select: {
                id: true,
                title: true,
                description: true,
                subjectId: true,
                gradeLevel: true,
                planType: true,
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
        this.prisma.studentEnhancementProgress.count({ where })
      ]);

      return {
        progress: progress as StudentEnhancementProgressWithDetails[],
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
   * الحصول على إحصائيات خطط التعزيز
   * Validates: Requirements 12.3
   */
  async getEnhancementPlanStatistics(academicYear?: string): Promise<PlanStatistics> {
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
        gradeStats
      ] = await Promise.all([
        this.prisma.enhancementPlan.count(where),
        this.prisma.enhancementPlan.count({ ...where, isActive: true }),
        this.prisma.studentEnhancementProgress.count(progressWhere),
        this.prisma.studentEnhancementProgress.count({ ...progressWhere, status: 'completed' }),
        this.prisma.studentEnhancementProgress.aggregate({
          where: progressWhere,
          _avg: { completionRate: true }
        }),
        this.prisma.studentEnhancementProgress.aggregate({
          where: progressWhere,
          _avg: { timeSpent: true }
        }),
        this.prisma.enhancementPlan.groupBy({
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
      throw new Error(`Failed to get enhancement plan statistics: ${error.message}`);
    }
  }

  /**
   * تقرير فعالية الخطط
   * Validates: Requirements 12.5
   */
  async getPlanEffectivenessReport(planId: number): Promise<PlanEffectivenessReport> {
    try {
      const plan = await this.prisma.enhancementPlan.findUnique({
        where: { id: planId },
        select: { title: true }
      });

      if (!plan) {
        throw new Error('Enhancement plan not found');
      }

      const [
        totalAssignments,
        completedAssignments,
        avgCompletionData,
        avgTimeData
      ] = await Promise.all([
        this.prisma.studentEnhancementProgress.count({
          where: { enhancementPlanId: planId }
        }),
        this.prisma.studentEnhancementProgress.count({
          where: { enhancementPlanId: planId, status: 'completed' }
        }),
        this.prisma.studentEnhancementProgress.aggregate({
          where: { enhancementPlanId: planId },
          _avg: { completionRate: true }
        }),
        this.prisma.studentEnhancementProgress.aggregate({
          where: { enhancementPlanId: planId },
          _avg: { timeSpent: true }
        })
      ]);

      const averageCompletionRate = avgCompletionData._avg.completionRate || 0;
      const averageTimeSpent = isNaN(avgTimeData._avg.timeSpent || 0) ? 0 : (avgTimeData._avg.timeSpent || 0);

      // تحديد مستوى الفعالية
      let effectiveness: 'high' | 'medium' | 'low' = 'low';
      if (averageCompletionRate >= 80) {
        effectiveness = 'high';
      } else if (averageCompletionRate >= 60) {
        effectiveness = 'medium';
      }

      // توصيات بناءً على الأداء
      const recommendations: string[] = [];
      if (averageCompletionRate < 60) {
        recommendations.push('تحسين محتوى الخطة وجعلها أكثر تفاعلية');
        recommendations.push('إضافة المزيد من الأمثلة والتمارين العملية');
      }
      if (averageTimeSpent > (plan as any).estimatedHours * 60 * 1.5) {
        recommendations.push('مراجعة تقدير الوقت المطلوب للخطة');
        recommendations.push('تبسيط بعض الأنشطة المعقدة');
      }
      if (totalAssignments < 5) {
        recommendations.push('زيادة عدد التعيينات لتحسين دقة التقييم');
      }

      return {
        planId,
        planTitle: plan.title,
        planType: 'enhancement',
        totalAssignments,
        completedAssignments,
        averageCompletionRate,
        averageTimeSpent,
        studentFeedback: {
          averageRating: undefined, // يمكن إضافة نظام التقييم لاحقاً
          totalFeedback: 0
        },
        effectiveness,
        recommendations
      };
    } catch (error: any) {
      throw new Error(`Failed to get plan effectiveness report: ${error.message}`);
    }
  }

  /**
   * الحصول على ملخص خطط الطالب (التعزيز فقط)
   * Validates: Requirements 12.5
   */
  async getStudentEnhancementSummary(studentId: number, academicYear?: string): Promise<Partial<StudentPlanSummary>> {
    try {
      const where: any = { studentId };
      if (academicYear) {
        where.academicYear = academicYear;
      }

      const [
        totalEnhancementPlans,
        completedEnhancementPlans,
        currentPlans
      ] = await Promise.all([
        this.prisma.studentEnhancementProgress.count(where),
        this.prisma.studentEnhancementProgress.count({ ...where, status: 'completed' }),
        this.prisma.studentEnhancementProgress.findMany({
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
            enhancementPlan: {
              select: {
                id: true,
                title: true,
                description: true,
                subjectId: true,
                gradeLevel: true,
                planType: true,
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
        totalEnhancementPlans,
        completedEnhancementPlans,
        currentPlans: {
          recovery: [],
          enhancement: currentPlans as StudentEnhancementProgressWithDetails[]
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get student enhancement summary: ${error.message}`);
    }
  }
}