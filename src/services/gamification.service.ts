import { PrismaClient, TransactionType, BadgeRarity } from '@prisma/client';
import {
  PointsTransaction,
  CreatePointsTransactionDto,
  StudentPointsSummary,
  Badge,
  CreateBadgeDto,
  UpdateBadgeDto,
  StudentBadge,
  BadgeCriteria,
  BadgeProgress,
  LeaderboardEntry,
  LeaderboardFilters,
  LeaderboardResponse,
  GamificationStats,
  LevelInfo,
  StudentLevelProgress,
  PointsAwardResult,
  BadgeEarnResult,
  BadgeEligibilityCheck,
  CheckBadgeEligibilityResponse
} from '../types/gamification.types';

const prisma = new PrismaClient();

// Level configuration - can be moved to database later
const LEVEL_CONFIG: LevelInfo[] = [
  { level: 1, minPoints: 0, maxPoints: 99, title: 'Beginner', titleAr: 'مبتدئ', icon: '🌱', color: '#4CAF50' },
  { level: 2, minPoints: 100, maxPoints: 249, title: 'Explorer', titleAr: 'مستكشف', icon: '🔍', color: '#2196F3' },
  { level: 3, minPoints: 250, maxPoints: 499, title: 'Scholar', titleAr: 'طالب علم', icon: '📚', color: '#9C27B0' },
  { level: 4, minPoints: 500, maxPoints: 999, title: 'Expert', titleAr: 'خبير', icon: '🎓', color: '#FF9800' },
  { level: 5, minPoints: 1000, maxPoints: 1999, title: 'Master', titleAr: 'أستاذ', icon: '👑', color: '#F44336' },
  { level: 6, minPoints: 2000, maxPoints: 4999, title: 'Champion', titleAr: 'بطل', icon: '🏆', color: '#FFD700' },
  { level: 7, minPoints: 5000, maxPoints: 9999, title: 'Legend', titleAr: 'أسطورة', icon: '⭐', color: '#E91E63' },
  { level: 8, minPoints: 10000, maxPoints: Number.MAX_SAFE_INTEGER, title: 'Grandmaster', titleAr: 'أستاذ أعظم', icon: '💎', color: '#9C27B0' }
];

export class GamificationService {
  // Points Management
  async awardPoints(data: CreatePointsTransactionDto): Promise<PointsAwardResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create points transaction
        const transaction = await tx.pointsTransaction.create({
          data: {
            studentId: data.studentId,
            points: data.points,
            transactionType: data.transactionType,
            referenceId: data.referenceId,
            referenceType: data.referenceType,
            description: data.description
          }
        });

        // Update student profile total points
        const updatedProfile = await tx.studentProfile.update({
          where: { userId: data.studentId },
          data: {
            totalPoints: {
              increment: data.points
            }
          }
        });

        // Check for level up
        const oldLevel = this.calculateLevel(updatedProfile.totalPoints - data.points);
        const newLevel = this.calculateLevel(updatedProfile.totalPoints);
        
        let levelUpInfo = undefined;
        if (newLevel > oldLevel) {
          // Update current level in profile
          await tx.studentProfile.update({
            where: { userId: data.studentId },
            data: { currentLevel: newLevel }
          });

          levelUpInfo = {
            oldLevel,
            newLevel,
            levelInfo: this.getLevelInfo(newLevel)
          };
        }

        // Check for new badges earned
        const badgesEarned = await this.checkAndAwardBadges(data.studentId, tx);

