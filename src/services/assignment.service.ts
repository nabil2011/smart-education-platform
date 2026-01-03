import { PrismaClient } from '@prisma/client';
import {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  AssignmentFilters,
  SubmissionFilters,
  AssignmentWithSubmissions,
  SubmissionWithAssignment,
  AssignmentStats,
  StudentAssignmentSummary,
  SubmissionStatus,
  AssignmentType
} from '../types/assignment.types';

const prisma = new PrismaClient();

export class AssignmentService {
  // إنشاء واجب جديد
  async createAssignment(
    assignmentData: CreateAssignmentDto,
    createdBy: number
  ): Promise<Assignment> {
    const assignment = await prisma.assignment.create({
      data: {
        ...assignmentData,
        createdBy,
        attachments: assignmentData.attachments || []
      }
    });

    return assignment as Assignment;
  }

  // تحديث واجب موجود
  async updateAssignment(
    id: number,
    updates: UpdateAssignmentDto,
    userId: number
  ): Promise<Assignment> {
    // التحقق من أن المستخدم هو منشئ الواجب
    const existingAssignment = await prisma.assignment.findFirst({
      where: { id, createdBy: userId }
    });

    if (!existingAssignment) {
      throw new Error('Assignment not found or access denied');
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...updates,
        attachments: updates.attachments || (existingAssignment.attachments as string[])
      }
    });

    return assignment as Assignment;
  }

  // حذف واجب
  async deleteAssignment(id: number, userId: number): Promise<void> {
    // التحقق من أن المستخدم هو منشئ الواجب
    const existingAssignment = await prisma.assignment.findFirst({
      where: { id, createdBy: userId }
    });

    if (!existingAssignment) {
      throw new Error('Assignment not found or access denied');
    }

    await prisma.assignment.delete({
      where: { id }
    });
  }

  // نشر واجب
  async publishAssignment(id: number, userId: number): Promise<Assignment> {
    const assignment = await prisma.assignment.update({
      where: { id, createdBy: userId },
      data: {
        isPublished: true,
        publishedAt: new Date()
      }
    });

    return assignment as Assignment;
  }

  // الحصول على واجب بالمعرف
  async getAssignmentById(id: number): Promise<AssignmentWithSubmissions | null> {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
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
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!assignment) return null;

    return {
      ...assignment,
      submissionCount: assignment.submissions.length,
      gradedCount: assignment.submissions.filter(s => s.status === 'graded').length
    } as AssignmentWithSubmissions;
  }

  // البحث والفلترة في الواجبات
  async getAssignments(filters: AssignmentFilters): Promise<{
    assignments: AssignmentWithSubmissions[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.gradeLevel) where.gradeLevel = filters.gradeLevel;
    if (filters.assignmentType) where.assignmentType = filters.assignmentType;
    if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
    if (filters.createdBy) where.createdBy = filters.createdBy;

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = filters.dueDateFrom;
      if (filters.dueDateTo) where.dueDate.lte = filters.dueDateTo;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } }
      ];
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          submissions: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.assignment.count({ where })
    ]);

    const assignmentsWithStats = assignments.map(assignment => ({
      ...assignment,
      submissionCount: assignment.submissions.length,
      gradedCount: assignment.submissions.filter(s => s.status === 'graded').length
    }));

    return {
      assignments: assignmentsWithStats as any,
      total,
      page,
      limit
    };
  }

  // تسليم واجب من قبل طالب
  async submitAssignment(
    assignmentId: number,
    studentId: number,
    submissionData: SubmitAssignmentDto
  ): Promise<AssignmentSubmission> {
    // التحقق من وجود الواجب
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (!assignment.isPublished) {
      throw new Error('Assignment is not published yet');
    }

    // التحقق من عدم وجود تسليم سابق
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });

    if (existingSubmission) {
      throw new Error('Assignment already submitted');
    }

    // التحقق من التأخير
    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      throw new Error('Late submission not allowed for this assignment');
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        submissionText: submissionData.submissionText,
        attachments: submissionData.attachments || [],
        isLate,
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED
      }
    });

    return submission as AssignmentSubmission;
  }

  // تحديث تسليم واجب (للطالب)
  async updateSubmission(
    submissionId: number,
    studentId: number,
    submissionData: SubmitAssignmentDto
  ): Promise<AssignmentSubmission> {
    // التحقق من أن التسليم يخص الطالب
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, studentId },
      include: { assignment: true }
    });

    if (!existingSubmission) {
      throw new Error('Submission not found or access denied');
    }

    // التحقق من أن التسليم لم يتم تقييمه بعد
    if (existingSubmission.status === SubmissionStatus.GRADED) {
      throw new Error('Cannot update graded submission');
    }

    // التحقق من الموعد النهائي
    const now = new Date();
    const isLate = now > existingSubmission.assignment.dueDate;

    if (isLate && !existingSubmission.assignment.allowLateSubmission) {
      throw new Error('Late submission not allowed for this assignment');
    }

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        submissionText: submissionData.submissionText,
        attachments: submissionData.attachments || (existingSubmission.attachments as string[]),
        isLate,
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED
      }
    });

    return submission as AssignmentSubmission;
  }

  // تقييم تسليم واجب (للمعلم)
  async gradeSubmission(
    submissionId: number,
    graderId: number,
    gradeData: GradeSubmissionDto
  ): Promise<AssignmentSubmission> {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // التحقق من أن المعلم هو منشئ الواجب
    if (submission.assignment.createdBy !== graderId) {
      throw new Error('Access denied: You can only grade your own assignments');
    }

    // تطبيق عقوبة التأخير إذا كان التسليم متأخراً
    let finalScore = gradeData.score;
    if (submission.isLate && submission.assignment.latePenalty) {
      const daysLate = Math.ceil(
        (submission.submittedAt.getTime() - submission.assignment.dueDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const penalty = (submission.assignment.latePenalty * daysLate) / 100;
      finalScore = Math.max(0, gradeData.score * (1 - penalty));
    }

    const gradedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: Math.round(finalScore),
        feedback: gradeData.feedback,
        gradedBy: graderId,
        gradedAt: new Date(),
        status: SubmissionStatus.GRADED
      }
    });

    return gradedSubmission as AssignmentSubmission;
  }

  // الحصول على تسليمات واجب معين
  async getAssignmentSubmissions(
    assignmentId: number,
    filters: SubmissionFilters
  ): Promise<{
    submissions: SubmissionWithAssignment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { assignmentId };

    if (filters.status) where.status = filters.status;
    if (filters.isLate !== undefined) where.isLate = filters.isLate;
    if (filters.gradedBy) where.gradedBy = filters.gradedBy;

    if (filters.submittedFrom || filters.submittedTo) {
      where.submittedAt = {};
      if (filters.submittedFrom) where.submittedAt.gte = filters.submittedFrom;
      if (filters.submittedTo) where.submittedAt.lte = filters.submittedTo;
    }

    const [submissions, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where,
        include: {
          assignment: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          grader: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.assignmentSubmission.count({ where })
    ]);

    return {
      submissions: submissions as SubmissionWithAssignment[],
      total,
      page,
      limit
    };
  }

  // الحصول على تسليمات طالب معين
  async getStudentSubmissions(
    studentId: number,
    filters: SubmissionFilters
  ): Promise<{
    submissions: SubmissionWithAssignment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { studentId };

    if (filters.assignmentId) where.assignmentId = filters.assignmentId;
    if (filters.status) where.status = filters.status;
    if (filters.isLate !== undefined) where.isLate = filters.isLate;

    const [submissions, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where,
        include: {
          assignment: {
            include: {
              subject: true,
              creator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          grader: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.assignmentSubmission.count({ where })
    ]);

    return {
      submissions: submissions as SubmissionWithAssignment[],
      total,
      page,
      limit
    };
  }

  // الحصول على إحصائيات الواجبات
  async getAssignmentStats(createdBy?: number): Promise<AssignmentStats> {
    const where = createdBy ? { createdBy } : {};

    const [
      totalAssignments,
      publishedAssignments,
      overdueAssignments,
      submissions
    ] = await Promise.all([
      prisma.assignment.count({ where }),
      prisma.assignment.count({ where: { ...where, isPublished: true } }),
      prisma.assignment.count({
        where: {
          ...where,
          isPublished: true,
          dueDate: { lt: new Date() }
        }
      }),
      prisma.assignmentSubmission.findMany({
        where: createdBy ? { assignment: { createdBy } } : {},
        select: {
          status: true,
          isLate: true,
          score: true
        }
      })
    ]);

    const gradedSubmissions = submissions.filter(s => s.status === SubmissionStatus.GRADED);
    const averageScore = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
      : 0;

    return {
      totalAssignments,
      publishedAssignments,
      draftAssignments: totalAssignments - publishedAssignments,
      overdueAssignments,
      totalSubmissions: submissions.length,
      gradedSubmissions: gradedSubmissions.length,
      pendingSubmissions: submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length,
      lateSubmissions: submissions.filter(s => s.isLate).length,
      averageScore: Math.round(averageScore * 100) / 100
    };
  }

  // الحصول على ملخص واجبات الطلاب
  async getStudentAssignmentSummary(
    assignmentId: number
  ): Promise<StudentAssignmentSummary[]> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // الحصول على جميع الطلاب في نفس الصف والمادة
    const allStudents = await prisma.user.findMany({
      where: {
        role: 'student',
        studentProfile: {
          gradeLevel: assignment.gradeLevel
        }
      },
      include: {
        studentProfile: true
      }
    });

    const summary: StudentAssignmentSummary[] = allStudents.map(student => {
      const submission = assignment.submissions.find(s => s.studentId === student.id);
      
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        totalAssignments: 1, // هذا الواجب فقط
        submittedAssignments: submission ? 1 : 0,
        gradedAssignments: submission && submission.status === SubmissionStatus.GRADED ? 1 : 0,
        lateSubmissions: submission && submission.isLate ? 1 : 0,
        averageScore: submission && submission.score ? submission.score : 0,
        pendingAssignments: submission ? [] : [assignment as Assignment]
      };
    });

    return summary;
  }

  // إرسال تذكيرات للواجبات المتأخرة
  async sendOverdueReminders(): Promise<void> {
    const overdueAssignments = await prisma.assignment.findMany({
      where: {
        isPublished: true,
        dueDate: { lt: new Date() }
      },
      include: {
        submissions: {
          select: { studentId: true }
        }
      }
    });

    for (const assignment of overdueAssignments) {
      // الحصول على الطلاب الذين لم يسلموا الواجب
      const submittedStudentIds = assignment.submissions.map(s => s.studentId);
      
      const studentsWithoutSubmission = await prisma.user.findMany({
        where: {
          role: 'student',
          studentProfile: {
            gradeLevel: assignment.gradeLevel
          },
          id: {
            notIn: submittedStudentIds
          }
        }
      });

      // إنشاء إشعارات للطلاب المتأخرين
      const notifications = studentsWithoutSubmission.map(student => ({
        userId: student.id,
        title: 'تذكير: واجب متأخر',
        message: `لديك واجب متأخر: ${assignment.title}`,
        notificationType: 'reminder' as const,
        referenceId: assignment.id,
        referenceType: 'assignment'
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }
    }
  }
}

export const assignmentService = new AssignmentService();