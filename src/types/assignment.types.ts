export interface Assignment {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  instructions?: string;
  subjectId: number;
  gradeLevel: number;
  assignmentType: AssignmentType;
  attachments?: string[];
  dueDate: Date;
  maxScore: number;
  allowLateSubmission: boolean;
  latePenalty?: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  submissionText?: string;
  attachments?: string[];
  submittedAt: Date;
  isLate: boolean;
  score?: number;
  feedback?: string;
  gradedBy?: number;
  gradedAt?: Date;
  status: SubmissionStatus;
}

export enum AssignmentType {
  HOMEWORK = 'homework',
  PROJECT = 'project',
  QUIZ = 'quiz',
  ESSAY = 'essay',
  PRESENTATION = 'presentation',
  LAB_WORK = 'lab_work'
}

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  RETURNED = 'returned',
  LATE = 'late',
  MISSING = 'missing'
}

// DTOs for API requests/responses
export interface CreateAssignmentDto {
  title: string;
  description?: string;
  instructions?: string;
  subjectId: number;
  gradeLevel: number;
  assignmentType: AssignmentType;
  attachments?: string[];
  dueDate: Date;
  maxScore?: number;
  allowLateSubmission?: boolean;
  latePenalty?: number;
}

export interface UpdateAssignmentDto {
  title?: string;
  description?: string;
  instructions?: string;
  subjectId?: number;
  gradeLevel?: number;
  assignmentType?: AssignmentType;
  attachments?: string[];
  dueDate?: Date;
  maxScore?: number;
  allowLateSubmission?: boolean;
  latePenalty?: number;
  isPublished?: boolean;
}

export interface SubmitAssignmentDto {
  submissionText?: string;
  attachments?: string[];
}

export interface GradeSubmissionDto {
  score: number;
  feedback?: string;
}

export interface AssignmentFilters {
  subjectId?: number;
  gradeLevel?: number;
  assignmentType?: AssignmentType;
  isPublished?: boolean;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdBy?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubmissionFilters {
  assignmentId?: number;
  studentId?: number;
  status?: SubmissionStatus;
  isLate?: boolean;
  gradedBy?: number;
  submittedFrom?: Date;
  submittedTo?: Date;
  page?: number;
  limit?: number;
}

export interface AssignmentWithSubmissions extends Assignment {
  submissions?: AssignmentSubmission[];
  submissionCount?: number;
  gradedCount?: number;
}

export interface SubmissionWithAssignment extends AssignmentSubmission {
  assignment?: Assignment;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  grader?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface AssignmentStats {
  totalAssignments: number;
  publishedAssignments: number;
  draftAssignments: number;
  overdueAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  lateSubmissions: number;
  averageScore: number;
}

export interface StudentAssignmentSummary {
  studentId: number;
  studentName: string;
  totalAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
  lateSubmissions: number;
  averageScore: number;
  pendingAssignments: Assignment[];
}