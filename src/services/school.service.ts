import { PrismaClient } from '@prisma/client';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  SchoolFilters,
  PaginatedSchools,
  SchoolWithStats,
  SchoolStatistics
} from '../types/school.types';

export class SchoolService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * إنشاء مدرسة جديدة
   * Validates: Requirements 17.1
   */
  async createSchool(schoolData: CreateSchoolDto): Promise<SchoolWithStats> {
    try {
      const school = await this.prisma.school.create({
        data: schoolData,
        include: {
          _count: {
            select: {
              teachers: true,
              classes: true
            }
          }
        }
      });

      return school;
    } catch (error: any) {
      throw new Error(`Failed to create school: ${error.message}`);
    }
  }

  /**
   * تحديث بيانات المدرسة
   * Validates: Requirements 17.2
   */
  async updateSchool(schoolId: number, updateData: UpdateSchoolDto): Promise<SchoolWithStats> {
    try {
      const school = await this.prisma.school.update({
        where: { id: schoolId },
        data: updateData,
        include: {
          _count: {
            select: {
              teachers: true,
              classes: true
            }
          }
        }
      });

      return school;
    } catch (error: any) {
      throw new Error(`Failed to update school: ${error.message}`);
    }
  }

  /**
   * حذف مدرسة (إلغاء تفعيل)
   * Validates: Requirements 17.2
   */
  async deleteSchool(schoolId: number): Promise<SchoolWithStats> {
    try {
      const school = await this.prisma.school.update({
        where: { id: schoolId },
        data: { isActive: false },
        include: {
          _count: {
            select: {
              teachers: true,
              classes: true
            }
          }
        }
      });

      return school;
    } catch (error: any) {
      throw new Error(`Failed to delete school: ${error.message}`);
    }
  }

  /**
   * الحصول على قائمة المدارس مع الفلترة والترقيم
   * Validates: Requirements 17.1
   */
  async getSchools(filters: SchoolFilters): Promise<PaginatedSchools> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.academicYear) {
        where.academicYear = filters.academicYear;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search } },
          { principalName: { contains: filters.search } },
          { address: { contains: filters.search } }
        ];
      }

      const [schools, total] = await Promise.all([
        this.prisma.school.findMany({
          where,
          include: {
            _count: {
              select: {
                teachers: true,
                classes: true
              }
            }
          },
          orderBy: { name: 'asc' },
          skip,
          take: limit
        }),
        this.prisma.school.count({ where })
      ]);

      return {
        schools,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get schools: ${error.message}`);
    }
  }

  /**
   * الحصول على مدرسة بالمعرف
   * Validates: Requirements 17.1
   */
  async getSchoolById(schoolId: number): Promise<SchoolWithStats | null> {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
        include: {
          _count: {
            select: {
              teachers: true,
              classes: true
            }
          }
        }
      });

      return school;
    } catch (error: any) {
      throw new Error(`Failed to get school: ${error.message}`);
    }
  }

  /**
   * ربط معلم بمدرسة
   * Validates: Requirements 17.3
   */
  async assignTeacherToSchool(teacherId: number, schoolId: number, academicYear: string): Promise<void> {
    try {
      await this.prisma.teacherProfile.update({
        where: { userId: teacherId },
        data: {
          schoolId,
          academicYear
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to assign teacher to school: ${error.message}`);
    }
  }

  /**
   * إلغاء ربط معلم من مدرسة
   * Validates: Requirements 17.3
   */
  async unassignTeacherFromSchool(teacherId: number): Promise<void> {
    try {
      await this.prisma.teacherProfile.update({
        where: { userId: teacherId },
        data: {
          schoolId: null
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to unassign teacher from school: ${error.message}`);
    }
  }

  /**
   * الحصول على إحصائيات المدرسة
   * Validates: Requirements 17.4
   */
  async getSchoolStatistics(schoolId: number, academicYear?: string): Promise<SchoolStatistics> {
    try {
      const whereClause: any = { schoolId };
      if (academicYear) {
        whereClause.academicYear = academicYear;
      }

      // إحصائيات الصفوف
      const classes = await this.prisma.class.findMany({
        where: whereClause,
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

      // إحصائيات المعلمين
      const teachersCount = await this.prisma.teacherProfile.count({
        where: { schoolId }
      });

      // حساب الإحصائيات
      const totalClasses = classes.length;
      const totalStudents = classes.reduce((sum, cls) => sum + cls._count.enrollments, 0);
      const averageClassSize = totalClasses > 0 ? totalStudents / totalClasses : 0;

      // توزيع الطلاب حسب المستوى
      const gradeDistribution = classes.reduce((acc: any[], cls) => {
        const existing = acc.find(item => item.gradeLevel === cls.gradeLevel);
        if (existing) {
          existing.studentCount += cls._count.enrollments;
          existing.classCount += 1;
        } else {
          acc.push({
            gradeLevel: cls.gradeLevel,
            studentCount: cls._count.enrollments,
            classCount: 1
          });
        }
        return acc;
      }, []);

      return {
        totalStudents,
        totalTeachers: teachersCount,
        totalClasses,
        averageClassSize: Math.round(averageClassSize * 100) / 100,
        gradeDistribution: gradeDistribution.sort((a, b) => a.gradeLevel - b.gradeLevel)
      };
    } catch (error: any) {
      throw new Error(`Failed to get school statistics: ${error.message}`);
    }
  }

  /**
   * الحصول على معلمي المدرسة
   * Validates: Requirements 17.3
   */
  async getSchoolTeachers(schoolId: number, academicYear?: string) {
    try {
      const where: any = { schoolId };
      if (academicYear) {
        where.academicYear = academicYear;
      }

      const teachers = await this.prisma.teacherProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true
            }
          },
          _count: {
            select: {
              classes: true
            }
          }
        },
        orderBy: {
          user: {
            firstName: 'asc'
          }
        }
      });

      return teachers;
    } catch (error: any) {
      throw new Error(`Failed to get school teachers: ${error.message}`);
    }
  }

  /**
   * الحصول على صفوف المدرسة
   * Validates: Requirements 17.1
   */
  async getSchoolClasses(schoolId: number, academicYear?: string) {
    try {
      const where: any = { schoolId, isActive: true };
      if (academicYear) {
        where.academicYear = academicYear;
      }

      const classes = await this.prisma.class.findMany({
        where,
        include: {
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
        ]
      });

      return classes;
    } catch (error: any) {
      throw new Error(`Failed to get school classes: ${error.message}`);
    }
  }
}