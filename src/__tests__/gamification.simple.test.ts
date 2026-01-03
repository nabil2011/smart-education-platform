import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, TransactionType, BadgeRarity } from '@prisma/client';
import { gamificationService } from '../services/gamification.service';

const prisma = new PrismaClient();

describe('Gamification Service - Simple Tests', () => {
  let testStudentId: number;
  let testBadgeId: number;

  beforeAll(async () => {
    // Create test student
    const testUser = await prisma.user.create({
      data: {
        uuid: 'test-student-simple-gamification',
        email: 'test.student.simple.gamification@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        studentProfile: {
          create: {
            gradeLevel: 5,
            totalPoints: 0,
            currentLevel: 1,
            currentStreak: 0,
            longestStreak: 0
          }
        }
      }
    });
    testStudentId = testUser.id;

    // Create test badge
    const testBadge = await prisma.badge.create({
      data: {
        name: 'First Steps',
        nameAr: 'الخطوات الأولى',
        description: 'Complete your first lesson',
        descriptionAr: 'أكمل درسك الأول',
        icon: '🎯',
        color: '#4CAF50',
        criteria: {
          type: 'points',
          conditions: {
            minPoints: 50
          }
        } as any,
        pointsReward: 25,
        rarity: BadgeRarity.common
      }
    });
    testBadgeId = testBadge.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.studentBadge.deleteMany({ where: { studentId: testStudentId } });
    await prisma.pointsTransaction.deleteMany({ where: { studentId: testStudentId } });
    await prisma.badge.delete({ where: { id: testBadgeId } });
    await prisma.studentProfile.delete({ where: { userId: testStudentId } });
    await prisma.user.delete({ where: { id: testStudentId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset student state before each test
    await prisma.studentBadge.deleteMany({ where: { studentId: testStudentId } });
    await prisma.pointsTransaction.deleteMany({ where: { studentId: testStudentId } });
    await prisma.studentProfile.update({
      where: { userId: testStudentId },
      data: {
        totalPoints: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0
      }
    });
  });

  describe('Points Management', () => {
    test('should award points correctly', async () => {
      const result = await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 100,
        transactionType: TransactionType.lesson_complete,
        description: 'Completed first lesson'
      });

      expect(result.success).toBe(true);
      expect(result.transaction.points).toBe(100);
      expect(result.transaction.transactionType).toBe(TransactionType.lesson_complete);
      expect(result.newTotalPoints).toBe(100);

      // Verify points are stored correctly
      const totalPoints = await gamificationService.getStudentPoints(testStudentId);
      expect(totalPoints).toBe(100);
    });

    test('should deduct points correctly', async () => {
      // First award some points
      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 150,
        transactionType: TransactionType.manual_adjustment,
        description: 'Initial points'
      });

      // Then deduct points
      const result = await gamificationService.deductPoints(
        testStudentId,
        50,
        'Late submission penalty'
      );

      expect(result.success).toBe(true);
      expect(result.transaction.points).toBe(-50);
      expect(result.newTotalPoints).toBe(100);

      // Verify final points
      const totalPoints = await gamificationService.getStudentPoints(testStudentId);
      expect(totalPoints).toBe(100);
    });

    test('should calculate level correctly', async () => {
      // Award points to reach level 2 (100+ points)
      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 150,
        transactionType: TransactionType.assessment_pass,
        description: 'Assessment completed'
      });

      const levelProgress = await gamificationService.getStudentLevelProgress(testStudentId);
      
      expect(levelProgress.currentLevel).toBe(2);
      expect(levelProgress.currentPoints).toBe(150);
      expect(levelProgress.levelInfo.title).toBe('Explorer');
      expect(levelProgress.progressPercentage).toBeGreaterThan(0);
      expect(levelProgress.pointsToNextLevel).toBeGreaterThan(0);
    });

    test('should get student points summary', async () => {
      // Award multiple points transactions
      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 50,
        transactionType: TransactionType.lesson_complete,
        description: 'Lesson 1'
      });

      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 75,
        transactionType: TransactionType.assignment_submit,
        description: 'Assignment 1'
      });

      const summary = await gamificationService.getStudentPointsSummary(testStudentId);

      expect(summary.studentId).toBe(testStudentId);
      expect(summary.totalPoints).toBe(125);
      expect(summary.currentLevel).toBe(2); // 125 points = level 2
      expect(summary.recentTransactions).toHaveLength(2);
      expect(summary.pointsToNextLevel).toBeGreaterThan(0);
    });
  });

  describe('Badge Management', () => {
    test('should create badge correctly', async () => {
      const badgeData = {
        name: 'Test Achievement',
        nameAr: 'إنجاز اختبار',
        description: 'Test badge description',
        icon: '🏅',
        color: '#FF9800',
        criteria: {
          type: 'assessments' as const,
          conditions: {
            assessmentsPassed: 5
          }
        },
        pointsReward: 100,
        rarity: BadgeRarity.rare
      };

      const badge = await gamificationService.createBadge(badgeData);

      expect(badge.name).toBe(badgeData.name);
      expect(badge.nameAr).toBe(badgeData.nameAr);
      expect(badge.icon).toBe(badgeData.icon);
      expect(badge.pointsReward).toBe(badgeData.pointsReward);
      expect(badge.rarity).toBe(BadgeRarity.rare);
      expect(badge.isActive).toBe(true);

      // Cleanup
      await prisma.badge.delete({ where: { id: badge.id } });
    });

    test('should award badge correctly', async () => {
      // First give student enough points to be eligible
      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 60,
        transactionType: TransactionType.lesson_complete,
        description: 'Enough points for badge'
      });

      const result = await gamificationService.awardBadge(testStudentId, testBadgeId);

      expect(result.success).toBe(true);
      expect(result.studentBadge.studentId).toBe(testStudentId);
      expect(result.studentBadge.badgeId).toBe(testBadgeId);
      expect(result.pointsAwarded).toBe(25); // Badge reward points
      expect(result.newTotalPoints).toBe(85); // 60 + 25

      // Verify badge is in student's collection
      const studentBadges = await gamificationService.getStudentBadges(testStudentId);
      expect(studentBadges).toHaveLength(1);
      expect(studentBadges[0].badgeId).toBe(testBadgeId);
    });

    test('should not award same badge twice', async () => {
      // Award badge first time
      await gamificationService.awardBadge(testStudentId, testBadgeId);

      // Try to award same badge again
      await expect(
        gamificationService.awardBadge(testStudentId, testBadgeId)
      ).rejects.toThrow('Student already has this badge');

      // Verify student still has only one badge
      const studentBadges = await gamificationService.getStudentBadges(testStudentId);
      expect(studentBadges).toHaveLength(1);
    });

    test('should get all badges', async () => {
      const badges = await gamificationService.getBadges();
      
      expect(Array.isArray(badges)).toBe(true);
      expect(badges.length).toBeGreaterThan(0);
      
      // All returned badges should be active
      badges.forEach(badge => {
        expect(badge.isActive).toBe(true);
      });
    });

    test('should check badge eligibility correctly', async () => {
      // Student has 0 points, needs 50 for the badge
      const eligibilityResult = await gamificationService.checkBadgeEligibility(
        testStudentId,
        [testBadgeId]
      );

      expect(eligibilityResult.studentId).toBe(testStudentId);
      expect(eligibilityResult.eligibleBadges).toHaveLength(0);
      expect(eligibilityResult.inProgressBadges).toHaveLength(1);
      
      const inProgressBadge = eligibilityResult.inProgressBadges[0];
      expect(inProgressBadge.badgeId).toBe(testBadgeId);
      expect(inProgressBadge.isEligible).toBe(false);
      expect(inProgressBadge.progress.currentValue).toBe(0);
      expect(inProgressBadge.progress.targetValue).toBe(50);
      expect(inProgressBadge.progress.percentage).toBe(0);

      // Now give student enough points
      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 75,
        transactionType: TransactionType.lesson_complete,
        description: 'Enough for badge'
      });

      const eligibilityResult2 = await gamificationService.checkBadgeEligibility(
        testStudentId,
        [testBadgeId]
      );

      expect(eligibilityResult2.eligibleBadges).toHaveLength(1);
      expect(eligibilityResult2.eligibleBadges[0].id).toBe(testBadgeId);
      expect(eligibilityResult2.inProgressBadges).toHaveLength(0);
    });
  });

  describe('Leaderboard', () => {
    test('should get leaderboard correctly', async () => {
      // Create additional test students for leaderboard
      const student2 = await prisma.user.create({
        data: {
          uuid: 'test-student-leaderboard-2',
          email: 'test.student.leaderboard.2@example.com',
          passwordHash: 'hashedpassword',
          firstName: 'Student',
          lastName: 'Two',
          role: 'student',
          studentProfile: {
            create: {
              gradeLevel: 5,
              totalPoints: 200,
              currentLevel: 2
            }
          }
        }
      });

      const student3 = await prisma.user.create({
        data: {
          uuid: 'test-student-leaderboard-3',
          email: 'test.student.leaderboard.3@example.com',
          passwordHash: 'hashedpassword',
          firstName: 'Student',
          lastName: 'Three',
          role: 'student',
          studentProfile: {
            create: {
              gradeLevel: 5,
              totalPoints: 150,
              currentLevel: 2
            }
          }
        }
      });

      try {
        // Award points to test student
        await gamificationService.awardPoints({
          studentId: testStudentId,
          points: 100,
          transactionType: TransactionType.lesson_complete,
          description: 'Test points'
        });

        const leaderboard = await gamificationService.getLeaderboard({
          gradeLevel: 5,
          limit: 10
        });

        expect(leaderboard.entries.length).toBeGreaterThanOrEqual(3);
        
        // Should be ordered by points (descending)
        expect(leaderboard.entries[0].totalPoints).toBeGreaterThanOrEqual(
          leaderboard.entries[1].totalPoints
        );
        
        // Ranks should be sequential
        expect(leaderboard.entries[0].rank).toBe(1);
        expect(leaderboard.entries[1].rank).toBe(2);
        expect(leaderboard.entries[2].rank).toBe(3);

        // Check individual student rank
        const studentRank = await gamificationService.getStudentRank(testStudentId, 5);
        expect(studentRank).toBeGreaterThan(0);
        expect(studentRank).toBeLessThanOrEqual(3);

      } finally {
        // Cleanup additional students
        await prisma.studentProfile.delete({ where: { userId: student2.id } });
        await prisma.user.delete({ where: { id: student2.id } });
        await prisma.studentProfile.delete({ where: { userId: student3.id } });
        await prisma.user.delete({ where: { id: student3.id } });
      }
    });

    test('should get student rank correctly', async () => {
      // Award points to test student
      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 250,
        transactionType: TransactionType.assessment_pass,
        description: 'High score'
      });

      const rank = await gamificationService.getStudentRank(testStudentId);
      expect(rank).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    test('should get gamification statistics', async () => {
      // Award some points and badges to generate statistics
      await gamificationService.awardPoints({
        studentId: testStudentId,
        points: 100,
        transactionType: TransactionType.lesson_complete,
        description: 'Stats test'
      });

      await gamificationService.awardBadge(testStudentId, testBadgeId);

      const stats = await gamificationService.getGamificationStats();

      expect(stats.totalPointsAwarded).toBeGreaterThan(0);
      expect(stats.totalBadgesEarned).toBeGreaterThan(0);
      expect(stats.activeStudents).toBeGreaterThan(0);
      expect(Array.isArray(stats.topPerformers)).toBe(true);
      expect(Array.isArray(stats.badgeDistribution)).toBe(true);
      expect(Array.isArray(stats.pointsDistribution)).toBe(true);
    });
  });
});