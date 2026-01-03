import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { PrismaClient, TransactionType, BadgeRarity } from '@prisma/client';
import { gamificationService } from '../../services/gamification.service';
import { CreateBadgeDto, BadgeCriteria } from '../../types/gamification.types';

const prisma = new PrismaClient();

describe('Gamification System Properties', () => {
  let testStudentId: number;
  let testBadgeId: number;

  beforeAll(async () => {
    // Create test student
    const testUser = await prisma.user.create({
      data: {
        uuid: 'test-student-gamification',
        email: 'test.student.gamification@example.com',
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
        name: 'Test Badge',
        nameAr: 'شارة اختبار',
        icon: '🏆',
        criteria: {
          type: 'points',
          conditions: {
            minPoints: 100
          }
        } as any,
        pointsReward: 50,
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
    // Reset student points and badges before each test
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

  /**
   * Property 20: منح النقاط الصحيح
   * When points are awarded to a student, the total points should increase correctly
   * and all transactions should be recorded accurately.
   */
  test('Property 20: منح النقاط الصحيح - Points are awarded correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            points: fc.integer({ min: 1, max: 100 }),
            transactionType: fc.constantFrom(...Object.values(TransactionType)),
            description: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (transactions) => {
          // Reset student points
          await prisma.studentProfile.update({
            where: { userId: testStudentId },
            data: { totalPoints: 0, currentLevel: 1 }
          });
          await prisma.pointsTransaction.deleteMany({ where: { studentId: testStudentId } });

          let expectedTotalPoints = 0;
          const awardedTransactions = [];

          // Award points in sequence
          for (const transaction of transactions) {
            const result = await gamificationService.awardPoints({
              studentId: testStudentId,
              points: transaction.points,
              transactionType: transaction.transactionType,
              description: transaction.description
            });

            expectedTotalPoints += transaction.points;
            awardedTransactions.push(result.transaction);

            // Verify the result
            expect(result.success).toBe(true);
            expect(result.newTotalPoints).toBe(expectedTotalPoints);
            expect(result.transaction.points).toBe(transaction.points);
            expect(result.transaction.transactionType).toBe(transaction.transactionType);
          }

          // Verify final state
          const finalPoints = await gamificationService.getStudentPoints(testStudentId);
          expect(finalPoints).toBe(expectedTotalPoints);

          // Verify all transactions are recorded
          const allTransactions = await prisma.pointsTransaction.findMany({
            where: { studentId: testStudentId },
            orderBy: { createdAt: 'asc' }
          });

          expect(allTransactions).toHaveLength(transactions.length);
          
          for (let i = 0; i < transactions.length; i++) {
            expect(allTransactions[i].points).toBe(transactions[i].points);
            expect(allTransactions[i].transactionType).toBe(transactions[i].transactionType);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 21: تتبع النقاط والترتيب
   * The leaderboard should correctly reflect student rankings based on total points,
   * and student ranks should be calculated accurately.
   */
  test('Property 21: تتبع النقاط والترتيب - Points tracking and ranking work correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            points: fc.integer({ min: 50, max: 500 }),
            studentIndex: fc.integer({ min: 0, max: 4 }) // We'll create 5 test students
          }),
          { minLength: 5, maxLength: 20 }
        ),
        async (pointsData) => {
          // Create multiple test students for ranking
          const testStudents = [];
          for (let i = 0; i < 5; i++) {
            const user = await prisma.user.create({
              data: {
                uuid: `test-student-rank-${i}-${Date.now()}`,
                email: `test.rank.${i}.${Date.now()}@example.com`,
                passwordHash: 'hashedpassword',
                firstName: `Student${i}`,
                lastName: 'Test',
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
            testStudents.push(user.id);
          }

          try {
            // Award points to students
            const studentPoints: { [key: number]: number } = {};
            for (const student of testStudents) {
              studentPoints[student] = 0;
            }

            for (const data of pointsData) {
              const studentId = testStudents[data.studentIndex];
              await gamificationService.awardPoints({
                studentId,
                points: data.points,
                transactionType: TransactionType.manual_adjustment,
                description: 'Test points'
              });
              studentPoints[studentId] += data.points;
            }

            // Get leaderboard
            const leaderboard = await gamificationService.getLeaderboard({
              gradeLevel: 5,
              limit: 10
            });

            // Verify leaderboard is sorted by points (descending)
            for (let i = 0; i < leaderboard.entries.length - 1; i++) {
              expect(leaderboard.entries[i].totalPoints).toBeGreaterThanOrEqual(
                leaderboard.entries[i + 1].totalPoints
              );
            }

            // Verify each student's rank matches their position in sorted order
            const sortedStudents = Object.entries(studentPoints)
              .sort(([, a], [, b]) => b - a)
              .map(([studentId]) => parseInt(studentId));

            for (let i = 0; i < Math.min(sortedStudents.length, leaderboard.entries.length); i++) {
              const studentId = sortedStudents[i];
              const rank = await gamificationService.getStudentRank(studentId, 5);
              expect(rank).toBe(i + 1);
            }

          } finally {
            // Cleanup test students
            for (const studentId of testStudents) {
              await prisma.pointsTransaction.deleteMany({ where: { studentId } });
              await prisma.studentProfile.delete({ where: { userId: studentId } });
              await prisma.user.delete({ where: { id: studentId } });
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 22: منح الشارات
   * When a badge is awarded to a student, it should be recorded correctly,
   * points should be awarded if applicable, and the student should not be able
   * to earn the same badge twice.
   */
  test('Property 22: منح الشارات - Badge awarding works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pointsReward: fc.integer({ min: 0, max: 200 }),
          rarity: fc.constantFrom(...Object.values(BadgeRarity))
        }),
        async (badgeData) => {
          // Create a test badge
          const badge = await prisma.badge.create({
            data: {
              name: `Test Badge ${Date.now()}`,
              nameAr: `شارة اختبار ${Date.now()}`,
              icon: '🎖️',
              criteria: {
                type: 'points',
                conditions: { minPoints: 1 }
              } as any,
              pointsReward: badgeData.pointsReward,
              rarity: badgeData.rarity
            }
          });

          try {
            // Get initial points
            const initialPoints = await gamificationService.getStudentPoints(testStudentId);

            // Award the badge
            const result = await gamificationService.awardBadge(testStudentId, badge.id);

            // Verify badge was awarded
            expect(result.success).toBe(true);
            expect(result.studentBadge.studentId).toBe(testStudentId);
            expect(result.studentBadge.badgeId).toBe(badge.id);
            expect(result.pointsAwarded).toBe(badgeData.pointsReward);

            // Verify points were awarded if applicable
            const finalPoints = await gamificationService.getStudentPoints(testStudentId);
            expect(finalPoints).toBe(initialPoints + badgeData.pointsReward);

            // Verify student has the badge
            const studentBadges = await gamificationService.getStudentBadges(testStudentId);
            const earnedBadge = studentBadges.find(sb => sb.badgeId === badge.id);
            expect(earnedBadge).toBeDefined();
            expect(earnedBadge!.earnedAt).toBeInstanceOf(Date);

            // Try to award the same badge again - should fail
            await expect(
              gamificationService.awardBadge(testStudentId, badge.id)
            ).rejects.toThrow('Student already has this badge');

            // Verify points weren't awarded twice
            const pointsAfterSecondAttempt = await gamificationService.getStudentPoints(testStudentId);
            expect(pointsAfterSecondAttempt).toBe(finalPoints);

          } finally {
            // Cleanup
            await prisma.studentBadge.deleteMany({ where: { badgeId: badge.id } });
            await prisma.badge.delete({ where: { id: badge.id } });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 23: تحديث لوحة المتصدرين
   * The leaderboard should be updated correctly when students earn points,
   * and should maintain proper ordering and pagination.
   */
  test('Property 23: تحديث لوحة المتصدرين - Leaderboard updates correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentsCount: fc.integer({ min: 3, max: 8 }),
          pointsOperations: fc.array(
            fc.record({
              studentIndex: fc.integer({ min: 0, max: 7 }),
              points: fc.integer({ min: -50, max: 200 })
            }),
            { minLength: 5, maxLength: 15 }
          ),
          pageSize: fc.integer({ min: 2, max: 5 })
        }),
        async ({ studentsCount, pointsOperations, pageSize }) => {
          // Create test students
          const testStudents = [];
          for (let i = 0; i < studentsCount; i++) {
            const user = await prisma.user.create({
              data: {
                uuid: `test-leaderboard-${i}-${Date.now()}`,
                email: `test.leaderboard.${i}.${Date.now()}@example.com`,
                passwordHash: 'hashedpassword',
                firstName: `Student${i}`,
                lastName: 'Leaderboard',
                role: 'student',
                studentProfile: {
                  create: {
                    gradeLevel: 6,
                    totalPoints: 100, // Start with some points
                    currentLevel: 1,
                    currentStreak: 0,
                    longestStreak: 0
                  }
                }
              }
            });
            testStudents.push(user.id);
          }

          try {
            // Track expected points for each student
            const expectedPoints: { [key: number]: number } = {};
            for (const studentId of testStudents) {
              expectedPoints[studentId] = 100; // Initial points
            }

            // Apply points operations
            for (const operation of pointsOperations) {
              const studentIndex = operation.studentIndex % studentsCount;
              const studentId = testStudents[studentIndex];
              
              if (operation.points > 0) {
                await gamificationService.awardPoints({
                  studentId,
                  points: operation.points,
                  transactionType: TransactionType.manual_adjustment,
                  description: 'Test operation'
                });
              } else if (operation.points < 0) {
                await gamificationService.deductPoints(
                  studentId,
                  Math.abs(operation.points),
                  'Test deduction'
                );
              }
              
              expectedPoints[studentId] = Math.max(0, expectedPoints[studentId] + operation.points);
            }

            // Get full leaderboard
            const fullLeaderboard = await gamificationService.getLeaderboard({
              gradeLevel: 6,
              limit: studentsCount
            });

            // Verify leaderboard properties
            expect(fullLeaderboard.entries.length).toBeLessThanOrEqual(studentsCount);
            
            // Verify ordering (descending by points)
            for (let i = 0; i < fullLeaderboard.entries.length - 1; i++) {
              expect(fullLeaderboard.entries[i].totalPoints).toBeGreaterThanOrEqual(
                fullLeaderboard.entries[i + 1].totalPoints
              );
            }

            // Verify ranks are sequential
            for (let i = 0; i < fullLeaderboard.entries.length; i++) {
              expect(fullLeaderboard.entries[i].rank).toBe(i + 1);
            }

            // Test pagination
            const firstPage = await gamificationService.getLeaderboard({
              gradeLevel: 6,
              limit: pageSize,
              offset: 0
            });

            const secondPage = await gamificationService.getLeaderboard({
              gradeLevel: 6,
              limit: pageSize,
              offset: pageSize
            });

            // Verify pagination doesn't overlap
            const firstPageIds = firstPage.entries.map(e => e.studentId);
            const secondPageIds = secondPage.entries.map(e => e.studentId);
            const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
            expect(overlap).toHaveLength(0);

            // Verify individual ranks match leaderboard positions
            for (const entry of fullLeaderboard.entries) {
              const individualRank = await gamificationService.getStudentRank(entry.studentId, 6);
              expect(individualRank).toBe(entry.rank);
            }

          } finally {
            // Cleanup test students
            for (const studentId of testStudents) {
              await prisma.pointsTransaction.deleteMany({ where: { studentId } });
              await prisma.studentProfile.delete({ where: { userId: studentId } });
              await prisma.user.delete({ where: { id: studentId } });
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Additional Property: Level Calculation Consistency
   * The level calculation should be consistent and monotonic - higher points
   * should never result in a lower level.
   */
  test('Property: Level calculation is consistent and monotonic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.integer({ min: 1, max: 500 }),
          { minLength: 1, maxLength: 20 }
        ),
        async (pointsSequence) => {
          let totalPoints = 0;
          let previousLevel = 1;

          for (const points of pointsSequence) {
            totalPoints += points;
            
            // Update student points
            await gamificationService.awardPoints({
              studentId: testStudentId,
              points,
              transactionType: TransactionType.lesson_complete,
              description: 'Level test'
            });

            // Get level progress
            const levelProgress = await gamificationService.getStudentLevelProgress(testStudentId);
            
            // Verify level is monotonic (never decreases)
            expect(levelProgress.currentLevel).toBeGreaterThanOrEqual(previousLevel);
            
            // Verify points match
            expect(levelProgress.currentPoints).toBe(totalPoints);
            
            // Verify progress percentage is valid
            expect(levelProgress.progressPercentage).toBeGreaterThanOrEqual(0);
            expect(levelProgress.progressPercentage).toBeLessThanOrEqual(100);
            
            // Verify points to next level is non-negative
            expect(levelProgress.pointsToNextLevel).toBeGreaterThanOrEqual(0);

            previousLevel = levelProgress.currentLevel;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Badge Eligibility Consistency
   * Badge eligibility should be calculated consistently and should match
   * the actual criteria defined for each badge.
   */
  test('Property: Badge eligibility is calculated consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          minPoints: fc.integer({ min: 50, max: 300 }),
          studentPoints: fc.integer({ min: 0, max: 500 })
        }),
        async ({ minPoints, studentPoints }) => {
          // Create a points-based badge
          const badge = await prisma.badge.create({
            data: {
              name: `Points Badge ${Date.now()}`,
              nameAr: `شارة النقاط ${Date.now()}`,
              icon: '⭐',
              criteria: {
                type: 'points',
                conditions: { minPoints }
              } as any,
              pointsReward: 25,
              rarity: BadgeRarity.common
            }
          });

          try {
            // Set student points
            await prisma.studentProfile.update({
              where: { userId: testStudentId },
              data: { totalPoints: 0 }
            });
            
            if (studentPoints > 0) {
              await gamificationService.awardPoints({
                studentId: testStudentId,
                points: studentPoints,
                transactionType: TransactionType.manual_adjustment,
                description: 'Badge eligibility test'
              });
            }

            // Check eligibility
            const eligibilityResult = await gamificationService.checkBadgeEligibility(
              testStudentId,
              [badge.id]
            );

            const isEligible = studentPoints >= minPoints;
            const eligibleBadgeIds = eligibilityResult.eligibleBadges.map(b => b.id);
            const inProgressBadgeIds = eligibilityResult.inProgressBadges.map(b => b.badgeId);

            if (isEligible) {
              // Should be in eligible badges
              expect(eligibleBadgeIds).toContain(badge.id);
              expect(inProgressBadgeIds).not.toContain(badge.id);
            } else {
              // Should be in progress badges
              expect(eligibleBadgeIds).not.toContain(badge.id);
              expect(inProgressBadgeIds).toContain(badge.id);
              
              // Check progress calculation
              const progressBadge = eligibilityResult.inProgressBadges.find(b => b.badgeId === badge.id);
              expect(progressBadge).toBeDefined();
              expect(progressBadge!.progress.currentValue).toBe(studentPoints);
              expect(progressBadge!.progress.targetValue).toBe(minPoints);
              
              const expectedPercentage = (studentPoints / minPoints) * 100;
              expect(progressBadge!.progress.percentage).toBeCloseTo(expectedPercentage, 1);
            }

          } finally {
            // Cleanup
            await prisma.badge.delete({ where: { id: badge.id } });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});