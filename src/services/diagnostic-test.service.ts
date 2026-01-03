/**
 * خدمة الاختبارات التشخيصية
 * Diagnostic Test Service
 */

import { PrismaClient } from '@prisma/client';
import {
  DiagnosticTest,
  DiagnosticTestResult,
  CreateDiagnosticTestDto,
  UpdateDiagnosticTestDto,
  CreateTestResultDto,
  UpdateTestResultDto,
  DiagnosticTestFilters,
  TestResultFilters,
  PaginatedDiagnosticTests,
  PaginatedTestResults,
  TestAnalysis,
  LearningRecommendations,
  WeaknessAnalysis,
  DiagnosticTestStatistics,
  StudentPerformanceReport,
  WeaknessArea,
  WeaknessType,
  TestResultStatus
} from '../types/diagnostic-test.types';

const prisma = new PrismaClient();

export class DiagnosticTestService {
  
  // ==================== إدارة الاختبارات ====================
  
  /**
   * إنشاء اختبار تشخيصي جديد
   */
  async createDiagnosticTest(
    testData: CreateDiagnosticTestDto,
    createdBy: number
  ): Promise<DiagnosticTest> {
    const test = await prisma.diagnosticTest.create({
      data: {
        title: testData.title,
        description: testData.description,
        subjectId: testData.subjectId,
        gradeLevel: testData.gradeLevel,
        testType: testData.testType,
        difficulty: testData.difficulty,
        duration: testData.duration,
        totalMarks: testData.totalMarks,
        passingMarks: testData.passingMarks,
        instructions: testData.instructions,
        isActive: true,
        createdBy,
        questions: testData.questions ? {
          create: testData.questions.map(q => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            order: q.order
          }))
        } : undefined
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        questions: true,
        _count: {
          select: {
            results: true
          }
        }
      }
    });

    return test as DiagnosticTest;
  }

  /**
   * تحديث اختبار تشخيصي
   */
  async updateDiagnosticTest(
    id: number,
    updates: UpdateDiagnosticTestDto
  ): Promise<DiagnosticTest> {
    const test = await prisma.diagnosticTest.update({
      where: { id },
      data: updates,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        questions: true,
        _count: {
          select: {
            results: true
          }
        }
      }
    });

    return test as DiagnosticTest;
  }

  /**
   * الحصول على اختبار تشخيصي بالمعرف
   */
  async getDiagnosticTestById(id: number): Promise<DiagnosticTest | null> {
    const test = await prisma.diagnosticTest.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        questions: true,
        _count: {
          select: {
            results: true
          }
        }
      }
    });

    return test as DiagnosticTest | null;
  }

  /**
   * الحصول على الاختبارات التشخيصية مع الفلترة والترقيم
   */
  async getDiagnosticTests(filters: DiagnosticTestFilters): Promise<PaginatedDiagnosticTests> {
    const {
      subjectId,
      gradeLevel,
      testType,
      difficulty,
      isActive,
      createdBy,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (subjectId) where.subjectId = subjectId;
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (testType) where.testType = testType;
    if (difficulty) where.difficulty = difficulty;
    if (isActive !== undefined) where.isActive = isActive;
    if (createdBy) where.createdBy = createdBy;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [tests, total] = await Promise.all([
      prisma.diagnosticTest.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              nameAr: true
            }
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              results: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.diagnosticTest.count({ where })
    ]);

    return {
      tests: tests as DiagnosticTest[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * حذف اختبار تشخيصي
   */
  async deleteDiagnosticTest(id: number): Promise<void> {
    await prisma.diagnosticTest.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // ==================== تطبيق الاختبارات ====================

  /**
   * تسجيل نتيجة اختبار
   */
  async conductTest(resultData: CreateTestResultDto): Promise<DiagnosticTestResult> {
    const test = await this.getDiagnosticTestById(resultData.testId);
    if (!test) {
      throw new Error('Diagnostic test not found');
    }

    // حساب النتيجة
    let totalScore = 0;
    const processedAnswers = [];

    for (const answer of resultData.answers) {
      const question = test.questions?.find(q => q.id === answer.questionId);
      if (question) {
        const isCorrect = answer.answer === question.correctAnswer;
        const marksAwarded = isCorrect ? question.marks : 0;
        totalScore += marksAwarded;

        processedAnswers.push({
          ...answer,
          isCorrect,
          marksAwarded
        });
      }
    }

    const percentage = (totalScore / test.totalMarks) * 100;

    // تحليل نقاط الضعف
    const weaknesses = await this.analyzeWeaknesses(processedAnswers, test);

    const result = await prisma.diagnosticTestResult.create({
      data: {
        testId: resultData.testId,
        studentId: resultData.studentId,
        score: totalScore,
        totalMarks: test.totalMarks,
        percentage,
        timeSpent: resultData.timeSpent,
        answers: processedAnswers as any,
        weaknesses: weaknesses as any,
        status: TestResultStatus.COMPLETED,
        completedAt: new Date()
      },
      include: {
        test: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                nameAr: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return {
      ...result,
      answers: processedAnswers,
      weaknesses: weaknesses
    } as DiagnosticTestResult;
  }

  /**
   * الحصول على نتائج الطالب
   */
  async getStudentTestResults(
    studentId: number,
    filters?: TestResultFilters
  ): Promise<PaginatedTestResults> {
    const {
      testId,
      status,
      minScore,
      maxScore,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = 'completedAt',
      sortOrder = 'desc'
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = { studentId };

    if (testId) where.testId = testId;
    if (status) where.status = status;
    if (minScore !== undefined) where.score = { ...where.score, gte: minScore };
    if (maxScore !== undefined) where.score = { ...where.score, lte: maxScore };
    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = dateFrom;
      if (dateTo) where.completedAt.lte = dateTo;
    }

    const [results, total] = await Promise.all([
      prisma.diagnosticTestResult.findMany({
        where,
        include: {
          test: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.diagnosticTestResult.count({ where })
    ]);

    return {
      results: results.map(result => ({
        ...result,
        answers: result.answers as any,
        weaknesses: result.weaknesses as any
      })) as DiagnosticTestResult[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ==================== التحليل والتوصيات ====================

  /**
   * تحليل نتائج الاختبار
   */
  async analyzeTestResults(testId: number): Promise<TestAnalysis> {
    const results = await prisma.diagnosticTestResult.findMany({
      where: { testId, status: TestResultStatus.COMPLETED },
      include: {
        test: {
          include: {
            questions: true
          }
        }
      }
    });

    if (results.length === 0) {
      throw new Error('No completed test results found');
    }

    const totalStudents = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents;
    const passRate = (results.filter(r => r.percentage >= 60).length / totalStudents) * 100;

    // تحليل نقاط الضعف الشائعة
    const weaknessMap = new Map<string, number>();
    results.forEach(result => {
      if (result.weaknesses) {
        const weaknessArray = Array.isArray(result.weaknesses) 
          ? result.weaknesses as any[]
          : JSON.parse(result.weaknesses as string);
        
        weaknessArray.forEach((weakness: any) => {
          const key = `${weakness.type}-${weakness.description}`;
          weaknessMap.set(key, (weaknessMap.get(key) || 0) + 1);
        });
      }
    });

    const commonWeaknesses: WeaknessArea[] = Array.from(weaknessMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const [type, description] = key.split('-');
        return {
          type: type as WeaknessType,
          description,
          severity: count > totalStudents * 0.7 ? 'high' : 
                   count > totalStudents * 0.4 ? 'medium' : 'low',
          relatedTopics: []
        } as WeaknessArea;
      });

    return {
      testId,
      totalStudents,
      averageScore,
      passRate,
      commonWeaknesses,
      difficultyAnalysis: [],
      recommendations: this.generateTestRecommendations(averageScore, passRate, commonWeaknesses)
    };
  }

  /**
   * توليد توصيات التعلم للطالب
   */
  async generateRecommendations(
    studentId: number,
    testResultId: number
  ): Promise<LearningRecommendations> {
    const result = await prisma.diagnosticTestResult.findUnique({
      where: { id: testResultId },
      include: {
        test: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!result) {
      throw new Error('Test result not found');
    }

    const weaknesses = result.weaknesses 
      ? (Array.isArray(result.weaknesses) 
          ? result.weaknesses as any[]
          : JSON.parse(result.weaknesses as string))
      : [];
    const focusAreas = weaknesses.map((w: any) => w.description);
    
    // تحديد الأولوية بناءً على النتيجة
    let priority: 'low' | 'medium' | 'high' = 'low';
    if (result.percentage < 40) priority = 'high';
    else if (result.percentage < 70) priority = 'medium';

    // تقدير وقت الدراسة المطلوب
    const estimatedStudyTime = Math.max(
      weaknesses.length * 2, // ساعتان لكل نقطة ضعف
      result.percentage < 50 ? 10 : 5 // وقت إضافي للدرجات المنخفضة
    );

    return {
      studentId,
      testResultId,
      recoveryPlans: [], // سيتم ربطها لاحقاً
      enhancementPlans: [],
      focusAreas,
      estimatedStudyTime,
      priority
    };
  }

  /**
   * تحديد نقاط الضعف للطالب
   */
  async identifyWeaknesses(studentId: number): Promise<WeaknessAnalysis> {
    const results = await prisma.diagnosticTestResult.findMany({
      where: { 
        studentId,
        status: TestResultStatus.COMPLETED
      },
      include: {
        test: {
          include: {
            subject: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // تجميع نقاط الضعف العامة
    const overallWeaknesses: WeaknessArea[] = [];
    const subjectWeaknessMap = new Map<number, WeaknessArea[]>();

    results.forEach(result => {
      if (result.weaknesses) {
        const weaknessArray = Array.isArray(result.weaknesses) 
          ? result.weaknesses as any[]
          : JSON.parse(result.weaknesses as string);
        overallWeaknesses.push(...weaknessArray);

        const subjectId = result.test.subjectId;
        if (!subjectWeaknessMap.has(subjectId)) {
          subjectWeaknessMap.set(subjectId, []);
        }
        subjectWeaknessMap.get(subjectId)!.push(...weaknessArray);
      }
    });

    // تجميع نقاط الضعف حسب المادة
    const subjectWeaknesses = Array.from(subjectWeaknessMap.entries()).map(([subjectId, weaknesses]) => {
      const subject = results.find(r => r.test.subjectId === subjectId)?.test.subject;
      return {
        subjectId,
        subjectName: subject?.nameAr || subject?.name || 'Unknown',
        weaknesses
      };
    });

    // اتجاه التحسن
    const improvementTrend = results.slice(0, 10).map(result => ({
      date: result.completedAt!,
      score: result.percentage,
      weaknessCount: result.weaknesses 
        ? (Array.isArray(result.weaknesses) 
            ? (result.weaknesses as any[]).length
            : JSON.parse(result.weaknesses as string).length)
        : 0
    }));

    return {
      studentId,
      overallWeaknesses,
      subjectWeaknesses,
      improvementTrend
    };
  }

  // ==================== الإحصائيات والتقارير ====================

  /**
   * الحصول على إحصائيات الاختبارات التشخيصية
   */
  async getDiagnosticTestStatistics(): Promise<DiagnosticTestStatistics> {
    const [
      totalTests,
      activeTests,
      totalResults,
      avgScoreResult,
      passRateResult,
      subjectStats,
      gradeStats,
      difficultyStats
    ] = await Promise.all([
      prisma.diagnosticTest.count(),
      prisma.diagnosticTest.count({ where: { isActive: true } }),
      prisma.diagnosticTestResult.count(),
      prisma.diagnosticTestResult.aggregate({
        _avg: { percentage: true }
      }),
      prisma.diagnosticTestResult.count({
        where: { percentage: { gte: 60 } }
      }),
      prisma.diagnosticTest.groupBy({
        by: ['subjectId'],
        _count: { id: true },
        _avg: { totalMarks: true }
      }),
      prisma.diagnosticTest.groupBy({
        by: ['gradeLevel'],
        _count: { id: true }
      }),
      prisma.diagnosticTest.groupBy({
        by: ['difficulty'],
        _count: { id: true }
      })
    ]);

    const averageScore = avgScoreResult._avg.percentage || 0;
    const passRate = totalResults > 0 ? (passRateResult / totalResults) * 100 : 0;

    return {
      totalTests,
      activeTests,
      totalResults,
      averageScore,
      passRate,
      subjectDistribution: [], // سيتم تحسينها لاحقاً
      gradeDistribution: gradeStats.map(stat => ({
        gradeLevel: stat.gradeLevel,
        testCount: stat._count.id,
        averageScore: 0 // سيتم حسابها لاحقاً
      })),
      difficultyDistribution: difficultyStats.map(stat => ({
        difficulty: stat.difficulty as any,
        testCount: stat._count.id,
        averageScore: 0 // سيتم حسابها لاحقاً
      }))
    };
  }

  /**
   * تقرير أداء الطالب
   */
  async getStudentPerformanceReport(studentId: number): Promise<StudentPerformanceReport> {
    const results = await prisma.diagnosticTestResult.findMany({
      where: { 
        studentId,
        status: TestResultStatus.COMPLETED
      },
      include: {
        test: {
          include: {
            subject: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    const totalTests = await prisma.diagnosticTest.count({
      where: { isActive: true }
    });

    const completedTests = results.length;
    const averageScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
      : 0;

    const improvementTrend = results.slice(0, 10).map(result => ({
      date: result.completedAt!,
      score: result.percentage,
      testTitle: result.test.title
    }));

    // تحليل نقاط الضعف
    const allWeaknesses: any[] = [];
    results.forEach(result => {
      if (result.weaknesses) {
        const weaknessArray = Array.isArray(result.weaknesses) 
          ? result.weaknesses as any[]
          : JSON.parse(result.weaknesses as string);
        allWeaknesses.push(...weaknessArray);
      }
    });

    return {
      studentId,
      totalTests,
      completedTests,
      averageScore,
      improvementTrend,
      weaknessAreas: allWeaknesses,
      recommendations: [],
      strongSubjects: [],
      weakSubjects: []
    };
  }

  // ==================== الدوال المساعدة ====================

  /**
   * تحليل نقاط الضعف من الإجابات
   */
  private async analyzeWeaknesses(answers: any[], test: DiagnosticTest): Promise<WeaknessArea[]> {
    const weaknesses: WeaknessArea[] = [];
    
    const incorrectAnswers = answers.filter(a => !a.isCorrect);
    
    if (incorrectAnswers.length > 0) {
      // تحليل بسيط لنقاط الضعف
      if (incorrectAnswers.length > test.questions!.length * 0.7) {
        weaknesses.push({
          type: WeaknessType.CONCEPTUAL,
          description: 'ضعف في فهم المفاهيم الأساسية',
          severity: 'high',
          relatedTopics: []
        });
      } else if (incorrectAnswers.length > test.questions!.length * 0.4) {
        weaknesses.push({
          type: WeaknessType.PROCEDURAL,
          description: 'ضعف في تطبيق الإجراءات',
          severity: 'medium',
          relatedTopics: []
        });
      }
    }

    return weaknesses;
  }

  /**
   * توليد توصيات للاختبار
   */
  private generateTestRecommendations(
    averageScore: number,
    passRate: number,
    commonWeaknesses: WeaknessArea[]
  ): string[] {
    const recommendations: string[] = [];

    if (averageScore < 50) {
      recommendations.push('يحتاج الطلاب إلى مراجعة شاملة للمفاهيم الأساسية');
    }

    if (passRate < 60) {
      recommendations.push('يُنصح بإعادة تدريس المواضيع الصعبة');
    }

    if (commonWeaknesses.length > 0) {
      recommendations.push(`التركيز على معالجة نقاط الضعف الشائعة: ${commonWeaknesses.map(w => w.description).join(', ')}`);
    }

    return recommendations;
  }
}

export const diagnosticTestService = new DiagnosticTestService();