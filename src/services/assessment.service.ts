import { PrismaClient, QuestionType, AttemptStatus, Difficulty, Prisma } from '@prisma/client';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  AssessmentResponseDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionResponseDto,
  StudentQuestionDto,
  StartAssessmentDto,
  SubmitAnswerDto,
  SubmitAssessmentDto,
  AssessmentAttemptResponseDto,
  StudentAttemptResponseDto,
  AssessmentStatsDto,
  AssessmentFilterDto,
  AttemptFilterDto,
  AssessmentSessionDto,
  AssessmentResultDto,
  BulkCreateQuestionsDto,
  AssessmentAnalyticsDto
} from '../types/assessment.types';

export class AssessmentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Assessment Management
  async createAssessment(data: CreateAssessmentDto, createdBy: number): Promise<AssessmentResponseDto> {
    const assessment = await this.prisma.assessment.create({
      data: {
        ...data,
        totalQuestions: 0, // Will be updated when questions are added
        createdBy,
      },
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapToAssessmentResponse(assessment);
  }

  async updateAssessment(id: number, data: UpdateAssessmentDto, userId: number): Promise<AssessmentResponseDto> {
    // Check if user has permission to update this assessment
    const existingAssessment = await this.prisma.assessment.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existingAssessment) {
      throw new Error('Assessment not found');
    }

    // Only creator or admin can update assessment
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (existingAssessment.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to update this assessment');
    }

    const updateData: any = { ...data };
    if (data.isPublished && !existingAssessment) {
      updateData.publishedAt = new Date();
    }

    const assessment = await this.prisma.assessment.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapToAssessmentResponse(assessment);
  }

  async deleteAssessment(id: number, userId: number): Promise<void> {
    // Check if user has permission to delete this assessment
    const existingAssessment = await this.prisma.assessment.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existingAssessment) {
      throw new Error('Assessment not found');
    }

    // Only creator or admin can delete assessment
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (existingAssessment.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to delete this assessment');
    }

    await this.prisma.assessment.delete({
      where: { id },
    });
  }

  async getAssessment(id: number, includeQuestions: boolean = false): Promise<AssessmentResponseDto | null> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        questions: includeQuestions ? {
          orderBy: { orderIndex: 'asc' },
        } : false,
      },
    });

    if (!assessment) {
      return null;
    }

    return this.mapToAssessmentResponse(assessment);
  }

  async getAssessmentByUuid(uuid: string, includeQuestions: boolean = false): Promise<AssessmentResponseDto | null> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { uuid },
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        questions: includeQuestions ? {
          orderBy: { orderIndex: 'asc' },
        } : false,
      },
    });

    if (!assessment) {
      return null;
    }

    return this.mapToAssessmentResponse(assessment);
  }

  async getAssessmentList(filters: AssessmentFilterDto): Promise<{
    assessments: AssessmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      subjectId,
      gradeLevel,
      difficultyLevel,
      isPublished,
      createdBy,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.AssessmentWhereInput = {};

    if (subjectId) where.subjectId = subjectId;
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (difficultyLevel) where.difficultyLevel = difficultyLevel;
    if (isPublished !== undefined) where.isPublished = isPublished;
    if (createdBy) where.createdBy = createdBy;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy: Prisma.AssessmentOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [assessments, total] = await Promise.all([
      this.prisma.assessment.findMany({
        where,
        include: {
          subject: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.assessment.count({ where }),
    ]);

    return {
      assessments: assessments.map(this.mapToAssessmentResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Question Management
  async addQuestion(assessmentId: number, data: CreateQuestionDto, userId: number): Promise<QuestionResponseDto> {
    // Check if user has permission to modify this assessment
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { createdBy: true },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (assessment.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to modify this assessment');
    }

    const question = await this.prisma.assessmentQuestion.create({
      data: {
        ...data,
        assessmentId,
        options: data.options ? data.options : undefined,
      },
    });

    // Update total questions count
    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        totalQuestions: {
          increment: 1,
        },
      },
    });

    return this.mapToQuestionResponse(question);
  }

  async updateQuestion(id: number, data: UpdateQuestionDto, userId: number): Promise<QuestionResponseDto> {
    // Check if user has permission to modify this question
    const question = await this.prisma.assessmentQuestion.findUnique({
      where: { id },
      include: {
        assessment: {
          select: { createdBy: true },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (question.assessment.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to modify this question');
    }

    const updateData: any = { ...data };
    if (data.options !== undefined) {
      updateData.options = data.options ? data.options : undefined;
    }

    const updatedQuestion = await this.prisma.assessmentQuestion.update({
      where: { id },
      data: updateData,
    });

    return this.mapToQuestionResponse(updatedQuestion);
  }

  async deleteQuestion(id: number, userId: number): Promise<void> {
    // Check if user has permission to modify this question
    const question = await this.prisma.assessmentQuestion.findUnique({
      where: { id },
      include: {
        assessment: {
          select: { createdBy: true },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (question.assessment.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to modify this question');
    }

    await this.prisma.assessmentQuestion.delete({
      where: { id },
    });

    // Update total questions count
    await this.prisma.assessment.update({
      where: { id: question.assessmentId },
      data: {
        totalQuestions: {
          decrement: 1,
        },
      },
    });
  }

  async bulkCreateQuestions(data: BulkCreateQuestionsDto, userId: number): Promise<QuestionResponseDto[]> {
    // Check if user has permission to modify this assessment
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: data.assessmentId },
      select: { createdBy: true },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (assessment.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to modify this assessment');
    }

    const questions = await this.prisma.$transaction(async (tx) => {
      const createdQuestions = [];
      
      for (const questionData of data.questions) {
        const question = await tx.assessmentQuestion.create({
          data: {
            ...questionData,
            assessmentId: data.assessmentId,
            options: questionData.options ? questionData.options : undefined,
          },
        });
        createdQuestions.push(question);
      }

      // Update total questions count
      await tx.assessment.update({
        where: { id: data.assessmentId },
        data: {
          totalQuestions: {
            increment: data.questions.length,
          },
        },
      });

      return createdQuestions;
    });

    return questions.map(this.mapToQuestionResponse);
  }

  // Assessment Taking
  async startAssessment(assessmentId: number, studentId: number): Promise<AssessmentAttemptResponseDto> {
    // Check if assessment exists and is published
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        maxAttempts: true,
        durationMinutes: true,
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (!assessment.isPublished) {
      throw new Error('Assessment is not published');
    }

    // Check if student has exceeded max attempts
    const attemptCount = await this.prisma.assessmentAttempt.count({
      where: {
        assessmentId,
        studentId,
        status: { in: ['completed', 'submitted', 'auto_submitted'] },
      },
    });

    if (attemptCount >= assessment.maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }

    // Check if student has an active attempt
    const activeAttempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        studentId,
        status: 'in_progress',
      },
    });

    if (activeAttempt) {
      throw new Error('You already have an active attempt for this assessment');
    }

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        studentId,
        status: 'in_progress',
        answers: {},
      },
      include: {
        assessment: {
          select: { title: true },
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapToAttemptResponse(attempt);
  }

  async getAssessmentForStudent(assessmentId: number, studentId: number): Promise<{
    assessment: AssessmentResponseDto;
    questions: StudentQuestionDto[];
    attempt?: AssessmentAttemptResponseDto;
  }> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (!assessment.isPublished) {
      throw new Error('Assessment is not published');
    }

    // Get active attempt if exists
    const activeAttempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        studentId,
        status: 'in_progress',
      },
      include: {
        assessment: {
          select: { title: true },
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const studentQuestions: StudentQuestionDto[] = assessment.questions.map((q) => ({
      id: q.id,
      assessmentId: q.assessmentId,
      questionText: q.questionText,
      questionType: q.questionType,
      options: Array.isArray(q.options) ? q.options as string[] : undefined,
      points: q.points,
      orderIndex: q.orderIndex,
    }));

    return {
      assessment: this.mapToAssessmentResponse(assessment),
      questions: studentQuestions,
      attempt: activeAttempt ? this.mapToAttemptResponse(activeAttempt) : undefined,
    };
  }

  async submitAnswer(attemptId: number, questionId: number, answer: string, studentId: number): Promise<void> {
    // Verify the attempt belongs to the student and is active
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: {
        studentId: true,
        status: true,
        answers: true,
      },
    });

    if (!attempt) {
      throw new Error('Assessment attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new Error('Unauthorized to modify this attempt');
    }

    if (attempt.status !== 'in_progress') {
      throw new Error('Assessment attempt is not active');
    }

    // Update the answers
    const currentAnswers = (attempt.answers as Record<string, string>) || {};
    currentAnswers[questionId.toString()] = answer;

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        answers: currentAnswers,
      },
    });
  }

  async submitAssessment(attemptId: number, studentId: number): Promise<AssessmentResultDto> {
    // Verify the attempt belongs to the student and is active
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new Error('Assessment attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new Error('Unauthorized to submit this attempt');
    }

    if (attempt.status !== 'in_progress') {
      throw new Error('Assessment attempt is not active');
    }

    // Calculate scores
    const answers = (attempt.answers as Record<string, string>) || {};
    let totalScore = 0;
    let maxScore = 0;
    const questionResults = [];

    for (const question of attempt.assessment.questions) {
      const studentAnswer = answers[question.id.toString()] || '';
      const isCorrect = this.checkAnswer(question, studentAnswer);
      const earnedPoints = isCorrect ? question.points : 0;

      totalScore += earnedPoints;
      maxScore += question.points;

      questionResults.push({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: question.points,
        earnedPoints,
      });
    }

    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentageScore >= attempt.assessment.passingScore;
    const timeSpent = Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000);

    // Update the attempt
    const updatedAttempt = await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'submitted',
        completedAt: new Date(),
        submittedAt: new Date(),
        totalScore,
        maxScore,
        percentageScore,
        timeSpent,
      },
    });

    return {
      attemptId: updatedAttempt.id,
      assessmentTitle: attempt.assessment.title,
      studentName: `${attempt.student.firstName} ${attempt.student.lastName}`,
      totalScore,
      maxScore,
      percentageScore,
      passed,
      timeSpent,
      completedAt: updatedAttempt.completedAt!,
      questionResults,
    };
  }

  async autoSubmitExpiredAttempts(): Promise<number> {
    const expiredAttempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        status: 'in_progress',
        startedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
      include: {
        assessment: {
          select: {
            durationMinutes: true,
            questions: true,
          },
        },
      },
    });

    let autoSubmittedCount = 0;

    for (const attempt of expiredAttempts) {
      const timeLimit = attempt.assessment.durationMinutes * 60 * 1000; // Convert to milliseconds
      const timeElapsed = new Date().getTime() - attempt.startedAt.getTime();

      if (timeElapsed >= timeLimit) {
        // Auto-submit this attempt
        const answers = (attempt.answers as Record<string, string>) || {};
        let totalScore = 0;
        let maxScore = 0;

        for (const question of attempt.assessment.questions) {
          const studentAnswer = answers[question.id.toString()] || '';
          const isCorrect = this.checkAnswer(question, studentAnswer);
          const earnedPoints = isCorrect ? question.points : 0;

          totalScore += earnedPoints;
          maxScore += question.points;
        }

        const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        await this.prisma.assessmentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'auto_submitted',
            completedAt: new Date(),
            submittedAt: new Date(),
            totalScore,
            maxScore,
            percentageScore,
            timeSpent: Math.floor(timeElapsed / 1000),
          },
        });

        autoSubmittedCount++;
      }
    }

    return autoSubmittedCount;
  }

  // Assessment Statistics and Analytics
  async getAssessmentStats(): Promise<AssessmentStatsDto> {
    const [
      totalAssessments,
      publishedAssessments,
      totalAttempts,
      completedAttempts,
      assessmentsBySubject,
      assessmentsByGrade,
      assessmentsByDifficulty,
      averageScoreResult,
      passRateResult,
      recentAttempts,
    ] = await Promise.all([
      this.prisma.assessment.count(),
      this.prisma.assessment.count({ where: { isPublished: true } }),
      this.prisma.assessmentAttempt.count(),
      this.prisma.assessmentAttempt.count({
        where: { status: { in: ['completed', 'submitted', 'auto_submitted'] } },
      }),
      this.prisma.assessment.groupBy({
        by: ['subjectId'],
        _count: true,
      }),
      this.prisma.assessment.groupBy({
        by: ['gradeLevel'],
        _count: true,
      }),
      this.prisma.assessment.groupBy({
        by: ['difficultyLevel'],
        _count: true,
      }),
      this.prisma.assessmentAttempt.aggregate({
        _avg: { percentageScore: true },
        where: { status: { in: ['completed', 'submitted', 'auto_submitted'] } },
      }),
      this.prisma.assessmentAttempt.count({
        where: {
          status: { in: ['completed', 'submitted', 'auto_submitted'] },
          percentageScore: { gte: 60 }, // Assuming 60% is passing
        },
      }),
      this.prisma.assessmentAttempt.findMany({
        take: 10,
        orderBy: { completedAt: 'desc' },
        where: { status: { in: ['completed', 'submitted', 'auto_submitted'] } },
        include: {
          assessment: { select: { title: true } },
          student: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    // Map subjects
    const subjects = await this.prisma.subject.findMany({
      select: { id: true, name: true },
    });
    const subjectMap: Record<string, number> = {};
    assessmentsBySubject.forEach((item) => {
      const subject = subjects.find((s) => s.id === item.subjectId);
      if (subject) {
        subjectMap[subject.name] = item._count;
      }
    });

    // Map grades
    const gradeMap: Record<number, number> = {};
    assessmentsByGrade.forEach((item) => {
      gradeMap[item.gradeLevel] = item._count;
    });

    // Map difficulty
    const difficultyMap: Record<Difficulty, number> = {} as any;
    assessmentsByDifficulty.forEach((item) => {
      difficultyMap[item.difficultyLevel] = item._count;
    });

    return {
      totalAssessments,
      publishedAssessments,
      draftAssessments: totalAssessments - publishedAssessments,
      totalAttempts,
      completedAttempts,
      averageScore: averageScoreResult._avg.percentageScore || 0,
      passRate: completedAttempts > 0 ? (passRateResult / completedAttempts) * 100 : 0,
      assessmentsBySubject: subjectMap,
      assessmentsByGrade: gradeMap,
      assessmentsByDifficulty: difficultyMap,
      recentAttempts: recentAttempts.map(this.mapToAttemptResponse),
    };
  }

  // Helper methods
  private checkAnswer(question: any, studentAnswer: string): boolean {
    const correctAnswer = question.correctAnswer.toLowerCase().trim();
    const studentAnswerNormalized = studentAnswer.toLowerCase().trim();

    switch (question.questionType) {
      case 'multiple_choice':
      case 'true_false':
        return correctAnswer === studentAnswerNormalized;
      case 'fill_blank':
        // For fill in the blank, we can have multiple correct answers separated by |
        const correctAnswers = correctAnswer.split('|').map((a: string) => a.trim());
        return correctAnswers.includes(studentAnswerNormalized);
      case 'essay':
        // For essay questions, manual grading is required
        // For now, we'll return false and require manual grading
        return false;
      default:
        return false;
    }
  }

  private mapToAssessmentResponse(assessment: any): AssessmentResponseDto {
    return {
      id: assessment.id,
      uuid: assessment.uuid,
      title: assessment.title,
      description: assessment.description,
      subjectId: assessment.subjectId,
      subjectName: assessment.subject.name,
      gradeLevel: assessment.gradeLevel,
      difficultyLevel: assessment.difficultyLevel,
      durationMinutes: assessment.durationMinutes,
      totalQuestions: assessment.totalQuestions,
      passingScore: assessment.passingScore,
      maxAttempts: assessment.maxAttempts,
      isPublished: assessment.isPublished,
      publishedAt: assessment.publishedAt,
      createdBy: assessment.createdBy,
      creatorName: `${assessment.creator.firstName} ${assessment.creator.lastName}`,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      questions: assessment.questions ? assessment.questions.map(this.mapToQuestionResponse) : undefined,
    };
  }

  private mapToQuestionResponse(question: any): QuestionResponseDto {
    return {
      id: question.id,
      assessmentId: question.assessmentId,
      questionText: question.questionText,
      questionType: question.questionType,
      options: Array.isArray(question.options) ? question.options as string[] : undefined,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points: question.points,
      orderIndex: question.orderIndex,
    };
  }

  private mapToAttemptResponse(attempt: any): AssessmentAttemptResponseDto {
    return {
      id: attempt.id,
      uuid: attempt.uuid,
      assessmentId: attempt.assessmentId,
      assessmentTitle: attempt.assessment?.title || '',
      studentId: attempt.studentId,
      studentName: attempt.student ? `${attempt.student.firstName} ${attempt.student.lastName}` : '',
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      submittedAt: attempt.submittedAt,
      status: attempt.status,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentageScore: attempt.percentageScore,
      timeSpent: attempt.timeSpent,
      answers: attempt.answers as Record<number, string>,
      passed: attempt.percentageScore ? attempt.percentageScore >= 60 : undefined, // Assuming 60% is passing
    };
  }
}