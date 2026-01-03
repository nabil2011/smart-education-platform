import { PrismaClient, BadgeRarity } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGamificationData() {
  console.log('🌱 Seeding gamification data...');

  try {
    // Create sample badges
    const badges = [
      {
        name: 'First Steps',
        nameAr: 'الخطوات الأولى',
        description: 'Complete your first lesson',
        descriptionAr: 'أكمل درسك الأول',
        icon: '🎯',
        color: '#4CAF50',
        criteria: {
          type: 'points',
          conditions: {
            minPoints: 10
          }
        },
        pointsReward: 25,
        rarity: BadgeRarity.common
      },
      {
        name: 'Quick Learner',
        nameAr: 'متعلم سريع',
        description: 'Complete 5 lessons in a day',
        descriptionAr: 'أكمل 5 دروس في يوم واحد',
        icon: '⚡',
        color: '#FF9800',
        criteria: {
          type: 'content',
          conditions: {
            contentViewed: 5,
            timeframe: 'daily'
          }
        },
        pointsReward: 50,
        rarity: BadgeRarity.rare
      },
      {
        name: 'Assessment Master',
        nameAr: 'أستاذ الاختبارات',
        description: 'Pass 10 assessments with 90% or higher',
        descriptionAr: 'اجتز 10 اختبارات بنسبة 90% أو أعلى',
        icon: '🏆',
        color: '#FFD700',
        criteria: {
          type: 'assessments',
          conditions: {
            assessmentsPassed: 10,
            minScore: 90
          }
        },
        pointsReward: 100,
        rarity: BadgeRarity.epic
      },
      {
        name: 'Streak Champion',
        nameAr: 'بطل التتابع',
        description: 'Maintain a 7-day learning streak',
        descriptionAr: 'حافظ على تتابع التعلم لمدة 7 أيام',
        icon: '🔥',
        color: '#F44336',
        criteria: {
          type: 'streak',
          conditions: {
            streakDays: 7
          }
        },
        pointsReward: 75,
        rarity: BadgeRarity.rare
      },
      {
        name: 'Assignment Pro',
        nameAr: 'محترف الواجبات',
        description: 'Submit 20 assignments on time',
        descriptionAr: 'سلم 20 واجب في الوقت المحدد',
        icon: '📝',
        color: '#2196F3',
        criteria: {
          type: 'assignments',
          conditions: {
            assignmentsCompleted: 20
          }
        },
        pointsReward: 80,
        rarity: BadgeRarity.rare
      },
      {
        name: 'Point Collector',
        nameAr: 'جامع النقاط',
        description: 'Earn 500 points',
        descriptionAr: 'اكسب 500 نقطة',
        icon: '💎',
        color: '#9C27B0',
        criteria: {
          type: 'points',
          conditions: {
            minPoints: 500
          }
        },
        pointsReward: 100,
        rarity: BadgeRarity.epic
      },
      {
        name: 'Legend',
        nameAr: 'أسطورة',
        description: 'Reach 1000 points and maintain a 30-day streak',
        descriptionAr: 'اوصل إلى 1000 نقطة وحافظ على تتابع 30 يوم',
        icon: '👑',
        color: '#E91E63',
        criteria: {
          type: 'composite',
          operator: 'AND',
          subCriteria: [
            {
              type: 'points',
              conditions: { minPoints: 1000 }
            },
            {
              type: 'streak',
              conditions: { streakDays: 30 }
            }
          ]
        },
        pointsReward: 200,
        rarity: BadgeRarity.legendary
      }
    ];

    console.log('Creating badges...');
    for (const badgeData of badges) {
      const existingBadge = await prisma.badge.findFirst({
        where: { name: badgeData.name }
      });

      if (!existingBadge) {
        await prisma.badge.create({
          data: {
            ...badgeData,
            criteria: badgeData.criteria as any
          }
        });
        console.log(`✅ Created badge: ${badgeData.name}`);
      } else {
        console.log(`⏭️  Badge already exists: ${badgeData.name}`);
      }
    }

    console.log('🎉 Gamification data seeded successfully!');
    
    // Display summary
    const badgeCount = await prisma.badge.count();
    console.log(`📊 Total badges in database: ${badgeCount}`);

  } catch (error) {
    console.error('❌ Error seeding gamification data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedGamificationData()
  .catch((error) => {
    console.error('Failed to seed gamification data:', error);
    process.exit(1);
  });