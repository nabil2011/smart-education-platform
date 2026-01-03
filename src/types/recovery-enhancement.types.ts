import { RecoveryPlan, EnhancementPlan, StudentRecoveryProgress, StudentEnhancementProgress, Subject, User } from '@prisma/client';

// Base types
export { RecoveryPlan, EnhancementPlan, StudentRecoveryProgress, StudentEnhancementProgress };

// DTOs for creating and updating
export interface CreateRecoveryPlanDto {
  title: string;
  description?: string;
  subjectId: number;
  gradeLevel: number;
  weekNumber: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  objectives?: string[];
  activities?: ActivityItem[];
  resources?: ResourceItem[];
  estimatedHours?: number;
}

export interface UpdateRecoveryPlanDto {
  title?: string;
  description?: string;
  subjectId?: number;
  gradeLevel?: number;
  weekNumber?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  objectives?: string[];
  activities?: ActivityItem[];
  resources?: ResourceItem[];
  estimatedHours?: number;
  isActive?: boolean;
}

export interface CreateEnhancementPlanDto {
  title: string;
  description?: string;
  subjectId: number;
  gradeLevel: number;
  planType: 'enrichment' | 'acceleration' | 'talent_development' | 'advanced_skills' | 'creative_thinking' | 'leadership';
  difficulty?: 'easy' | 'medium' | 'hard';
  objectives?: string[];
  activities?: ActivityItem[];
  resources?: ResourceItem[];
  estimatedHours?: number;
  prerequisites?: string[];
}

export interface UpdateEnhancementPlanDto {
  title?: string;
  description?: string;
  subjectId?: number;
  gradeLevel?: number;
  planType?: 'enrichment' | 'acceleration' | 'talent_development' | 'advanced_skills' | 'creative_thinking' | 'leadership';
  difficulty?: 'easy' | 'medium' | 'hard';
  objectives?: string[];
  activities?: ActivityItem[];
  resources?: ResourceItem[];
  estimatedHours?: number;
  prerequisites?: string[];
  isActive?: boolean;
}

export interface AssignPlanDto {
  studentId: number;
  planId: number;
  academicYear: string;
  notes?: string;
}

export interface UpdateProgressDto {
  status?: 'assigned' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progressData?: ActivityProgress[];
  completionRate?: number;
  timeSpent?: number;
  notes?: string;
}

// Supporting interfaces
export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  type: 'reading' | 'exercise' | 'video' | 'quiz' | 'project' | 'discussion';
  duration?: number; // in minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  resources?: string[]; // URLs or file paths
  isRequired: boolean;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: 'file' | 'url' | 'book' | 'video' | 'audio';
  url?: string;
  filePath?: string;
  description?: string;
  isRequired: boolean;
}

export interface ActivityProgress {
  activityId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number; // in minutes
  score?: number;
  notes?: string;
}

// Response interfaces
export interface RecoveryPlanWithDetails extends RecoveryPlan {
  subject: Subject;
  creator: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    studentProgress: number;
  };
}

export interface EnhancementPlanWithDetails extends EnhancementPlan {
  subject: Subject;
  creator: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    studentProgress: number;
  };
}

export interface StudentRecoveryProgressWithDetails extends StudentRecoveryProgress {
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
  recoveryPlan: {
    id: number;
    title: string;
    description?: string;
    subjectId: number;
    gradeLevel: number;
    weekNumber: number;
    estimatedHours?: number;
    subject: {
      name: string;
      nameAr: string;
    };
  };
  assignedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface StudentEnhancementProgressWithDetails extends StudentEnhancementProgress {
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
  enhancementPlan: {
    id: number;
    title: string;
    description?: string;
    subjectId: number;
    gradeLevel: number;
    planType: string;
    estimatedHours?: number;
    subject: {
      name: string;
      nameAr: string;
    };
  };
  assignedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Filter interfaces
export interface RecoveryPlanFilters {
  subjectId?: number;
  gradeLevel?: number;
  weekNumber?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EnhancementPlanFilters {
  subjectId?: number;
  gradeLevel?: number;
  planType?: 'enrichment' | 'acceleration' | 'talent_development' | 'advanced_skills' | 'creative_thinking' | 'leadership';
  difficulty?: 'easy' | 'medium' | 'hard';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProgressFilters {
  studentId?: number;
  planId?: number;
  status?: 'assigned' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  academicYear?: string;
  assignedBy?: number;
  page?: number;
  limit?: number;
}

// Paginated responses
export interface PaginatedRecoveryPlans {
  plans: RecoveryPlanWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEnhancementPlans {
  plans: EnhancementPlanWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedRecoveryProgress {
  progress: StudentRecoveryProgressWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEnhancementProgress {
  progress: StudentEnhancementProgressWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Statistics interfaces
export interface PlanStatistics {
  totalPlans: number;
  activePlans: number;
  totalAssignments: number;
  completedAssignments: number;
  averageCompletionRate: number;
  averageTimeSpent: number;
  subjectDistribution: {
    subjectId: number;
    subjectName: string;
    planCount: number;
    assignmentCount: number;
  }[];
  gradeDistribution: {
    gradeLevel: number;
    planCount: number;
    assignmentCount: number;
  }[];
}

export interface StudentPlanSummary {
  studentId: number;
  totalRecoveryPlans: number;
  completedRecoveryPlans: number;
  totalEnhancementPlans: number;
  completedEnhancementPlans: number;
  averageCompletionRate: number;
  totalTimeSpent: number;
  currentPlans: {
    recovery: StudentRecoveryProgressWithDetails[];
    enhancement: StudentEnhancementProgressWithDetails[];
  };
}

// Plan effectiveness report
export interface PlanEffectivenessReport {
  planId: number;
  planTitle: string;
  planType: 'recovery' | 'enhancement';
  totalAssignments: number;
  completedAssignments: number;
  averageCompletionRate: number;
  averageTimeSpent: number;
  studentFeedback: {
    averageRating?: number;
    totalFeedback: number;
  };
  effectiveness: 'high' | 'medium' | 'low';
  recommendations: string[];
}