export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export enum PageView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  DASHBOARD_STUDENT = 'DASHBOARD_STUDENT',
  DASHBOARD_TEACHER = 'DASHBOARD_TEACHER',
  DASHBOARD_ADMIN = 'DASHBOARD_ADMIN',
  QUIZ = 'QUIZ',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  AI_CONTENT = 'AI_CONTENT',
  AI_TUTOR = 'AI_TUTOR',
  GAMIFICATION = 'GAMIFICATION',
  PRONUNCIATION = 'PRONUNCIATION',
  ASSIGNMENTS = 'ASSIGNMENTS',
  CONTENT_LIBRARY = 'CONTENT_LIBRARY',
  STUDENT_TRACKING = 'STUDENT_TRACKING',
  RECOVERY_PLANS = 'RECOVERY_PLANS',
  ENHANCEMENT_PLANS = 'ENHANCEMENT_PLANS',
  DIAGNOSTIC_TESTS = 'DIAGNOSTIC_TESTS',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  RESOURCES = 'RESOURCES',
  SCHOOLS_MANAGEMENT = 'SCHOOLS_MANAGEMENT'
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  view: PageView;
  role?: UserRole[];
}

export interface StudentStats {
  progress: number;
  score: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  pronunciationScore: number;
  aiTutorSessions: number;
  badges: number;
  rank: number;
}

export interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  averagePerformance: number;
  contentGenerated: number;
  pendingAssignments: number;
  recentActivities: number;
}

export interface AdminStats {
  totalUsers: number;
  totalSchools: number;
  totalContent: number;
  systemUptime: number;
  activeUsers: number;
  contentUsage: number;
}

// AI Content Types
export interface AIGeneratedContent {
  id: string;
  type: 'lesson' | 'quiz' | 'story' | 'presentation' | 'video';
  title: string;
  description: string;
  subject: string;
  gradeLevel: number;
  difficulty: 'easy' | 'medium' | 'hard';
  content: any;
  createdAt: Date;
  createdBy: string;
  isApproved: boolean;
  rating: number;
  usageCount: number;
}

// Pronunciation Assessment Types
export interface PronunciationAssessment {
  id: string;
  studentId: string;
  targetText: string;
  audioFile: string;
  overallScore: number;
  clarityScore: number;
  accuracyScore: number;
  fluencyScore: number;
  errors: PronunciationError[];
  feedback: string;
  suggestions: string[];
  createdAt: Date;
}

export interface PronunciationError {
  word: string;
  expected: string;
  actual: string;
  position: number;
  severity: 'low' | 'medium' | 'high';
}

export interface PronunciationProgress {
  skillArea: string;
  currentScore: number;
  bestScore: number;
  improvementRate: number;
  totalAssessments: number;
}

// AI Tutor Types
export interface AITutorSession {
  id: string;
  studentId: string;
  type: 'homework_help' | 'concept_explanation' | 'practice' | 'review';
  topic: string;
  subject: string;
  messages: TutorMessage[];
  duration: number;
  satisfaction: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface TutorMessage {
  id: string;
  sender: 'student' | 'tutor';
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'audio' | 'file';
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'stat' | 'list' | 'progress';
  data: any;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
}

// School Management Types
export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  academicYear: string;
  isActive: boolean;
  totalStudents: number;
  totalTeachers: number;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  gradeLevel: number;
  section: string;
  academicYear: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
}

// Student Tracking Types
export interface StudentTracking {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  trackingType: 'academic' | 'behavioral' | 'social';
  notes: string;
  followUpDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}

// Recovery and Enhancement Plans
export interface RecoveryPlan {
  id: string;
  title: string;
  weekNumber: number;
  description: string;
  actions: string[];
  files: string[];
  targetStudents: string[];
  createdBy: string;
  createdAt: Date;
}

export interface EnhancementPlan {
  id: string;
  title: string;
  weekNumber: number;
  description: string;
  activities: string[];
  files: string[];
  targetStudents: string[];
  createdBy: string;
  createdAt: Date;
}

// Diagnostic Tests
export interface DiagnosticTest {
  id: string;
  title: string;
  subject: string;
  gradeLevel: number;
  testType: 'written' | 'oral' | 'practical';
  questions: DiagnosticQuestion[];
  createdBy: string;
  createdAt: Date;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer: string;
  points: number;
}

// Achievements and Violations
export interface Achievement {
  id: string;
  studentId: string;
  type: string;
  description: string;
  points: number;
  date: Date;
  createdBy: string;
}

export interface Violation {
  id: string;
  studentId: string;
  type: string;
  description: string;
  severity: 'minor' | 'major' | 'severe';
  penalty: string;
  date: Date;
  resolved: boolean;
  createdBy: string;
}

// Educational Resources
export interface EducationalResource {
  id: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  gradeLevel: number;
  resourceType: 'file' | 'link' | 'video' | 'document';
  url: string;
  downloadCount: number;
  rating: number;
  createdBy: string;
  createdAt: Date;
}