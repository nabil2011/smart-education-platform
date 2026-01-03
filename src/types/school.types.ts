import { School, Class, StudentClassEnrollment, TeacherProfile } from '@prisma/client';

// DTOs for creating and updating
export interface CreateSchoolDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  academicYear: string;
}

export interface UpdateSchoolDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  academicYear?: string;
  isActive?: boolean;
}

export interface CreateClassDto {
  name: string;
  gradeLevel: number;
  section?: string;
  schoolId?: number;
  teacherId?: number;
  academicYear: string;
  capacity?: number;
  description?: string;
}

export interface UpdateClassDto {
  name?: string;
  gradeLevel?: number;
  section?: string;
  schoolId?: number;
  teacherId?: number;
  academicYear?: string;
  capacity?: number;
  description?: string;
  isActive?: boolean;
}

export interface EnrollStudentDto {
  studentId: number;
  classId: number;
  academicYear: string;
}

export interface TransferStudentDto {
  studentId: number;
  fromClassId: number;
  toClassId: number;
  academicYear: string;
  reason?: string;
}

// Response interfaces
export interface SchoolWithStats extends School {
  _count: {
    teachers: number;
    classes: number;
  };
}

export interface ClassWithDetails extends Class {
  school?: School;
  teacher?: TeacherProfile & {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  _count: {
    enrollments: number;
  };
}

export interface StudentEnrollmentWithDetails extends StudentClassEnrollment {
  student: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    studentProfile?: {
      studentId?: string;
      gradeLevel: number;
    };
  };
  class: {
    id: number;
    name: string;
    gradeLevel: number;
    section?: string;
  };
}

// Filter interfaces
export interface SchoolFilters {
  academicYear?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClassFilters {
  schoolId?: number;
  teacherId?: number;
  gradeLevel?: number;
  academicYear?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EnrollmentFilters {
  classId?: number;
  studentId?: number;
  academicYear?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Paginated responses
export interface PaginatedSchools {
  schools: SchoolWithStats[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedClasses {
  classes: ClassWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEnrollments {
  enrollments: StudentEnrollmentWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Statistics interfaces
export interface SchoolStatistics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  averageClassSize: number;
  gradeDistribution: {
    gradeLevel: number;
    studentCount: number;
    classCount: number;
  }[];
}

export interface ClassStatistics {
  enrolledStudents: number;
  capacity: number;
  utilizationRate: number;
  averageGrade?: number;
  attendanceRate?: number;
}

// Transfer history
export interface StudentTransferHistory {
  id: number;
  studentId: number;
  fromClassId?: number;
  toClassId: number;
  transferDate: Date;
  reason?: string;
  academicYear: string;
  fromClass?: {
    name: string;
    gradeLevel: number;
    section?: string;
  };
  toClass: {
    name: string;
    gradeLevel: number;
    section?: string;
  };
}