        return {
          transaction,
          newTotalPoints: updatedProfile.totalPoints,
          levelUpInfo,
          badgesEarned
        };
      });

      return {
        success: true,
        transaction: result.transaction,
        newTotalPoints: result.newTotalPoints,
        levelUp: result.levelUpInfo,
        badgesEarned: result.badgesEarned
      };
    } catch (error) {
      console.error('Error awarding points:', error);
      throw new Error('Failed to award points');
    }
  }

  async deductPoints(studentId: number, points: number, reason: string): Promise<PointsAwardResult> {
    return this.awardPoints({
      studentId,
      points: -Math.abs(points), // Ensure negative
      transactionType: TransactionType.manual_adjustment,
      description: reason
    });
  }

  async getStudentPoints(studentId: number): Promise<number> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });
    return profile?.totalPoints || 0;
  }

  async getStudentPointsSummary(studentId: number, includeTransactions = true): Promise<StudentPointsSummary> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const recentTransactions = includeTransactions 
      ? await prisma.pointsTransaction.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      : [];

    const currentLevel = this.calculateLevel(profile.totalPoints);
    const nextLevelInfo = this.getLevelInfo(currentLevel + 1);
    const pointsToNextLevel = nextLevelInfo ? nextLevelInfo.minPoints - profile.totalPoints : 0;

    return {
      studentId,
      totalPoints: profile.totalPoints,
      currentLevel,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
      recentTransactions
    };
  }

  // Badge Management
  async createBadge(data: CreateBadgeDto): Promise<Badge> {
    const badge = await prisma.badge.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        icon: data.icon,
        color: data.color,
        criteria: data.criteria as any,
        pointsReward: data.pointsReward || 0,
        rarity: data.rarity || BadgeRarity.common
      }
    });

    return {
      ...badge,
      criteria: badge.criteria as unknown as BadgeCriteria
    };
  }

  async updateBadge(id: number, data: UpdateBadgeDto): Promise<Badge> {
    const badge = await prisma.badge.update({
      where: { id },
      data: {
        ...data,
        criteria: data.criteria as any
      }
    });

    return {
      ...badge,
      criteria: badge.criteria as unknown as BadgeCriteria
    };
  }

  async getBadges(activeOnly = true): Promise<Badge[]> {
    const badges = await prisma.badge.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [
        { rarity: 'desc' },
        { pointsReward: 'desc' },
        { name: 'asc' }
      ]
    });

    return badges.map(badge => ({
      ...badge,
      criteria: badge.criteria as unknown as BadgeCriteria
    }));
  }

  async getBadgeById(id: number): Promise<Badge | null> {
    const badge = await prisma.badge.findUnique({
      where: { id }
    });

    if (!badge) return null;

    return {
      ...badge,
      criteria: badge.criteria as unknown as BadgeCriteria
    };
  }

  async awardBadge(studentId: number, badgeId: number): Promise<BadgeEarnResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Check if student already has this badge
        const existingBadge = await tx.studentBadge.findUnique({
          where: {
            studentId_badgeId: {
              studentId,
              badgeId
            }
          }
        });

        if (existingBadge) {
          throw new Error('Student already has this badge');
        }

        // Get badge info
        const badge = await tx.badge.findUnique({
          where: { id: badgeId }
        });

        if (!badge) {
          throw new Error('Badge not found');
        }

        // Award the badge
        const studentBadge = await tx.studentBadge.create({
          data: {
            studentId,
            badgeId,
            progressData: {
              completed: true,
              completedAt: new Date()
            }
          },
          include: {
            badge: true
          }
        });

        // Award points if badge has points reward
        let newTotalPoints = 0;
        if (badge.pointsReward > 0) {
          await tx.pointsTransaction.create({
            data: {
              studentId,
              points: badge.pointsReward,
              transactionType: TransactionType.badge_earned,
              referenceId: badgeId,
              referenceType: 'badge',
              description: `Badge earned: ${badge.name}`
            }
          });

          const updatedProfile = await tx.studentProfile.update({
            where: { userId: studentId },
            data: {
              totalPoints: {
                increment: badge.pointsReward
              }
            }
          });

          newTotalPoints = updatedProfile.totalPoints;
        } else {
          const profile = await tx.studentProfile.findUnique({
            where: { userId: studentId }
          });
          newTotalPoints = profile?.totalPoints || 0;
        }

        return {
          studentBadge,
          pointsAwarded: badge.pointsReward,
          newTotalPoints
        };
      });

      return {
        success: true,
        studentBadge: {
          ...result.studentBadge,
          progressData: result.studentBadge.progressData as BadgeProgress | null,
          badge: result.studentBadge.badge ? {
            ...result.studentBadge.badge,
            criteria: result.studentBadge.badge.criteria as unknown as BadgeCriteria
          } : undefined
        },
        pointsAwarded: result.pointsAwarded,
        newTotalPoints: result.newTotalPoints
      };
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  async getStudentBadges(studentId: number): Promise<StudentBadge[]> {
    const badges = await prisma.studentBadge.findMany({
      where: { studentId },
      include: {
        badge: true
      },
      orderBy: { earnedAt: 'desc' }
    });

    return badges.map(badge => ({
      ...badge,
      progressData: badge.progressData as BadgeProgress | null,
      badge: badge.badge ? {
        ...badge.badge,
        criteria: badge.badge.criteria as unknown as BadgeCriteria
      } : undefined
    }));
  }

  async checkBadgeEligibility(studentId: number, badgeIds?: number[]): Promise<CheckBadgeEligibilityResponse> {
    const badges = await prisma.badge.findMany({
      where: {
        isActive: true,
        ...(badgeIds && { id: { in: badgeIds } })
      }
    });

    const studentBadges = await this.getStudentBadges(studentId);
    const earnedBadgeIds = studentBadges.map(sb => sb.badgeId);

    const eligibleBadges: Badge[] = [];
    const inProgressBadges: BadgeEligibilityCheck[] = [];

    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge.id)) {
        continue; // Already earned
      }

      const eligibilityCheck = await this.checkSingleBadgeEligibility(studentId, {
        ...badge,
        criteria: badge.criteria as unknown as BadgeCriteria
      });
      
      if (eligibilityCheck.isEligible) {
        eligibleBadges.push({
          ...badge,
          criteria: badge.criteria as unknown as BadgeCriteria
        });
      } else {
        inProgressBadges.push(eligibilityCheck);
      }
    }

    return {
      studentId,
      eligibleBadges,
      inProgressBadges,
      completedBadges: studentBadges
    };
  }

  // Leaderboard
  async getLeaderboard(filters: LeaderboardFilters = {}): Promise<LeaderboardResponse> {
    const {
      gradeLevel,
      classSection,
      timeframe = 'all_time',
      limit = 50,
      offset = 0
    } = filters;

    let whereClause: any = {
      role: 'student',
      isActive: true
    };

    if (gradeLevel || classSection) {
      whereClause.studentProfile = {
        ...(gradeLevel && { gradeLevel }),
        ...(classSection && { classSection })
      };
    }

    // For time-based leaderboards, we might need to calculate points differently
    // For now, using total points (all_time)
    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        studentProfile: true,
        studentBadges: {
          include: {
            badge: true
          }
        }
      },
      orderBy: {
        studentProfile: {
          totalPoints: 'desc'
        }
      },
      skip: offset,
      take: limit
    });

    const totalCount = await prisma.user.count({
      where: whereClause
    });

    const entries: LeaderboardEntry[] = students.map((student, index) => ({
      rank: offset + index + 1,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      totalPoints: student.studentProfile?.totalPoints || 0,
      level: this.calculateLevel(student.studentProfile?.totalPoints || 0),
      badgeCount: student.studentBadges.length,
      avatar: student.avatarUrl,
      gradeLevel: student.studentProfile?.gradeLevel,
      classSection: student.studentProfile?.classSection
    }));

    return {
      entries,
      totalCount,
      lastUpdated: new Date()
    };
  }

  async getStudentRank(studentId: number, gradeLevel?: number): Promise<number> {
    let whereClause: any = {
      role: 'student',
      isActive: true
    };

    if (gradeLevel) {
      whereClause.studentProfile = { gradeLevel };
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });

    if (!studentProfile) {
      return 0;
    }

    const rank = await prisma.user.count({
      where: {
        ...whereClause,
        studentProfile: {
          ...whereClause.studentProfile,
          totalPoints: {
            gt: studentProfile.totalPoints
          }
        }
      }
    });

    return rank + 1;
  }

  // Statistics
  async getGamificationStats(): Promise<GamificationStats> {
    const [
      totalPointsResult,
      totalBadgesResult,
      activeStudentsResult,
      topPerformers,
      badgeDistribution,
      pointsDistribution
    ] = await Promise.all([
      prisma.pointsTransaction.aggregate({
        _sum: { points: true }
      }),
      prisma.studentBadge.count(),
      prisma.user.count({
        where: {
          role: 'student',
          isActive: true
        }
      }),
      this.getLeaderboard({ limit: 10 }),
      prisma.studentBadge.groupBy({
        by: ['badgeId'],
        _count: { badgeId: true },
        orderBy: { _count: { badgeId: 'desc' } }
      }),
      prisma.pointsTransaction.groupBy({
        by: ['transactionType'],
        _sum: { points: true },
        _count: { transactionType: true }
      })
    ]);

    // Get badge details for distribution
    const badgeIds = badgeDistribution.map(bd => bd.badgeId);
    const badges = await prisma.badge.findMany({
      where: { id: { in: badgeIds } }
    });

    const badgeDistributionWithDetails = badgeDistribution.map(bd => {
      const badge = badges.find(b => b.id === bd.badgeId);
      return {
        badgeId: bd.badgeId,
        badgeName: badge?.name || 'Unknown',
        earnedCount: bd._count.badgeId,
        rarity: badge?.rarity || BadgeRarity.common
      };
    });

    return {
      totalPointsAwarded: totalPointsResult._sum.points || 0,
      totalBadgesEarned: totalBadgesResult,
      activeStudents: activeStudentsResult,
      topPerformers: topPerformers.entries,
      badgeDistribution: badgeDistributionWithDetails,
      pointsDistribution: pointsDistribution.map(pd => ({
        transactionType: pd.transactionType,
        totalPoints: pd._sum.points || 0,
        transactionCount: pd._count.transactionType
      }))
    };
  }

  // Level System Helpers
  calculateLevel(points: number): number {
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
      if (points >= LEVEL_CONFIG[i].minPoints) {
        return LEVEL_CONFIG[i].level;
      }
    }
    return 1;
  }

  getLevelInfo(level: number): LevelInfo {
    return LEVEL_CONFIG.find(l => l.level === level) || LEVEL_CONFIG[0];
  }

  async getStudentLevelProgress(studentId: number): Promise<StudentLevelProgress> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const currentLevel = this.calculateLevel(profile.totalPoints);
    const levelInfo = this.getLevelInfo(currentLevel);
    const nextLevelInfo = this.getLevelInfo(currentLevel + 1);

    const pointsToNextLevel = nextLevelInfo ? nextLevelInfo.minPoints - profile.totalPoints : 0;
    const levelRange = nextLevelInfo ? nextLevelInfo.minPoints - levelInfo.minPoints : 1;
    const progressInLevel = nextLevelInfo ? profile.totalPoints - levelInfo.minPoints : 0;
    const progressPercentage = nextLevelInfo ? (progressInLevel / levelRange) * 100 : 100;

    return {
      currentLevel,
      currentPoints: profile.totalPoints,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      levelInfo,
      nextLevelInfo
    };
  }

  // Private helper methods
  private async checkAndAwardBadges(studentId: number, tx: any): Promise<Badge[]> {
    const eligibilityResponse = await this.checkBadgeEligibility(studentId);
    const badgesEarned: Badge[] = [];

    for (const badge of eligibilityResponse.eligibleBadges) {
      try {
        await this.awardBadge(studentId, badge.id);
        badgesEarned.push(badge);
      } catch (error) {
        console.error(`Error awarding badge ${badge.id} to student ${studentId}:`, error);
      }
    }

    return badgesEarned;
  }

  private async checkSingleBadgeEligibility(studentId: number, badge: Badge): Promise<BadgeEligibilityCheck> {
    const criteria = badge.criteria as BadgeCriteria;
    const progress = await this.calculateBadgeProgress(studentId, criteria);

    return {
      badgeId: badge.id,
      isEligible: progress.percentage >= 100,
      progress,
      missingRequirements: progress.percentage < 100 ? this.getMissingRequirements(criteria, progress) : undefined
    };
  }

  private async calculateBadgeProgress(studentId: number, criteria: BadgeCriteria): Promise<BadgeProgress> {
    let currentValue = 0;
    let targetValue = 1;

    switch (criteria.type) {
      case 'points':
        const profile = await prisma.studentProfile.findUnique({
          where: { userId: studentId }
        });
        currentValue = profile?.totalPoints || 0;
        targetValue = criteria.conditions.minPoints || 0;
        break;

      case 'assessments':
        const assessmentCount = await prisma.assessmentAttempt.count({
          where: {
            studentId,
            status: 'completed',
            percentageScore: { gte: 70 } // Assuming 70% is passing
          }
        });
        currentValue = assessmentCount;
        targetValue = criteria.conditions.assessmentsPassed || 0;
        break;

      case 'assignments':
        const assignmentCount = await prisma.assignmentSubmission.count({
          where: {
            studentId,
            status: 'submitted'
          }
        });
        currentValue = assignmentCount;
        targetValue = criteria.conditions.assignmentsCompleted || 0;
        break;

      case 'streak':
        const studentProfile = await prisma.studentProfile.findUnique({
          where: { userId: studentId }
        });
        currentValue = studentProfile?.currentStreak || 0;
        targetValue = criteria.conditions.streakDays || 0;
        break;

      case 'content':
        const contentViews = await prisma.content.count({
          where: {
            viewCount: { gt: 0 }
            // This is simplified - in reality, we'd need a separate table to track individual user views
          }
        });
        currentValue = contentViews;
        targetValue = criteria.conditions.contentViewed || 0;
        break;

      default:
        currentValue = 0;
        targetValue = 1;
    }

    const percentage = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;

    return {
      currentValue,
      targetValue,
      percentage,
      lastUpdated: new Date()
    };
  }

  private getMissingRequirements(criteria: BadgeCriteria, progress: BadgeProgress): string[] {
    const missing: string[] = [];
    const remaining = progress.targetValue - progress.currentValue;

    switch (criteria.type) {
      case 'points':
        if (remaining > 0) {
          missing.push(`Need ${remaining} more points`);
        }
        break;
      case 'assessments':
        if (remaining > 0) {
          missing.push(`Need to pass ${remaining} more assessments`);
        }
        break;
      case 'assignments':
        if (remaining > 0) {
          missing.push(`Need to complete ${remaining} more assignments`);
        }
        break;
      case 'streak':
        if (remaining > 0) {
          missing.push(`Need ${remaining} more consecutive days`);
        }
        break;
      case 'content':
        if (remaining > 0) {
          missing.push(`Need to view ${remaining} more content items`);
        }
        break;
    }

    return missing;
  }
}

export const gamificationService = new GamificationService();