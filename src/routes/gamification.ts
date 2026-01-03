import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { gamificationService } from '../services/gamification.service';
import { TransactionType, BadgeRarity } from '@prisma/client';

const router = Router();

// Award points to a student
router.post('/points/award',
  authenticate,
  authorize(['teacher', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, points, transactionType, referenceId, referenceType, description } = req.body;

      if (!studentId || !points || !transactionType) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: studentId, points, transactionType'
        });
        return;
      }

      const result = await gamificationService.awardPoints({
        studentId,
        points,
        transactionType,
        referenceId,
        referenceType,
        description
      });

      res.json(result);
    } catch (error) {
      console.error('Error awarding points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to award points',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get student's total points
router.get('/students/:studentId/points',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      if (isNaN(studentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
        return;
      }

      const totalPoints = await gamificationService.getStudentPoints(studentId);

      res.json({
        studentId,
        totalPoints
      });
    } catch (error) {
      console.error('Error getting student points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get student points',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get comprehensive student progress
router.get('/students/:studentId/progress',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      if (isNaN(studentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
        return;
      }

      const [pointsSummary, levelProgress, badges, leaderboardRank] = await Promise.all([
        gamificationService.getStudentPointsSummary(studentId, true),
        gamificationService.getStudentLevelProgress(studentId),
        gamificationService.getStudentBadges(studentId),
        gamificationService.getStudentRank(studentId)
      ]);

      const response = {
        pointsSummary,
        levelProgress,
        badges,
        leaderboardRank,
        achievements: {
          totalAssessmentsCompleted: 0,
          totalAssignmentsSubmitted: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting student progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get student progress',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get all badges
router.get('/badges',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const badges = await gamificationService.getBadges();
      res.json(badges);
    } catch (error) {
      console.error('Error getting badges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get badges',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Create a new badge
router.post('/badges',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, nameAr, description, descriptionAr, icon, color, criteria, pointsReward, rarity } = req.body;

      if (!name || !nameAr || !icon || !criteria) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, nameAr, icon, criteria'
        });
        return;
      }

      const badge = await gamificationService.createBadge({
        name,
        nameAr,
        description,
        descriptionAr,
        icon,
        color,
        criteria,
        pointsReward,
        rarity
      });

      res.status(201).json(badge);
    } catch (error) {
      console.error('Error creating badge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create badge',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Award a badge to a student
router.post('/badges/:badgeId/award',
  authenticate,
  authorize(['teacher', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const badgeId = parseInt(req.params.badgeId);
      const { studentId } = req.body;

      if (isNaN(badgeId) || !studentId) {
        res.status(400).json({
          success: false,
          message: 'Invalid badge ID or missing student ID'
        });
        return;
      }

      const result = await gamificationService.awardBadge(studentId, badgeId);
      res.json(result);
    } catch (error) {
      console.error('Error awarding badge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to award badge',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get student's badges
router.get('/students/:studentId/badges',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      if (isNaN(studentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
        return;
      }

      const badges = await gamificationService.getStudentBadges(studentId);
      res.json(badges);
    } catch (error) {
      console.error('Error getting student badges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get student badges',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get leaderboard
router.get('/leaderboard',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const leaderboard = await gamificationService.getLeaderboard({
        gradeLevel,
        limit
      });

      res.json(leaderboard);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get leaderboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get gamification statistics
router.get('/stats',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await gamificationService.getGamificationStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting gamification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get gamification statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;