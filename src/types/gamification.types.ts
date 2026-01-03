import { TransactionType, BadgeRarity } from '@prisma/client';

// Points System Types
export interface PointsTransaction {
  id: number;
  studentId: number;
  points: number;
  transactionType: TransactionType;
  referenceId?: number | null;
  referenceType?: string | null;
  description?: string | null;
  createdAt: Date;
}

export interface CreatePointsTransactionDto {
  studentId: number;
  points: number;
  transactionType: TransactionType;
  referenceId?: number;
  referenceType?: string;
  description?: string;
}

export interface StudentPointsSummary {
  studentId: number;
  totalPoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  recentTransactions: PointsTransaction[];
  rank?: number;
}

// Badge System Types
export interface Badge {
  id: number;
  name: string;
  nameAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  icon: string;
  color?: string | null;
  criteria: BadgeCriteria;
  pointsReward: number;
  rarity: BadgeRarity;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateBadgeDto {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  color?: string;
  criteria: BadgeCriteria;
  pointsReward?: number;
  rarity?: BadgeRarity;
}

export interface UpdateBadgeDto {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  color?: string;
  criteria?: BadgeCriteria;
  pointsReward?: number;
  rarity?: BadgeRarity;
  isActive?: boolean;
}

export interface StudentBadge {
  id: number;
  studentId: number;
  badgeId: number;
  earnedAt: Date;
  progressData?: BadgeProgress | null;
  badge?: Badge;
}

export interface BadgeCriteria {
  type: 'points' | 'assessments' | 'assignments' | 'streak' | 'content' | 'composite';
  conditions: {
    minPoints?: number;
    assessmentsPassed?: number;
    assignmentsCompleted?: number;
    streakDays?: number;
    contentViewed?: number;
    gradeLevel?: number;
    subject?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  // For composite badges that require multiple conditions
  subCriteria?: BadgeCriteria[];
  operator?: 'AND' | 'OR';
}

export interface BadgeProgress {
  currentValue: number;
  targetValue: number;
  percentage: number;
  lastUpdated: Date;
  milestones?: {
    value: number;
    achieved: boolean;
    achievedAt?: Date;
  }[];
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  studentName: string;
  totalPoints: number;
  level: number;
  badgeCount: number;
  avatar?: string | null;
  gradeLevel?: number;
  classSection?: string | null;
}

export interface LeaderboardFilters {
  gradeLevel?: number;
  classSection?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalCount: number;
  currentStudentRank?: number;
  lastUpdated: Date;
}

// Gamification Statistics
export interface GamificationStats {
  totalPointsAwarded: number;
  totalBadgesEarned: number;
  activeStudents: number;
  topPerformers: LeaderboardEntry[];
  badgeDistribution: {
    badgeId: number;
    badgeName: string;
    earnedCount: number;
    rarity: BadgeRarity;
  }[];
  pointsDistribution: {
    transactionType: TransactionType;
    totalPoints: number;
    transactionCount: number;
  }[];
}

// Level System
export interface LevelInfo {
  level: number;
  minPoints: number;
  maxPoints: number;
  title: string;
  titleAr: string;
  benefits?: string[];
  icon?: string;
  color?: string;
}

export interface StudentLevelProgress {
  currentLevel: number;
  currentPoints: number;
  pointsToNextLevel: number;
  progressPercentage: number;
  levelInfo: LevelInfo;
  nextLevelInfo?: LevelInfo;
}

// Service Response Types
export interface PointsAwardResult {
  success: boolean;
  transaction: PointsTransaction;
  newTotalPoints: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    levelInfo: LevelInfo;
  };
  badgesEarned?: Badge[];
}

export interface BadgeEarnResult {
  success: boolean;
  studentBadge: StudentBadge;
  pointsAwarded: number;
  newTotalPoints: number;
}

// API Request/Response Types
export interface AwardPointsRequest {
  studentId: number;
  points: number;
  transactionType: TransactionType;
  referenceId?: number;
  referenceType?: string;
  description?: string;
}

export interface GetLeaderboardRequest {
  gradeLevel?: number;
  classSection?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  limit?: number;
  page?: number;
}

export interface GetStudentProgressRequest {
  studentId: number;
  includeTransactions?: boolean;
  includeBadges?: boolean;
  transactionLimit?: number;
}

export interface StudentProgressResponse {
  pointsSummary: StudentPointsSummary;
  levelProgress: StudentLevelProgress;
  badges: StudentBadge[];
  leaderboardRank: number;
  achievements: {
    totalAssessmentsCompleted: number;
    totalAssignmentsSubmitted: number;
    currentStreak: number;
    longestStreak: number;
  };
}

// Badge Check Types
export interface BadgeEligibilityCheck {
  badgeId: number;
  isEligible: boolean;
  progress: BadgeProgress;
  missingRequirements?: string[];
}

export interface CheckBadgeEligibilityRequest {
  studentId: number;
  badgeIds?: number[]; // If not provided, check all active badges
}

export interface CheckBadgeEligibilityResponse {
  studentId: number;
  eligibleBadges: Badge[];
  inProgressBadges: BadgeEligibilityCheck[];
  completedBadges: StudentBadge[];
}