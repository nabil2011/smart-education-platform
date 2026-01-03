import { QuestionType, AttemptStatus, Difficulty } from '@prisma/client';

// Assessment DTOs
export interface CreateAssessmentDto {
  title: string;
  description?: string;
  subjectId: number;
  gradeLevel: number;
  difficultyLevel: Difficulty;
  durationMinutes: number;
  passingScore: number;
  maxAttempts?: number;
  isPublished?: boolean;
}

export interface UpdateAssessmentDto {
  title?: string;
  description?: string;
  subjectId?: number;
  gradeLevel?: number;
  difficultyLevel?: Difficulty;
  durationMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  isPublished?: boolean;
}

export interface AssessmentResponseDto {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  subjectId: number;
  subjectName: string;
  gradeLevel: number;
  difficultyLevel: Difficulty;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy: number;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuestionResponseDto[];
}

// Question DTOs
export interface CreateQuestionDto {
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  orderIndex: number;
}

export interface UpdateQuestionDto {
  questionText?: string;
  questionType?: QuestionType;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  orderIndex?: number;
}

export interface QuestionResponseDto {
  id: number;
  assessmentId: number;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer?: string; // Only included for teachers/admins
  explanation?: string;
  points: number;
  orderIndex: number;
}

// For students taking the assessment (without correct answers)
export interface StudentQuestionDto {
  id: number;
  assessmentId: number;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  points: number;
  orderIndex: number;
}

// Assessment Attempt DTOs
export interface StartAssessmentDto {
  assessmentId: number;
}

export interface SubmitAnswerDto {
  questionId: number;
  answer: string;
}

export interface SubmitAssessmentDto {
  answers: Record<number, string>; // questionId -> answer
}

export interface AssessmentAttemptResponseDto {
  id: number;
  uuid: string;
  assessmentId: number;
  assessmentTitle: string;
  studentId: number;
  studentName: string;
  startedAt: Date;
  completedAt?: Date;
  submittedAt?: Date;
  status: AttemptStatus;
  totalScore?: number;
  maxScore?: number;
  percentageScore?: number;
  timeSpent?: number; // in seconds
  answers?: Record<number, string>;
  passed?: boolean;
}

// For student's own attempts (includes answers)
export interface StudentAttemptResponseDto extends AssessmentAttemptResponseDto {
  assessment: {
    title: string;
    durationMinutes: number;
    passingScore: number;
    totalQuestions: number;
  };
  detailedResults?: {
    questionId: number;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    earnedPoints: number;
  }[];
}

// Assessment Statistics
export interface AssessmentStatsDto {
  totalAssessments: number;
  publishedAssessments: number;
  draftAssessments: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  passRate: number;
  assessmentsBySubject: Record<string, number>;
  assessmentsByGrade: Record<number, number>;
  assessmentsByDifficulty: Record<Difficulty, number>;
  recentAttempts: AssessmentAttemptResponseDto[];
}

// Filter and Search DTOs
export interface AssessmentFilterDto {
  subjectId?: number;
  gradeLevel?: number;
  difficultyLevel?: Difficulty;
  isPublished?: boolean;
  createdBy?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'totalQuestions' | 'durationMinutes';
  sortOrder?: 'asc' | 'desc';
}

export interface AttemptFilterDto {
  assessmentId?: number;
  studentId?: number;
  status?: AttemptStatus;
  startDate?: Date;
  endDate?: Date;
  minScore?: number;
  maxScore?: number;
  page?: number;
  limit?: number;
  sortBy?: 'startedAt' | 'completedAt' | 'percentageScore' | 'timeSpent';
  sortOrder?: 'asc' | 'desc';
}

// Assessment Session (for real-time assessment taking)
export interface AssessmentSessionDto {
  attemptId: number;
  assessmentId: number;
  studentId: number;
  startedAt: Date;
  timeRemaining: number; // in seconds
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: Record<number, string>;
  canSubmit: boolean;
  autoSubmitAt: Date;
}

// Assessment Results
export interface AssessmentResultDto {
  attemptId: number;
  assessmentTitle: string;
  studentName: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  timeSpent: number;
  completedAt: Date;
  questionResults: {
    questionId: number;
    questionText: string;
    questionType: QuestionType;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    earnedPoints: number;
  }[];
}

// Bulk Operations
export interface BulkCreateQuestionsDto {
  assessmentId: number;
  questions: CreateQuestionDto[];
}

export interface BulkUpdateQuestionsDto {
  assessmentId: number;
  questions: (UpdateQuestionDto & { id: number })[];
}

// Assessment Analytics
export interface AssessmentAnalyticsDto {
  assessmentId: number;
  assessmentTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageTimeSpent: number;
  questionAnalytics: {
    questionId: number;
    questionText: string;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracyRate: number;
    averageTimeSpent: number;
  }[];
  difficultyAnalysis: {
    tooEasy: number;
    appropriate: number;
    tooHard: number;
  };
  studentPerformance: {
    studentId: number;
    studentName: string;
    attempts: number;
    bestScore: number;
    averageScore: number;
    timeSpent: number;
  }[];
}