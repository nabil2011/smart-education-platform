/**
 * أنواع البيانات للاختبارات التشخيصية
 * Diagnostic Test Types and DTOs
 */

// أنواع الاختبارات التشخيصية
export enum DiagnosticTestType {
  WRITTEN = 'written',      // مكتوب
  ORAL = 'oral',           // شفهي
  PRACTICAL = 'practical'   // عملي
}

// مستويات الصعوبة
export enum TestDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// حالة النتيجة
export enum TestResultStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed'
}

// أنواع الأسئلة
export enum DiagnosticQuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay'
}

// أنواع نقاط الضعف
export enum WeaknessType {
  CONCEPTUAL = 'conceptual',      // مفاهيمي
  PROCEDURAL = 'procedural',      // إجرائي
  COMPUTATIONAL = 'computational', // حسابي
  ANALYTICAL = 'analytical'       // تحليلي
}

// نموذج الاختبار التشخيصي
export interface DiagnosticTest {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  subjectId: number;
  gradeLevel: number;
  testType: DiagnosticTestType;
  difficulty: TestDifficulty;
  duration?: number; // بالدقائق
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  attachments?: TestAttachment[];
  questions?: TestQuestion[];
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  
  // العلاقات
  subject?: {
    id: number;
    name: string;
    nameAr: string;
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  results?: DiagnosticTestResult[];
  _count?: {
    results: number;
  };
}

// نموذج نتيجة الاختبار التشخيصي
export interface DiagnosticTestResult {
  id: number;
  testId: number;
  studentId: number;
  score: number;
  totalMarks: number;
  percentage: number;
  timeSpent?: number; // بالدقائق
  answers?: TestAnswer[];
  weaknesses?: WeaknessArea[];
  recommendations?: string[];
  status: TestResultStatus;
  completedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: number;
  notes?: string;
  createdAt: Date;
  
  // العلاقات
  test?: DiagnosticTest;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

// مرفقات الاختبار
export interface TestAttachment {
  id: number;
  testId: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// أسئلة الاختبار
export interface TestQuestion {
  id: number;
  testId: number;
  questionText: string;
  questionType: DiagnosticQuestionType;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  order: number;
}

// إجابات الطالب
export interface TestAnswer {
  questionId: number;
  answer: string;
  isCorrect: boolean;
  marksAwarded: number;
}

// نقاط الضعف
export interface WeaknessArea {
  type: WeaknessType;
  description: string;
  severity: 'low' | 'medium' | 'high';
  relatedTopics: string[];
}

// تحليل الاختبار
export interface TestAnalysis {
  testId: number;
  totalStudents: number;
  averageScore: number;
  passRate: number;
  commonWeaknesses: WeaknessArea[];
  difficultyAnalysis: {
    questionId: number;
    correctRate: number;
    averageTime: number;
  }[];
  recommendations: string[];
}

// توصيات التعلم
export interface LearningRecommendations {
  studentId: number;
  testResultId: number;
  recoveryPlans: number[];
  enhancementPlans: number[];
  focusAreas: string[];
  estimatedStudyTime: number;
  priority: 'low' | 'medium' | 'high';
}

// تحليل نقاط الضعف
export interface WeaknessAnalysis {
  studentId: number;
  overallWeaknesses: WeaknessArea[];
  subjectWeaknesses: {
    subjectId: number;
    subjectName: string;
    weaknesses: WeaknessArea[];
  }[];
  improvementTrend: {
    date: Date;
    score: number;
    weaknessCount: number;
  }[];
}

// DTOs للإنشاء والتحديث
export interface CreateDiagnosticTestDto {
  title: string;
  description?: string;
  subjectId: number;
  gradeLevel: number;
  testType: DiagnosticTestType;
  difficulty: TestDifficulty;
  duration?: number;
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  questions?: CreateTestQuestionDto[];
}

export interface UpdateDiagnosticTestDto {
  title?: string;
  description?: string;
  subjectId?: number;
  gradeLevel?: number;
  testType?: DiagnosticTestType;
  difficulty?: TestDifficulty;
  duration?: number;
  totalMarks?: number;
  passingMarks?: number;
  instructions?: string;
  isActive?: boolean;
}

export interface CreateTestQuestionDto {
  questionText: string;
  questionType: DiagnosticQuestionType;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  order: number;
}

export interface CreateTestResultDto {
  testId: number;
  studentId: number;
  answers: TestAnswer[];
  timeSpent?: number;
}

export interface UpdateTestResultDto {
  score?: number;
  percentage?: number;
  weaknesses?: WeaknessArea[];
  recommendations?: string[];
  status?: TestResultStatus;
  notes?: string;
}

// DTOs للاستعلام والفلترة
export interface DiagnosticTestFilters {
  subjectId?: number;
  gradeLevel?: number;
  testType?: DiagnosticTestType;
  difficulty?: TestDifficulty;
  isActive?: boolean;
  createdBy?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'createdAt' | 'gradeLevel' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
}

export interface TestResultFilters {
  testId?: number;
  studentId?: number;
  status?: TestResultStatus;
  minScore?: number;
  maxScore?: number;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'score' | 'completedAt' | 'percentage';
  sortOrder?: 'asc' | 'desc';
}

// استجابات مقسمة بصفحات
export interface PaginatedDiagnosticTests {
  tests: DiagnosticTest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedTestResults {
  results: DiagnosticTestResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// إحصائيات الاختبارات
export interface DiagnosticTestStatistics {
  totalTests: number;
  activeTests: number;
  totalResults: number;
  averageScore: number;
  passRate: number;
  subjectDistribution: {
    subjectId: number;
    subjectName: string;
    testCount: number;
    averageScore: number;
  }[];
  gradeDistribution: {
    gradeLevel: number;
    testCount: number;
    averageScore: number;
  }[];
  difficultyDistribution: {
    difficulty: TestDifficulty;
    testCount: number;
    averageScore: number;
  }[];
}

// تقرير أداء الطالب
export interface StudentPerformanceReport {
  studentId: number;
  totalTests: number;
  completedTests: number;
  averageScore: number;
  improvementTrend: {
    date: Date;
    score: number;
    testTitle: string;
  }[];
  weaknessAreas: WeaknessArea[];
  recommendations: LearningRecommendations[];
  strongSubjects: string[];
  weakSubjects: string[];
}