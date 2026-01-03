import { PrismaClient } from '@prisma/client';
import {
  CreateClassDto,
  UpdateClassDto,
  ClassFilters,
  PaginatedClasses,
  ClassWithDetails,
  ClassStatistics,
  EnrollStudentDto,
  TransferStudentDto,
  EnrollmentFilters,
  PaginatedEnrollments,
  StudentEnrollmentWithDetails,
  StudentTransferHistory
} from '../types/school.types';

export class ClassService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * إنشاء صف جديد
   * Validates: Requirements 10.1
   */
  async createClass(classData: CreateClassDto): Promise<ClassWithDetails> {
    try {
      const newClass = await this.prisma.class.create({
        data: classData,
        include: {
          school: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      return newClass as ClassWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to create class: ${error.message}`);
    }
  }

  /**
   * تحديث بيانات الصف
   * Validates: Requirements 10.2
   */
  async updateClass(classId: number, updateData: UpdateClassDto): Promise<ClassWithDetails> {
    try {
      const updatedClass = await this.prisma.class.update({
        where: { id: classId },
        data: updateData,
        include: {
          school: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      return updatedClass as ClassWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to update class: ${error.message}`);
    }
  }

  /**
   * حذف صف (إلغاء تفعيل)
   * Validates: Requirements 10.2
   */
  async deleteClass(classId: number): Promise<ClassWithDetails> {
    try {
      const deletedClass = await this.prisma.class.update({
        where: { id: classId },
        data: { isActive: false },
        include: {
          school: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      return deletedClass as ClassWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to delete class: ${error.message}`);
    }
  }

  /**
   * الحصول على قائمة الصفوف مع الفلترة والترقيم
   * Validates: Requirements 10.1, 10.3
   */
  async getClasses(filters: ClassFilters, currentUserId?: number, userRole?: string): Promise<PaginatedClasses> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.schoolId) {
        where.schoolId = filters.schoolId;
      }

      if (filters.teacherId) {
        where.teacherId = filters.teacherId;
      }

      if (filters.gradeLevel) {
        where.gradeLevel = filters.gradeLevel;
      }

      if (filters.academicYear) {
        where.academicYear = filters.academicYear;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search } },
          { section: { contains: filters.search } },
          { description: { contains: filters.search } }
        ];
      }

      // إذا كان المستخدم معلم، عرض صفوفه فقط
      if (userRole === 'teacher' && currentUserId) {
        where.teacherId = currentUserId;
      }

      const [classes, total] = await Promise.all([
        this.prisma.class.findMany({
          where,
          include: {
            school: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                enrollments: {
                  where: { isActive: true }
                }
              }
            }
          },
          orderBy: [
            { gradeLevel: 'asc' },
            { section: 'asc' }
          ],
          skip,
          take: limit
        }),
        this.prisma.class.count({ where })
      ]);

      return {
        classes: classes as ClassWithDetails[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get classes: ${error.message}`);
    }
  }

  /**
   * الحصول على صف بالمعرف
   * Validates: Requirements 10.1
   */
  async getClassById(classId: number): Promise<ClassWithDetails | null> {
    try {
      const classData = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          school: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: {
                where: { isActive: true }
              }
            }
          }
        }
      });

      return classData as ClassWithDetails | null;
    } catch (error: any) {
      throw new Error(`Failed to get class: ${error.message}`);
    }
  }

  /**
   * تسجيل طالب في صف
   * Validates: Requirements 10.2
   */
  async enrollStudent(enrollmentData: EnrollStudentDto): Promise<StudentEnrollmentWithDetails> {
    try {
      // التحقق من عدم وجود تسجيل سابق نشط
      const existingEnrollment = await this.prisma.studentClassEnrollment.findFirst({
        where: {
          studentId: enrollmentData.studentId,
          academicYear: enrollmentData.academicYear,
          isActive: true
        }
      });

      if (existingEnrollment) {
        throw new Error('Student is already enrolled in a class for this academic year');
      }

      // التحقق من سعة الصف
      const classData = await this.prisma.class.findUnique({
        where: { id: enrollmentData.classId },
        include: {
          _count: {
            select: {
              enrollments: {
                where: { isActive: true }
              }
            }
          }
        }
      });

      if (classData?.capacity && classData._count.enrollments >= classData.capacity) {
        throw new Error('Class is at full capacity');
      }

      const enrollment = await this.prisma.studentClassEnrollment.create({
        data: enrollmentData,
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
          class: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              section: true
            }
          }
        }
      });

      return enrollment as StudentEnrollmentWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to enroll student: ${error.message}`);
    }
  }

  /**
   * إلغاء تسجيل طالب من صف
   * Validates: Requirements 10.4
   */
  async withdrawStudent(studentId: number, classId: number, academicYear: string): Promise<StudentEnrollmentWithDetails> {
    try {
      const enrollment = await this.prisma.studentClassEnrollment.update({
        where: {
          studentId_classId_academicYear: {
            studentId,
            classId,
            academicYear
          }
        },
        data: {
          isActive: false,
          withdrawnAt: new Date()
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
          class: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              section: true
            }
          }
        }
      });

      return enrollment as StudentEnrollmentWithDetails;
    } catch (error: any) {
      throw new Error(`Failed to withdraw student: ${error.message}`);
    }
  }

  /**
   * نقل طالب بين الصفوف
   * Validates: Requirements 10.4
   */
  async transferStudent(transferData: TransferStudentDto): Promise<{
    oldEnrollment: StudentEnrollmentWithDetails;
    newEnrollment: StudentEnrollmentWithDetails;
  }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // إلغاء التسجيل من الصف القديم
        const oldEnrollment = await tx.studentClassEnrollment.update({
          where: {
            studentId_classId_academicYear: {
              studentId: transferData.studentId,
              classId: transferData.fromClassId,
              academicYear: transferData.academicYear
            }
          },
          data: {
            isActive: false,
            withdrawnAt: new Date()
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
            class: {
              select: {
                id: true,
                name: true,
                gradeLevel: true,
                section: true
              }
            }
          }
        });

        // التسجيل في الصف الجديد
        const newEnrollment = await tx.studentClassEnrollment.create({
          data: {
            studentId: transferData.studentId,
            classId: transferData.toClassId,
            academicYear: transferData.academicYear
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
            class: {
              select: {
                id: true,
                name: true,
                gradeLevel: true,
                section: true
              }
            }
          }
        });

        return { oldEnrollment, newEnrollment } as {
          oldEnrollment: StudentEnrollmentWithDetails;
          newEnrollment: StudentEnrollmentWithDetails;
        };
      });
    } catch (error: any) {
      throw new Error(`Failed to transfer student: ${error.message}`);
    }
  }

  /**
   * الحصول على طلاب الصف
   * Validates: Requirements 10.2
   */
  async getClassStudents(classId: number, filters: EnrollmentFilters): Promise<PaginatedEnrollments> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = { classId };

      if (filters.academicYear) {
        where.academicYear = filters.academicYear;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const [enrollments, total] = await Promise.all([
        this.prisma.studentClassEnrollment.findMany({
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
            class: {
              select: {
                id: true,
                name: true,
                gradeLevel: true,
                section: true
              }
            }
          },
          orderBy: {
            student: {
              firstName: 'asc'
            }
          },
          skip,
          take: limit
        }),
        this.prisma.studentClassEnrollment.count({ where })
      ]);

      return {
        enrollments: enrollments as StudentEnrollmentWithDetails[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get class students: ${error.message}`);
    }
  }

  /**
   * الحصول على إحصائيات الصف
   * Validates: Requirements 10.2
   */
  async getClassStatistics(classId: number, academicYear?: string): Promise<ClassStatistics> {
    try {
      const classData = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          _count: {
            select: {
              enrollments: {
                where: {
                  isActive: true,
                  ...(academicYear && { academicYear })
                }
              }
            }
          }
        }
      });

      if (!classData) {
        throw new Error('Class not found');
      }

      const enrolledStudents = classData._count.enrollments;
      const capacity = classData.capacity || 30;
      const utilizationRate = (enrolledStudents / capacity) * 100;

      return {
        enrolledStudents,
        capacity,
        utilizationRate: Math.round(utilizationRate * 100) / 100
      };
    } catch (error: any) {
      throw new Error(`Failed to get class statistics: ${error.message}`);
    }
  }

  /**
   * الحصول على سجل انتماء الطالب للصفوف
   * Validates: Requirements 10.5
   */
  async getStudentEnrollmentHistory(studentId: number): Promise<StudentEnrollmentWithDetails[]> {
    try {
      const enrollments = await this.prisma.studentClassEnrollment.findMany({
        where: { studentId },
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
          class: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              section: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      });

      return enrollments as StudentEnrollmentWithDetails[];
    } catch (error: any) {
      throw new Error(`Failed to get student enrollment history: ${error.message}`);
    }
  }
}